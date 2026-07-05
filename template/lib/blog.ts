import { and, desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { generateHTML } from '@tiptap/html/server';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { db, posts } from '@/db';
import { getCurrentSite } from '@/lib/site';

// ---- data reads, cache-tagged so revalidateTag() invalidates -----------
export const getPublishedPosts = unstable_cache(
  async () => {
    const site = await getCurrentSite();
    return db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        publishedAt: posts.publishedAt,
        externalUrl: posts.externalUrl,
        pressType: posts.pressType,
        isFeatured: posts.isFeatured,
      })
      .from(posts)
      .where(and(eq(posts.siteId, site.id), eq(posts.isPublished, true)))
      .orderBy(desc(posts.publishedAt));
  },
  ['published-posts'],
  { tags: ['posts', 'press'] },
);

// Featured post preferred, otherwise latest.
export async function getFeaturedOrLatestPost() {
  const list = await getPublishedPosts();
  return list.find((p) => p.isFeatured) ?? list[0] ?? null;
}

export function getPublishedPostBySlug(slug: string) {
  const loader = unstable_cache(
    async () => {
      const site = await getCurrentSite();
      const [post] = await db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.siteId, site.id),
            eq(posts.slug, slug),
            eq(posts.isPublished, true),
          ),
        );
      return post ?? null;
    },
    ['published-post', slug],
    { tags: ['posts', `post:${slug}`] },
  );
  return loader();
}

// ---- render TipTap JSON → HTML string --------------------------------
const tiptapExtensions = [StarterKit, Link, Image];

export function renderPostBodyToHtml(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  try {
    return generateHTML(body as never, tiptapExtensions);
  } catch {
    return '';
  }
}
