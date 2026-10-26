'use server';

import { and, desc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { sendMail } from '@/lib/email';
import { subscribeWelcomeEmail } from '@/lib/emails/subscribe-welcome';
import { getCurrentSite } from '@/lib/site';
import { getFooterConfig } from '@/lib/site-settings';
import { db, newsletterSubscribers } from '@/db';

export type SubscribeState = {
  ok?: boolean;
  error?: string;
  // Distinguish "already subscribed" from a real success so the UI can
  // show a friendly message instead of a generic success.
  already?: boolean;
};

const emailSchema = z.string().email().max(320);

// ---- public: subscribe --------------------------------------------------
export async function subscribeToNewsletter(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const ack = String(formData.get('ack') ?? '') === 'on';

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { error: 'Please enter a valid email address.' };
  if (!ack) {
    return {
      error:
        'Please confirm you agree to receive newsletter emails before subscribing.',
    };
  }

  const site = await getCurrentSite();

  // Upsert by (site_id, email). If the row exists and is unsubscribed,
  // re-activate it. If it exists and is already subscribed, treat as
  // idempotent success.
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.siteId, site.id),
        eq(newsletterSubscribers.email, parsed.data),
      ),
    );

  let unsubscribeToken: string;

  if (existing) {
    unsubscribeToken = existing.unsubscribeToken;
    if (existing.status === 'subscribed') {
      return { ok: true, already: true };
    }
    // Re-subscribe: flip status + clear unsubscribedAt.
    await db
      .update(newsletterSubscribers)
      .set({
        status: 'subscribed',
        ackConsent: true,
        subscribedAt: new Date(),
        unsubscribedAt: null,
      })
      .where(eq(newsletterSubscribers.id, existing.id));
  } else {
    const [row] = await db
      .insert(newsletterSubscribers)
      .values({
        siteId: site.id,
        email: parsed.data,
        status: 'subscribed',
        ackConsent: true,
        source: 'footer',
      })
      .returning({ unsubscribeToken: newsletterSubscribers.unsubscribeToken });
    unsubscribeToken = row.unsubscribeToken;
  }

  // Fire-and-forget welcome email. The row is already saved — a mail
  // failure shouldn't undo the subscription.
  await sendWelcomeEmail(parsed.data, unsubscribeToken, site.name, site.domain).catch((err) => {
    console.error('[newsletter] welcome email failed:', err);
  });

  revalidatePath('/admin/newsletter');
  return { ok: true };
}

// Origin used for links inside outgoing email. Prefer configuration
// (SITE_URL, then https://<sites.domain>) over request headers: the
// Host / X-Forwarded-Host headers are client-controlled, and anyone can
// submit the public form with an arbitrary recipient — trusting them
// would let an attacker make this site mail phishing links on its own
// letterhead. Headers are only a last resort for local development.
async function resolveSiteOrigin(siteDomain: string | null | undefined) {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured;
  if (siteDomain) {
    return /^https?:\/\//.test(siteDomain)
      ? siteDomain.replace(/\/+$/, '')
      : `https://${siteDomain}`;
  }
  if (process.env.NODE_ENV === 'production') return '';
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  return host ? `${proto}://${host}` : '';
}

async function sendWelcomeEmail(
  to: string,
  unsubscribeToken: string,
  siteName: string,
  siteDomain: string | null | undefined,
) {
  const siteOrigin = await resolveSiteOrigin(siteDomain);
  if (!siteOrigin) {
    console.warn(
      '[newsletter] no SITE_URL / sites.domain configured — skipping welcome email',
    );
    return;
  }

  // Pull the logo from the site's footer config so each site's welcome
  // email shows the right brand mark. Fallback resolves an absolute URL
  // if the config value is a relative path.
  const footer = await getFooterConfig();
  const rawLogo = footer.brand.imageUrl || '';
  const logoUrl = !rawLogo
    ? ''
    : /^https?:/.test(rawLogo)
      ? rawLogo
      : `${siteOrigin}${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`;

  const { subject, html, text } = subscribeWelcomeEmail({
    siteOrigin,
    siteName,
    logoUrl,
    unsubscribeToken,
  });

  await sendMail({ to, subject, html, text });
}

