import { eq } from 'drizzle-orm';
import { cache } from 'react';
import { db, sites } from '@/db';

// Multi-site: each consuming project sets SITE_SLUG in its own .env to
// scope all CMS lookups to that site row. If unset, defaults to the
// original group-website slug so existing installs keep working.
const SITE_SLUG = process.env.SITE_SLUG || 'sfhgroup';

export const getCurrentSite = cache(async () => {
  const [site] = await db.select().from(sites).where(eq(sites.slug, SITE_SLUG));
  if (!site) {
    throw new Error(
      `No "${SITE_SLUG}" site row exists. Run \`npm run db:seed\` to bootstrap it.`,
    );
  }
  return site;
});

export type Site = Awaited<ReturnType<typeof getCurrentSite>>;
