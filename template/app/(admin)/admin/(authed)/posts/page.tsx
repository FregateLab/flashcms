import Link from 'next/link';
import { listPosts } from '@/lib/posts';
import PostsTable from './PostsTable';

export default async function AdminPostsListPage() {
  const rows = await listPosts();

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">Posts</h1>
          <p className="admin-lede">
            Stories, releases, and reports. Content lives at
            <code style={{ marginLeft: 6 }}>/blog</code> and drives
            <code style={{ marginLeft: 6 }}>/press</code>.
          </p>
        </div>
        <Link href="/admin/posts/new" className="admin-btn">
          New post
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="admin-card admin-empty">
          <p>No posts yet.</p>
          <Link href="/admin/posts/new" className="admin-btn">
            Create the first post
          </Link>
        </div>
      ) : (
        <PostsTable
          rows={rows.map((r) => ({
            id: r.id,
            title: r.title,
            slug: r.slug,
            coverImage: r.coverImage,
            excerpt: r.excerpt,
            externalUrl: r.externalUrl,
            pressType: r.pressType as 'story' | 'release' | 'report',
            isFeatured: r.isFeatured,
            isPublished: r.isPublished,
            updatedAt: r.updatedAt?.toISOString() ?? null,
          }))}
        />
      )}
    </>
  );
}
