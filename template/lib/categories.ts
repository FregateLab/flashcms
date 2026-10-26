'use server';

import { and, asc, eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getCurrentSite } from '@/lib/site';
import { db, postCategories } from '@/db';

// ---- shape validation --------------------------------------------------
const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case (letters, numbers, hyphens).');
const nameSchema = z.string().min(1).max(120);
const descriptionSchema = z.string().max(500).optional().nullable();

export type CategoryFormState = { ok?: boolean; error?: string; id?: string };

// ---- reads --------------------------------------------------------------
/** All categories for the current site, ordered for display. */
export async function listCategories() {
  const site = await getCurrentSite();
  return db
    .select({
      id: postCategories.id,
      slug: postCategories.slug,
      name: postCategories.name,
      description: postCategories.description,
      sortOrder: postCategories.sortOrder,
      createdAt: postCategories.createdAt,
    })
    .from(postCategories)
    .where(eq(postCategories.siteId, site.id))
    .orderBy(asc(postCategories.sortOrder), asc(postCategories.name));
}

export async function getCategoryById(id: string) {
  const site = await getCurrentSite();
  const [row] = await db
    .select()
    .from(postCategories)
    .where(and(eq(postCategories.id, id), eq(postCategories.siteId, site.id)));
  return row ?? null;
}

/** Lookup by slug — used by /blog?category=<slug> filter routes. */
export async function getCategoryBySlug(slug: string) {
  const site = await getCurrentSite();
  const [row] = await db
    .select()
    .from(postCategories)
    .where(
      and(
        eq(postCategories.siteId, site.id),
        eq(postCategories.slug, slug),
      ),
    );
  return row ?? null;
}

// ---- helpers ------------------------------------------------------------
// Any authenticated CMS user (editor or admin) can manage the post
// taxonomy — middleware already blocks unauthenticated /admin/* access.
async function requireEditor() {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated.');
  return user;
}

// ---- create -------------------------------------------------------------
export async function createCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  try {
    await requireEditor();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }

  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const sortOrder = Number(formData.get('sortOrder') ?? 0) || 0;

  const parsed = z
    .object({
      slug: slugSchema,
      name: nameSchema,
      description: descriptionSchema,
    })
    .safeParse({ slug, name, description });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }

  const site = await getCurrentSite();

  const [existing] = await db
    .select()
    .from(postCategories)
    .where(
      and(
        eq(postCategories.siteId, site.id),
        eq(postCategories.slug, parsed.data.slug),
      ),
    );
  if (existing) return { error: 'A category with that slug already exists.' };

  const [row] = await db
    .insert(postCategories)
    .values({
      siteId: site.id,
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      sortOrder,
    })
    .returning({ id: postCategories.id });

  revalidatePath('/admin/categories');
  revalidatePath('/admin/posts');
  revalidateTag('post-categories');
  revalidateTag('posts');
  return { ok: true, id: row.id };
}

// ---- update -------------------------------------------------------------
export async function updateCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  try {
    await requireEditor();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing category id.' };

  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const sortOrder = Number(formData.get('sortOrder') ?? 0) || 0;

  const parsed = z
    .object({
      slug: slugSchema,
      name: nameSchema,
      description: descriptionSchema,
    })
    .safeParse({ slug, name, description });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }

  const site = await getCurrentSite();
  // If slug changed to one already used by a different category on this
  // site, reject rather than let the unique index throw an opaque error.
  const [clash] = await db
    .select({ id: postCategories.id })
    .from(postCategories)
    .where(
      and(
        eq(postCategories.siteId, site.id),
        eq(postCategories.slug, parsed.data.slug),
      ),
    );
  if (clash && clash.id !== id) {
    return { error: 'Another category already uses that slug.' };
  }

  await db
    .update(postCategories)
    .set({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      sortOrder,
    })
    .where(and(eq(postCategories.id, id), eq(postCategories.siteId, site.id)));

  revalidatePath('/admin/categories');
  revalidatePath('/admin/posts');
  revalidateTag('post-categories');
  revalidateTag('posts');
  return { ok: true, id };
}

// ---- delete -------------------------------------------------------------
export async function deleteCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  try {
    await requireEditor();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Forbidden.' };
  }

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing category id.' };

  // FK on posts.category_id is ON DELETE SET NULL — posts survive,
  // they just become uncategorised.
  const site = await getCurrentSite();
  await db
    .delete(postCategories)
    .where(and(eq(postCategories.id, id), eq(postCategories.siteId, site.id)));

  revalidatePath('/admin/categories');
  revalidatePath('/admin/posts');
  revalidateTag('post-categories');
  revalidateTag('posts');
  return { ok: true };
}
