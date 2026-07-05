import { and, desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import PostEditor from '../PostEditor';
import { db, posts, postVersions } from '@/db';
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

  // Prefer published body when present, otherwise fall back to the latest
  // draft snapshot.
  let body = post.published;
  if (!body) {
    const [latest] = await db
      .select()
      .from(postVersions)
      .where(eq(postVersions.postId, id))
      .orderBy(desc(postVersions.createdAt))
      .limit(1);
    body = latest?.data ?? null;
  }

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
        pressType: post.pressType as 'story' | 'release' | 'report',
        isFeatured: post.isFeatured,
      }}
      savedFlag={sp.saved === '1'}
    />
  );
}
