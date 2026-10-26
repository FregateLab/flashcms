'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, postCategories, posts, postVersions } from '@/db';
import { getCurrentSite } from '@/lib/site';

// ---------- shape validation ------------------------------------------
// TipTap document JSON is loose enough that we accept any object; the
// editor client is the source of truth for its structure.
const tiptapDoc = z.object({ type: z.literal('doc') }).passthrough();

const upsertInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  excerpt: z.string().max(500).optional().nullable(),
  coverImage: z.string().url().optional().nullable().or(z.literal('').transform(() => null)),
  body: tiptapDoc,
  action: z.enum(['draft', 'publish']),
  externalUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  pressType: z.enum(['story', 'release', 'report', 'factsheet']).default('story'),
  isFeatured: z.coerce.boolean().default(false),
  categoryId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
});

export type PostFormState = { error?: string; ok?: boolean };

// ---------- data reads (server-callable helpers) ---------------------
export async function listPosts() {
  const site = await getCurrentSite();
  return db
    .select()
    .from(posts)
    .where(eq(posts.siteId, site.id))
    .orderBy(desc(posts.updatedAt));
}

export async function getPostById(id: string) {
  const site = await getCurrentSite();
  const [row] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.siteId, site.id)));
  return row ?? null;
}

// A category id from the form must belong to the current site —
// otherwise a crafted request could attach another tenant's category.
async function categoryBelongsToSite(siteId: string, categoryId: string) {
  const [row] = await db
    .select({ id: postCategories.id })
    .from(postCategories)
    .where(and(eq(postCategories.id, categoryId), eq(postCategories.siteId, siteId)));
  return !!row;
}

// ---------- write action -------------------------------------------------
export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  const rawBody = formData.get('body');
  let bodyJson: unknown;
  try {
    bodyJson = JSON.parse(String(rawBody ?? '{}'));
  } catch {
    return { error: 'Editor body was not valid JSON.' };
  }

  const parsed = upsertInput.safeParse({
    id: formData.get('id') || undefined,
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt'),
    coverImage: formData.get('coverImage'),
    body: bodyJson,
    action: formData.get('action'),
    externalUrl: formData.get('externalUrl'),
    pressType: formData.get('pressType') || 'story',
    isFeatured: formData.get('isFeatured') === 'true',
    categoryId: formData.get('categoryId') || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const input = parsed.data;

  const site = await getCurrentSite();
  if (input.categoryId && !(await categoryBelongsToSite(site.id, input.categoryId))) {
    return { error: 'Unknown category.' };
  }
  const authorId = session.user.id!;
  const now = new Date();
  const publishing = input.action === 'publish';

  let postId = input.id;
  if (postId) {
    // update existing
    await db
      .update(posts)
      .set({
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        coverImage: input.coverImage ?? null,
        externalUrl: input.externalUrl ?? null,
        pressType: input.pressType,
        isFeatured: input.isFeatured,
        categoryId: input.categoryId ?? null,
        published: publishing ? input.body : undefined,
        publishedAt: publishing ? now : undefined,
        isPublished: publishing ? true : undefined,
        updatedAt: now,
      })
      .where(and(eq(posts.id, postId), eq(posts.siteId, site.id)));
  } else {
    const [row] = await db
      .insert(posts)
      .values({
        siteId: site.id,
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        coverImage: input.coverImage ?? null,
        externalUrl: input.externalUrl ?? null,
        pressType: input.pressType,
        isFeatured: input.isFeatured,
        categoryId: input.categoryId ?? null,
        authorId,
        published: publishing ? input.body : null,
        publishedAt: publishing ? now : null,
        isPublished: publishing,
      })
      .returning({ id: posts.id });
    postId = row.id;
  }

  // always snapshot the body into post_versions, whether draft or publish
  await db.insert(postVersions).values({
    postId,
    data: input.body,
    createdBy: authorId,
  });

  if (publishing) {
    revalidateTag('posts');
    revalidateTag(`post:${input.slug}`);
    revalidateTag('press');
    revalidateTag('post-categories');
  }

  redirect(`/admin/posts/${postId}?saved=1`);
}

// ---------- preview -----------------------------------------------------
// Save the current editor state as a draft snapshot AND return
// { slug, id } so the client can open /blog/<slug>/preview in a new
// tab. Reuses the same validation + write logic as savePost but
// always non-publishing and never redirects — the client picks up the
// returned slug via useActionState.
export type PostPreviewState = {
  ok?: boolean;
  error?: string;
  slug?: string;
  id?: string;
  // Monotonic counter so the client-side effect fires even when the
  // slug is unchanged between two consecutive preview clicks.
  nonce?: number;
};

export async function saveDraftForPreview(
  _prev: PostPreviewState,
  formData: FormData,
): Promise<PostPreviewState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  const rawBody = formData.get('body');
  let bodyJson: unknown;
  try {
    bodyJson = JSON.parse(String(rawBody ?? '{}'));
  } catch {
    return { error: 'Editor body was not valid JSON.' };
  }

  const parsed = upsertInput.safeParse({
    id: formData.get('id') || undefined,
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt'),
    coverImage: formData.get('coverImage'),
    body: bodyJson,
    action: 'draft',
    externalUrl: formData.get('externalUrl'),
    pressType: formData.get('pressType') || 'story',
    isFeatured: formData.get('isFeatured') === 'true',
    categoryId: formData.get('categoryId') || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const input = parsed.data;
  const site = await getCurrentSite();
  if (input.categoryId && !(await categoryBelongsToSite(site.id, input.categoryId))) {
    return { error: 'Unknown category.' };
  }
  const authorId = session.user.id!;
  const now = new Date();

  let postId = input.id;
  if (postId) {
    await db
      .update(posts)
      .set({
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        coverImage: input.coverImage ?? null,
        externalUrl: input.externalUrl ?? null,
        pressType: input.pressType,
        isFeatured: input.isFeatured,
        categoryId: input.categoryId ?? null,
        updatedAt: now,
      })
      .where(and(eq(posts.id, postId), eq(posts.siteId, site.id)));
  } else {
    const [row] = await db
      .insert(posts)
      .values({
        siteId: site.id,
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        coverImage: input.coverImage ?? null,
        externalUrl: input.externalUrl ?? null,
        pressType: input.pressType,
        isFeatured: input.isFeatured,
        categoryId: input.categoryId ?? null,
        authorId,
        published: null,
        publishedAt: null,
        isPublished: false,
      })
      .returning({ id: posts.id });
    postId = row.id;
  }

  await db.insert(postVersions).values({
    postId,
    data: input.body,
    createdBy: authorId,
  });

  return { ok: true, slug: input.slug, id: postId, nonce: Date.now() };
}
