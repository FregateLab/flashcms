// Bulk-load gallery_photos from a JSON file — useful for migrating an
// existing hard-coded gallery into /admin/gallery in one go.
// Idempotent: skips images already present for this site.
//
// Usage:
//   npx tsx scripts/seed-gallery.ts gallery-seed.json
//
// gallery-seed.json:
//   [
//     { "image": "/assets/gallery/open-day.jpg", "caption": "Spring open day" },
//     { "image": "https://<bucket>/…/team.jpg", "caption": "The team" }
//   ]
//
// Array order becomes sortOrder (0, 1, 2, …). Reads DATABASE_URI +
// SITE_SLUG from .env.local.
import { readFile } from 'node:fs/promises';
import { config } from 'dotenv';
config({ path: '.env.local' });

type SeedRow = { image: string; caption: string; isPublished?: boolean };

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: npx tsx scripts/seed-gallery.ts <photos.json>');
    process.exit(1);
  }

  const raw = JSON.parse(await readFile(file, 'utf8')) as unknown;
  if (!Array.isArray(raw)) {
    console.error(`${file} must contain a JSON array of { image, caption }.`);
    process.exit(1);
  }
  const rows = raw as SeedRow[];
  for (const [i, r] of rows.entries()) {
    if (!r || typeof r.image !== 'string' || typeof r.caption !== 'string') {
      console.error(`Row ${i} is missing a string "image" or "caption".`);
      process.exit(1);
    }
  }

  // Same fallback as lib/site.ts.
  const siteSlug = process.env.SITE_SLUG || 'sfhgroup';

  const { and, eq } = await import('drizzle-orm');
  const { db, sites, galleryPhotos } = await import('../db');

  const [site] = await db
    .select({ id: sites.id, slug: sites.slug })
    .from(sites)
    .where(eq(sites.slug, siteSlug));
  if (!site) {
    console.error(`No site row for slug "${siteSlug}". Run npm run db:seed first.`);
    process.exit(2);
  }

  let inserted = 0;
  let skipped = 0;
  for (const [i, r] of rows.entries()) {
    const [existing] = await db
      .select({ id: galleryPhotos.id })
      .from(galleryPhotos)
      .where(and(eq(galleryPhotos.siteId, site.id), eq(galleryPhotos.image, r.image)));
    if (existing) {
      skipped++;
      continue;
    }
    await db.insert(galleryPhotos).values({
      siteId: site.id,
      image: r.image,
      caption: r.caption.slice(0, 240),
      sortOrder: i,
      isPublished: r.isPublished ?? true,
    });
    inserted++;
  }

  console.log(`Seeded ${inserted} photo(s), skipped ${skipped} already present.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
