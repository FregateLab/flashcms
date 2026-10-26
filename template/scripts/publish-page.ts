// Publish the latest draft snapshot of a CMS page — sets pages.published
// to the most recent pageVersions.data and stamps publishedAt = now.
// Idempotent (re-running just re-publishes whatever the latest draft
// is). Safe to run against prod. Usage:
//   npx tsx scripts/publish-page.ts about
// Reads DATABASE_URI + SITE_SLUG from .env.local.
//
// Note: a running Next server keeps its unstable_cache'd copy of the
// page until the 'pages' tag is revalidated (any publish from the
// admin) or the server restarts / redeploys.
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: npx tsx scripts/publish-page.ts <slug>');
    process.exit(1);
  }

  // Same fallback as lib/site.ts.
  const siteSlug = process.env.SITE_SLUG || 'sfhgroup';

  const { and, desc, eq } = await import('drizzle-orm');
  const { db, pages, pageVersions, sites } = await import('../db');

  const [site] = await db
    .select({ id: sites.id, slug: sites.slug })
    .from(sites)
    .where(eq(sites.slug, siteSlug));
  if (!site) {
    console.error(`No site row for slug "${siteSlug}".`);
    process.exit(2);
  }

  const [page] = await db
    .select({
      id: pages.id,
      title: pages.title,
      published: pages.published,
    })
    .from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, slug)));
  if (!page) {
    console.error(`No page found with slug "${slug}" on site ${site.slug}.`);
    process.exit(3);
  }

  const [latest] = await db
    .select({ data: pageVersions.data, createdAt: pageVersions.createdAt })
    .from(pageVersions)
    .where(eq(pageVersions.pageId, page.id))
    .orderBy(desc(pageVersions.createdAt))
    .limit(1);
  if (!latest?.data) {
    console.error(
      `No draft snapshot exists for "${slug}". Save a draft in /admin/pages first.`,
    );
    process.exit(4);
  }

  const now = new Date();
  await db
    .update(pages)
    .set({
      published: latest.data,
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(pages.id, page.id));

  const wasPublished = page.published != null;
  console.log(
    `${wasPublished ? 'Re-published' : 'Published'} "${slug}" from draft dated ${latest.createdAt.toISOString()}.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
