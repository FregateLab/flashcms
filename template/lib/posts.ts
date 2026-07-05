'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, posts, postVersions } from '@/db';
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
  pressType: z.enum(['story', 'release', 'report']).default('story'),
  isFeatured: z.coerce.boolean().default(false),
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
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const input = parsed.data;

  const site = await getCurrentSite();
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
  }

  redirect(`/admin/posts/${postId}?saved=1`);
}
