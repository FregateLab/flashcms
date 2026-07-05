import { eq } from 'drizzle-orm';
import { cache } from 'react';
import { db, sites } from '@/db';

// Until we add subdomain-based tenanting, everything is scoped to the
// SFH group site. This helper is cached per-request so we don't hit
// Postgres more than once inside a single page render.
export const getCurrentSite = cache(async () => {
  const [site] = await db.select().from(sites).where(eq(sites.slug, 'sfhgroup'));
  if (!site) {
    throw new Error(
      'No "sfhgroup" site row exists. Run `npm run db:seed` to bootstrap it.',
    );
  }
  return site;
});

export type Site = Awaited<ReturnType<typeof getCurrentSite>>;
