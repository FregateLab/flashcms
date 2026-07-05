'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { db, sites } from '@/db';
import { getCurrentSite } from '@/lib/site';
import {
  DEFAULT_FOOTER,
  DEFAULT_HEADER,
  type FooterConfig,
  type HeaderConfig,
} from './site-settings';

export type SiteSettingsState = { error?: string; ok?: boolean };

// ---- update header ----------------------------------------------------
export async function saveHeaderConfig(
  _prev: SiteSettingsState,
  formData: FormData,
): Promise<SiteSettingsState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  let cfg: HeaderConfig;
  try {
    cfg = JSON.parse(String(formData.get('config') ?? '')) as HeaderConfig;
  } catch {
    return { error: 'Invalid config JSON.' };
  }
  if (!cfg || !Array.isArray(cfg.primaryNav) || !cfg.mega) {
    return { error: 'Header must have primaryNav and mega.' };
  }

  const site = await getCurrentSite();
  await db.update(sites).set({ header: cfg }).where(eq(sites.id, site.id));
  revalidatePath('/', 'layout');
  revalidateTag('site-chrome');
  return { ok: true };
}

// ---- update footer ----------------------------------------------------
export async function saveFooterConfig(
  _prev: SiteSettingsState,
  formData: FormData,
): Promise<SiteSettingsState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  let cfg: FooterConfig;
  try {
    cfg = JSON.parse(String(formData.get('config') ?? '')) as FooterConfig;
  } catch {
    return { error: 'Invalid config JSON.' };
  }
  if (!cfg || !cfg.newsletter || !Array.isArray(cfg.columns) || !cfg.bottom) {
    return { error: 'Footer is missing required sections.' };
  }

  const site = await getCurrentSite();
  await db.update(sites).set({ footer: cfg }).where(eq(sites.id, site.id));
  revalidatePath('/', 'layout');
  revalidateTag('site-chrome');
  return { ok: true };
}

// ---- reset to defaults (nice-to-have) --------------------------------
export async function resetHeaderConfig(): Promise<SiteSettingsState> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') return { error: 'Admins only.' };
  const site = await getCurrentSite();
  await db.update(sites).set({ header: DEFAULT_HEADER }).where(eq(sites.id, site.id));
  revalidatePath('/', 'layout');
  revalidateTag('site-chrome');
  return { ok: true };
}

export async function resetFooterConfig(): Promise<SiteSettingsState> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') return { error: 'Admins only.' };
  const site = await getCurrentSite();
  await db.update(sites).set({ footer: DEFAULT_FOOTER }).where(eq(sites.id, site.id));
  revalidatePath('/', 'layout');
  revalidateTag('site-chrome');
  return { ok: true };
}
