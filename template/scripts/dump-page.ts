// Read-only helper: prints the published Puck data for a given page
// slug to stdout — handy for mirroring CMS state back into a seed file
// or diffing environments. No writes. Usage:
//   npx tsx scripts/dump-page.ts about
//   npx tsx scripts/dump-page.ts about > /tmp/about.json
// Reads DATABASE_URI + SITE_SLUG from .env.local.
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: npx tsx scripts/dump-page.ts <slug>');
    process.exit(1);
  }

  // Resolve the site directly by env slug so this script doesn't depend
  // on lib/site.ts (which uses React's cache() and only runs inside
  // Next). Default matches the app-side default in lib/site.ts.
  const siteSlug = process.env.SITE_SLUG || 'sfhgroup';

  const { and, eq } = await import('drizzle-orm');
  const { db, pages, sites } = await import('../db');

  const [site] = await db
    .select({ id: sites.id, slug: sites.slug })
    .from(sites)
    .where(eq(sites.slug, siteSlug));
  if (!site) {
    console.error(`No site row for slug "${siteSlug}".`);
    process.exit(2);
  }

  const [row] = await db
    .select({
      slug: pages.slug,
      title: pages.title,
      published: pages.published,
      publishedAt: pages.publishedAt,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, slug)));

  if (!row) {
    console.error(`No page found with slug "${slug}" on site ${site.slug}.`);
    process.exit(3);
  }

  process.stdout.write(JSON.stringify(row, null, 2) + '\n');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
