'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidateTag, unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, pages, pageVersions } from '@/db';
import { getCurrentSite } from '@/lib/site';
import { findKnownPage } from '@/lib/known-routes';

const puckData = z
  .object({
    content: z.array(z.unknown()).optional(),
    root: z.record(z.string(), z.unknown()).optional(),
    zones: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const upsertInput = z.object({
  slug: z.string().min(1).max(255),
  data: puckData,
  action: z.enum(['draft', 'publish']),
});

export type PageFormState = { error?: string; ok?: boolean };
export type SeoFormState = { error?: string; ok?: boolean };

// SEO fields stored under pages.seo. Every field is optional; empty
// strings coerce to null.
const seoInput = z.object({
  slug: z.string().min(1),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(400).optional().nullable(),
  image: z.string().url().optional().nullable().or(z.literal('').transform(() => null)),
  canonical: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  noindex: z.coerce.boolean().default(false),
});

export type PageSeo = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  canonical?: string | null;
  noindex?: boolean;
};

// ---- reads --------------------------------------------------------------
export async function listPagesFromDb() {
  const site = await getCurrentSite();
  return db.select().from(pages).where(eq(pages.siteId, site.id));
}

export async function getPageBySlugForAdmin(slug: string) {
  const site = await getCurrentSite();
  const [row] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.siteId, site.id)));
  return row ?? null;
}

export async function getPageEditableData(slug: string) {
  const page = await getPageBySlugForAdmin(slug);
  if (!page) return null;
  if (page.published) return page.published;
  const [latest] = await db
    .select()
    .from(pageVersions)
    .where(eq(pageVersions.pageId, page.id))
    .orderBy(desc(pageVersions.createdAt))
    .limit(1);
  return latest?.data ?? null;
}

// ---- public read (cache-tagged) ----------------------------------------
export async function getPublishedPageBySlug(slug: string) {
  const loader = unstable_cache(
    async () => {
      const site = await getCurrentSite();
      const [row] = await db
        .select()
        .from(pages)
        .where(and(eq(pages.siteId, site.id), eq(pages.slug, slug)));
      if (!row?.published) return null;
      return row;
    },
    ['published-page', slug],
    { tags: ['pages', `page:${slug}`] },
  );
  return loader();
}

// ---- write action -------------------------------------------------------
export async function savePage(
  _prev: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  const rawSlug = String(formData.get('slug') ?? '');
  if (!findKnownPage(rawSlug)) return { error: `Unknown page slug: ${rawSlug}` };

  let dataJson: unknown;
  try {
    dataJson = JSON.parse(String(formData.get('data') ?? '{}'));
  } catch {
    return { error: 'Editor payload was not valid JSON.' };
  }

  const parsed = upsertInput.safeParse({
    slug: rawSlug,
    data: dataJson,
    action: formData.get('action'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const input = parsed.data;
  const site = await getCurrentSite();
  const authorId = session.user.id!;
  const now = new Date();
  const publishing = input.action === 'publish';
  const knownPage = findKnownPage(input.slug)!;

  const [existing] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, input.slug)));

  let pageId: string;
  if (existing) {
    pageId = existing.id;
    await db
      .update(pages)
      .set({
        title: knownPage.label,
        published: publishing ? input.data : undefined,
        publishedAt: publishing ? now : undefined,
        updatedAt: now,
      })
      .where(eq(pages.id, pageId));
  } else {
    const [row] = await db
      .insert(pages)
      .values({
        siteId: site.id,
        title: knownPage.label,
        slug: input.slug,
        published: publishing ? input.data : null,
        publishedAt: publishing ? now : null,
      })
      .returning({ id: pages.id });
    pageId = row.id;
  }

  await db.insert(pageVersions).values({
    pageId,
    data: input.data,
    createdBy: authorId,
  });

  if (publishing) {
    revalidateTag('pages');
    revalidateTag(`page:${input.slug}`);
  }

  // Admin URL uses the slash-preserved slug directly.
  redirect(`/admin/pages/${input.slug}?saved=1`);
}

// ---- SEO ---------------------------------------------------------------
export async function savePageSeo(
  _prev: SeoFormState,
  formData: FormData,
): Promise<SeoFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  const parsed = seoInput.safeParse({
    slug: formData.get('slug'),
    title: formData.get('title'),
    description: formData.get('description'),
    image: formData.get('image'),
    canonical: formData.get('canonical'),
    noindex: formData.get('noindex') === 'true',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const seo: PageSeo = {
    title: parsed.data.title?.trim() || null,
    description: parsed.data.description?.trim() || null,
    image: parsed.data.image ?? null,
    canonical: parsed.data.canonical ?? null,
    noindex: parsed.data.noindex,
  };

  const site = await getCurrentSite();
  await db
    .update(pages)
    .set({ seo, updatedAt: new Date() })
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, parsed.data.slug)));

  revalidateTag('pages');
  revalidateTag(`page:${parsed.data.slug}`);
  return { ok: true };
}

export async function getPageSeo(slug: string): Promise<PageSeo | null> {
  const site = await getCurrentSite();
  const [row] = await db
    .select({ seo: pages.seo })
    .from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, slug)));
  return (row?.seo as PageSeo | null) ?? null;
}
