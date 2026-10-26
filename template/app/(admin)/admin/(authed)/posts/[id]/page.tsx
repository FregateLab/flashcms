import { and, desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import PostEditor from '../PostEditor';
import { db, posts, postVersions } from '@/db';
import { listCategories } from '@/lib/categories';
import { getCurrentSite } from '@/lib/site';

export default async function AdminEditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const site = await getCurrentSite();

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.siteId, site.id)));
  if (!post) notFound();

  // Every save (draft, preview, publish) writes a post_versions row, so
  // the newest version is the most recent edit. Load it first so an
  // unpublished draft of a live post survives a reload; fall back to the
  // published body for rows written without a version.
  const [latest] = await db
    .select()
    .from(postVersions)
    .where(eq(postVersions.postId, id))
    .orderBy(desc(postVersions.createdAt))
    .limit(1);
  const body = latest?.data ?? post.published ?? null;

  const categories = (await listCategories()).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <PostEditor
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        body,
        isPublished: post.isPublished,
        externalUrl: post.externalUrl,
        pressType: post.pressType as 'story' | 'release' | 'report' | 'factsheet',
        isFeatured: post.isFeatured,
        categoryId: post.categoryId,
      }}
      savedFlag={sp.saved === '1'}
      categories={categories}
    />
  );
}
