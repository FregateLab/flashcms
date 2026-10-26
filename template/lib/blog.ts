import { and, desc, eq, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { generateHTML } from '@tiptap/html/server';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { db, postCategories, posts } from '@/db';
import { getCurrentSite } from '@/lib/site';
import { ResizableImage } from '@/lib/tiptap-extensions';

// ---- data reads, cache-tagged so revalidateTag() invalidates -----------
export const getPublishedPosts = unstable_cache(
  async (opts?: { categorySlug?: string }) => {
    const site = await getCurrentSite();

    // Resolve category slug → id upfront so the WHERE clause is a
    // simple equality on posts.category_id rather than a join.
    let categoryId: string | undefined;
    if (opts?.categorySlug) {
      const [cat] = await db
        .select({ id: postCategories.id })
        .from(postCategories)
        .where(
          and(
            eq(postCategories.siteId, site.id),
            eq(postCategories.slug, opts.categorySlug),
          ),
        );
      if (!cat) return []; // unknown slug → empty list, don't 500
      categoryId = cat.id;
    }

    const conditions = [
      eq(posts.siteId, site.id),
      eq(posts.isPublished, true),
    ];
    if (categoryId) conditions.push(eq(posts.categoryId, categoryId));

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
        categoryId: posts.categoryId,
      })
      .from(posts)
      .where(and(...conditions))
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

// Categories that have at least one published post, ordered for chip
// display. Skips empty categories so the filter row stays honest.
export const listVisibleCategories = unstable_cache(
  async () => {
    const site = await getCurrentSite();
    const rows = await db
      .select({
        id: postCategories.id,
        slug: postCategories.slug,
        name: postCategories.name,
        sortOrder: postCategories.sortOrder,
        postCount: sql<number>`count(${posts.id})::int`,
      })
      .from(postCategories)
      .leftJoin(
        posts,
        and(eq(posts.categoryId, postCategories.id), eq(posts.isPublished, true)),
      )
      .where(eq(postCategories.siteId, site.id))
      .groupBy(postCategories.id)
      .orderBy(postCategories.sortOrder, postCategories.name);

    return rows.filter((r) => r.postCount > 0);
  },
  ['visible-categories'],
  { tags: ['posts', 'post-categories'] },
);

// ---- render TipTap JSON → HTML string --------------------------------
const tiptapExtensions = [StarterKit, Link, ResizableImage];

export function renderPostBodyToHtml(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  try {
    return generateHTML(body as never, tiptapExtensions);
  } catch {
    return '';
  }
}