// ---- public: unsubscribe via token --------------------------------------
export async function unsubscribeByToken(
  token: string,
): Promise<{ ok: boolean; email?: string; alreadyUnsubscribed?: boolean }> {
  // unsubscribe_token is a uuid column — a malformed value would make
  // Postgres throw on the cast, so reject it up front.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token ?? '')) {
    return { ok: false };
  }

  const [row] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.unsubscribeToken, token));
  if (!row) return { ok: false };

  if (row.status === 'unsubscribed') {
    return { ok: true, email: row.email, alreadyUnsubscribed: true };
  }

  await db
    .update(newsletterSubscribers)
    .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
    .where(eq(newsletterSubscribers.id, row.id));

  revalidatePath('/admin/newsletter');
  return { ok: true, email: row.email };
}

// ---- admin --------------------------------------------------------------
async function requireAdmin() {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated.');
  if ((user as { role?: string }).role !== 'admin') {
    throw new Error('Admins only.');
  }
  return user;
}

export type SubscriberFilter = 'active' | 'unsubscribed' | 'all';

export async function listSubscribers(
  filter: SubscriberFilter = 'active',
  query: string = '',
) {
  await requireAdmin();
  const site = await getCurrentSite();
  const trimmed = query.trim().toLowerCase();

  const conditions = [eq(newsletterSubscribers.siteId, site.id)];
  if (filter === 'active') conditions.push(eq(newsletterSubscribers.status, 'subscribed'));
  if (filter === 'unsubscribed') conditions.push(eq(newsletterSubscribers.status, 'unsubscribed'));
  if (trimmed) {
    const pattern = '%' + trimmed.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
    conditions.push(sql`${newsletterSubscribers.email} ILIKE ${pattern}`);
  }

  return db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      status: newsletterSubscribers.status,
      source: newsletterSubscribers.source,
      subscribedAt: newsletterSubscribers.subscribedAt,
      unsubscribedAt: newsletterSubscribers.unsubscribedAt,
    })
    .from(newsletterSubscribers)
    .where(and(...conditions))
    .orderBy(desc(newsletterSubscribers.subscribedAt));
}

export async function subscriberCounts() {
  await requireAdmin();
  const site = await getCurrentSite();
  const rows = await db
    .select({
      status: newsletterSubscribers.status,
      n: sql<number>`count(*)::int`,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.siteId, site.id))
    .groupBy(newsletterSubscribers.status);
  const map = Object.fromEntries(rows.map((r) => [r.status, r.n]));
  return {
    active: map['subscribed'] ?? 0,
    unsubscribed: map['unsubscribed'] ?? 0,
    total: (map['subscribed'] ?? 0) + (map['unsubscribed'] ?? 0),
  };
}

export type AdminActionState = { ok?: boolean; error?: string };

export async function adminUnsubscribe(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await requireAdmin();
    const id = String(formData.get('id') ?? '');
    if (!id) return { error: 'Missing subscriber id.' };
    const site = await getCurrentSite();
    await db
      .update(newsletterSubscribers)
      .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
      .where(
        and(eq(newsletterSubscribers.id, id), eq(newsletterSubscribers.siteId, site.id)),
      );
    revalidatePath('/admin/newsletter');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }
}

export async function adminResubscribe(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await requireAdmin();
    const id = String(formData.get('id') ?? '');
    if (!id) return { error: 'Missing subscriber id.' };
    const site = await getCurrentSite();
    await db
      .update(newsletterSubscribers)
      .set({ status: 'subscribed', unsubscribedAt: null, subscribedAt: new Date() })
      .where(
        and(eq(newsletterSubscribers.id, id), eq(newsletterSubscribers.siteId, site.id)),
      );
    revalidatePath('/admin/newsletter');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }
}
