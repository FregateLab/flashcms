import { count, eq } from 'drizzle-orm';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db, media, pages, posts } from '@/db';
import { getCurrentSite } from '@/lib/site';
import AnalyticsSection from './AnalyticsSection';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const [session, site, sp] = await Promise.all([
    auth(),
    getCurrentSite(),
    searchParams,
  ]);
  const user = session?.user;

  const [postCount] = await db
    .select({ total: count() })
    .from(posts)
    .where(eq(posts.siteId, site.id));
  const [pageCount] = await db
    .select({ total: count() })
    .from(pages)
    .where(eq(pages.siteId, site.id));
  const [mediaCount] = await db
    .select({ total: count() })
    .from(media)
    .where(eq(media.siteId, site.id));

  return (
    <>
      <h1 className="admin-h1">Hi, {user?.name ?? user?.email ?? 'there'}.</h1>
      <p className="admin-lede">
        Editing <strong>{site.name}</strong>.
      </p>

      <div className="admin-cards">
        <Link href="/admin/pages" className="admin-card admin-card--linky">
          <span className="admin-card__eyebrow">Pages</span>
          <span className="admin-card__count">{pageCount.total}</span>
          <span className="admin-card__cta">Manage pages →</span>
        </Link>
        <Link href="/admin/posts" className="admin-card admin-card--linky">
          <span className="admin-card__eyebrow">Posts</span>
          <span className="admin-card__count">{postCount.total}</span>
          <span className="admin-card__cta">Manage posts →</span>
        </Link>
        <Link href="/admin/media" className="admin-card admin-card--linky">
          <span className="admin-card__eyebrow">Media</span>
          <span className="admin-card__count">{mediaCount.total}</span>
          <span className="admin-card__cta">Browse media →</span>
        </Link>
      </div>

      <AnalyticsSection searchRange={sp.range} />
    </>
  );
}
