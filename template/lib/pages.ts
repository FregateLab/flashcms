'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidateTag, unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, pages, pageVersions, postCategories } from '@/db';
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

// Every savePage / duplicatePage call writes a page_versions row, so the
// newest version is always the most recent edit (draft OR publish).
// Load that first so unpublished drafts survive a reload; fall back to
// `published` for rows that were written without a version (seeds).
export async function getPageEditableData(slug: string) {
  const page = await getPageBySlugForAdmin(slug);
  if (!page) return null;
  const [latest] = await db
    .select()
    .from(pageVersions)
    .where(eq(pageVersions.pageId, page.id))
    .orderBy(desc(pageVersions.createdAt))
    .limit(1);
  return latest?.data ?? page.published ?? null;
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

// ---- slug rules for custom (non-known-route) pages ---------------------
// Custom pages are served by the frontend catch-all route
// (snippets/catch-all-page.tsx), so their first path segment must not
// shadow a route the app already owns. EXTENSION POINT: add your
// project's hand-coded top-level routes here if they aren't listed in
// lib/known-routes.ts (known routes are rejected separately).
const RESERVED_SLUG_ROOTS = new Set([
  'admin',
  'api',
  'unsubscribe',
  '_next',
  'assets',
  'v1',
  'blog',
  'press',
  'gallery',
]);

const CUSTOM_SLUG_RE = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/;

function customSlugError(slug: string): string | null {
  if (!CUSTOM_SLUG_RE.test(slug)) {
    return 'Slug must be kebab-case (letters, digits, hyphens, optional slashes).';
  }
  const root = slug.split('/')[0];
  if (RESERVED_SLUG_ROOTS.has(root)) {
    return `"/${root}" is a reserved path — pick another slug.`;
  }
  return null;
}

// ---- write action -------------------------------------------------------
export async function savePage(
  _prev: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  const rawSlug = String(formData.get('slug') ?? '');
  // Accept both known routes AND custom slugs. Custom slugs must be
  // valid kebab-case (letters/digits/hyphens/slashes) so the catch-all
  // frontend route can safely serve them.
  const known = findKnownPage(rawSlug);
  if (!known) {
    const slugError = customSlugError(rawSlug);
    if (slugError) return { error: `Invalid page slug "${rawSlug}": ${slugError}` };
  }

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

  const [existing] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, input.slug)));

  // For known routes, the label is authoritative; for custom pages
  // keep whatever was set when the page was created.
  const title = known?.label ?? existing?.title ?? input.slug;

  let pageId: string;
  if (existing) {
    pageId = existing.id;
    await db
      .update(pages)
      .set({
        title,
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
        title,
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

// ---- duplicate ---------------------------------------------------------
// Copies the source page's Puck document (published or draft snapshot)
// into the target slug. Target must be either a KNOWN route or an
// existing custom page (create one first with "New page…"). Writes a
// new draft version on the target; only publishes if `publish=true`.
async function requireAdmin() {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated.');
  if ((user as { role?: string }).role !== 'admin') {
    throw new Error('Admins only.');
  }
  return user;
}

export async function duplicatePage(
  _prev: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  try {
    await requireAdmin();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }

  const sourceSlug = String(formData.get('sourceSlug') ?? '').trim();
  const targetSlug = String(formData.get('targetSlug') ?? '').trim();
  const publish = String(formData.get('publish') ?? '') === 'true';

  if (!sourceSlug || !targetSlug) {
    return { error: 'Both sourceSlug and targetSlug are required.' };
  }
  if (sourceSlug === targetSlug) {
    return { error: "Source and target can't be the same page." };
  }
  const targetKnown = findKnownPage(targetSlug);
  const site = await getCurrentSite();

  const [existingTarget] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, targetSlug)));

  if (!targetKnown && !existingTarget) {
    return {
      error:
        `Target "${targetSlug}" isn't a known route or an existing custom page. Create it with "New page…" first.`,
    };
  }
  if (targetKnown && !targetKnown.ready) {
    return { error: `Target "${targetSlug}" isn't ready for editing yet.` };
  }
  const targetTitle = targetKnown?.label ?? existingTarget?.title ?? targetSlug;

  const [source] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, sourceSlug)));
  if (!source) return { error: `Source page "${sourceSlug}" not found.` };

  // Prefer the published doc; fall back to latest draft snapshot.
  let sourceDoc = source.published;
  if (!sourceDoc) {
    const [latest] = await db
      .select()
      .from(pageVersions)
      .where(eq(pageVersions.pageId, source.id))
      .orderBy(desc(pageVersions.createdAt))
      .limit(1);
    sourceDoc = latest?.data ?? null;
  }
  if (!sourceDoc) {
    return { error: `Source page "${sourceSlug}" has no content to copy.` };
  }

  const now = new Date();
  const session = await auth();
  const authorId = session?.user?.id ?? null;

  let targetId: string;
  if (existingTarget) {
    targetId = existingTarget.id;
    await db
      .update(pages)
      .set({
        title: targetTitle,
        published: publish ? sourceDoc : existingTarget.published,
        publishedAt: publish ? now : existingTarget.publishedAt,
        updatedAt: now,
      })
      .where(eq(pages.id, targetId));
  } else {
    const [row] = await db
      .insert(pages)
      .values({
        siteId: site.id,
        title: targetTitle,
        slug: targetSlug,
        published: publish ? sourceDoc : null,
        publishedAt: publish ? now : null,
      })
      .returning({ id: pages.id });
    targetId = row.id;
  }

  // Always snapshot as a draft version so the target has editable
  // content on next open, even if the caller chose not to publish.
  await db.insert(pageVersions).values({
    pageId: targetId,
    data: sourceDoc,
    createdBy: authorId,
  });

  revalidateTag('pages');
  revalidateTag(`page:${targetSlug}`);
  return { ok: true };
}

