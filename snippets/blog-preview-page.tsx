/**
 * COPY to app/(frontend)/blog/[slug]/preview/page.tsx in your project.
 *
 * Auth-gated preview of the LATEST draft of a post, whether or not it
 * has ever been published. The PostEditor "Preview" button saves a
 * draft (saveDraftForPreview in lib/posts.ts) and opens this route in a
 * new tab. Keep the article markup in sync with your real
 * app/(frontend)/blog/[slug]/page.tsx so editors see exactly what
 * readers will.
 *
 * Inline images carry `blog-img blog-img--small|medium|full` classes
 * from the editor's image size control — see snippets/cms-frontend.css.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, posts, postVersions } from '@/db';
import { renderPostBodyToHtml } from '@/lib/blog';
import { getCurrentSite } from '@/lib/site';
import BlogArticleLightbox from '@/components/BlogArticleLightbox';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Post preview',
  robots: { index: false, follow: false },
};

export default async function BlogPostPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) notFound();

  const { slug } = await params;
  const site = await getCurrentSite();

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.siteId, site.id), eq(posts.slug, slug)));
  if (!post) notFound();

  // Latest draft snapshot first so unpublished edits are visible.
  const [latest] = await db
    .select()
    .from(postVersions)
    .where(eq(postVersions.postId, post.id))
    .orderBy(desc(postVersions.createdAt))
    .limit(1);
  const html = renderPostBodyToHtml(latest?.data ?? post.published);

  return (
    <main>
      <div
        role="alert"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#0f172a',
          color: '#fff',
          padding: '10px 16px',
          display: 'flex',
          gap: 12,
          fontSize: 13,
        }}
      >
        <strong style={{ letterSpacing: '0.08em' }}>PREVIEW</strong>
        <span style={{ opacity: 0.75 }}>
          {post.isPublished
            ? 'Showing your latest unpublished draft.'
            : 'This post has never been published yet.'}
        </span>
        <span style={{ flex: 1 }} />
        <Link href={`/admin/posts/${post.id}`} style={{ color: '#fff' }}>
          Back to editor
        </Link>
      </div>

      <article className="blog-article">
        {post.coverImage && (
          <div className="blog-article__cover" aria-hidden="true">
            <img src={post.coverImage} alt="" />
          </div>
        )}
        <div className="container">
          <h1 className="blog-article__title">{post.title}</h1>
          {post.excerpt && <p className="blog-article__deck">{post.excerpt}</p>}
          <div
            className="blog-article__body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </article>

      {/* Click-to-zoom for every image inside .blog-article. */}
      <BlogArticleLightbox containerSelector=".blog-article" />
    </main>
  );
}