// ---- link a page to a category ----------------------------------------
export async function updatePageCategory(
  _prev: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  try {
    await requireAdmin();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }

  const slug = String(formData.get('slug') ?? '').trim();
  const categoryIdRaw = String(formData.get('categoryId') ?? '').trim();
  const categoryId = categoryIdRaw === '' ? null : categoryIdRaw;

  if (!slug) return { error: 'Missing page slug.' };
  const site = await getCurrentSite();

  if (categoryId) {
    const [cat] = await db
      .select({ id: postCategories.id })
      .from(postCategories)
      .where(and(eq(postCategories.id, categoryId), eq(postCategories.siteId, site.id)));
    if (!cat) return { error: 'Unknown category.' };
  }

  await db
    .update(pages)
    .set({ categoryId })
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, slug)));

  revalidateTag('pages');
  revalidateTag(`page:${slug}`);
  return { ok: true };
}

// ---- create custom page -----------------------------------------------
// Creates an empty pages row at a slug that isn't in KNOWN_EDITABLE_PAGES.
// The catch-all frontend route (snippets/catch-all-page.tsx) serves any
// published custom page at `/{slug}`.
export type CustomPageCreateState = {
  ok?: boolean;
  error?: string;
  slug?: string;
};

export async function createCustomPage(
  _prev: CustomPageCreateState,
  formData: FormData,
): Promise<CustomPageCreateState> {
  try {
    await requireAdmin();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }

  const rawSlug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const title = String(formData.get('title') ?? '').trim();

  if (!title) return { error: 'Title is required.' };
  if (title.length > 255) return { error: 'Title is too long.' };
  const slugError = customSlugError(rawSlug);
  if (slugError) return { error: slugError };
  if (findKnownPage(rawSlug)) {
    return {
      error:
        `A hard-coded route already exists at "${rawSlug}". Use "Duplicate from…" on that page instead.`,
    };
  }

  const site = await getCurrentSite();
  const [existing] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, rawSlug)));
  if (existing) {
    return { error: 'A page with that slug already exists.' };
  }

  await db.insert(pages).values({
    siteId: site.id,
    slug: rawSlug,
    title,
    published: null,
    publishedAt: null,
  });

  revalidateTag('pages');
  return { ok: true, slug: rawSlug };
}
