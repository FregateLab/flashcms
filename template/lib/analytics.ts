import { and, countDistinct, desc, gte, sql } from 'drizzle-orm';
import { analyticsEvents, analyticsVitals, db } from '@/db';
import { getCurrentSite } from '@/lib/site';

export type Range = 7 | 30;

function rangeStart(days: Range) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (days - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getAnalyticsTotals(days: Range) {
  const site = await getCurrentSite();
  const since = rangeStart(days);
  const [row] = await db
    .select({
      visits: sql<number>`count(*)::int`,
      uniques: countDistinct(analyticsEvents.sessionId),
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.siteId} = ${site.id}`,
        gte(analyticsEvents.createdAt, since),
      ),
    );
  return {
    visits: row?.visits ?? 0,
    uniques: row?.uniques ?? 0,
    range: days,
    since,
  };
}

export async function getDailyBuckets(days: Range) {
  const site = await getCurrentSite();
  const since = rangeStart(days);
  // Returns visits + uniques bucketed by UTC day.
  const rows = await db
    .select({
      day: sql<string>`date_trunc('day', ${analyticsEvents.createdAt})::date::text`,
      visits: sql<number>`count(*)::int`,
      uniques: sql<number>`count(distinct ${analyticsEvents.sessionId})::int`,
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.siteId} = ${site.id}`,
        gte(analyticsEvents.createdAt, since),
      ),
    )
    .groupBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`)
    .orderBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`);

  // Backfill zero-visit days so the sparkline has a consistent x-axis.
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: { day: string; visits: number; uniques: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const hit = byDay.get(iso);
    out.push({
      day: iso,
      visits: hit?.visits ?? 0,
      uniques: hit?.uniques ?? 0,
    });
  }
  return out;
}

export async function getTopPaths(days: Range, limit = 8) {
  const site = await getCurrentSite();
  const since = rangeStart(days);
  return db
    .select({
      path: analyticsEvents.path,
      visits: sql<number>`count(*)::int`,
      uniques: sql<number>`count(distinct ${analyticsEvents.sessionId})::int`,
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.siteId} = ${site.id}`,
        gte(analyticsEvents.createdAt, since),
      ),
    )
    .groupBy(analyticsEvents.path)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getTopReferrers(days: Range, limit = 8) {
  const site = await getCurrentSite();
  const since = rangeStart(days);
  return db
    .select({
      referrer: analyticsEvents.referrer,
      visits: sql<number>`count(*)::int`,
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.siteId} = ${site.id}`,
        gte(analyticsEvents.createdAt, since),
        sql`${analyticsEvents.referrer} IS NOT NULL AND ${analyticsEvents.referrer} <> ''`,
      ),
    )
    .groupBy(analyticsEvents.referrer)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getDeviceBreakdown(days: Range) {
  const site = await getCurrentSite();
  const since = rangeStart(days);
  return db
    .select({
      device: analyticsEvents.deviceType,
      visits: sql<number>`count(*)::int`,
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.siteId} = ${site.id}`,
        gte(analyticsEvents.createdAt, since),
      ),
    )
    .groupBy(analyticsEvents.deviceType)
    .orderBy(desc(sql`count(*)`));
}

export async function getCountryBreakdown(days: Range, limit = 8) {
  const site = await getCurrentSite();
  const since = rangeStart(days);
  return db
    .select({
      country: analyticsEvents.country,
      visits: sql<number>`count(*)::int`,
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.siteId} = ${site.id}`,
        gte(analyticsEvents.createdAt, since),
        sql`${analyticsEvents.country} IS NOT NULL`,
      ),
    )
    .groupBy(analyticsEvents.country)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getContinentBreakdown(days: Range) {
  const site = await getCurrentSite();
  const since = rangeStart(days);
  return db
    .select({
      continent: analyticsEvents.continent,
      visits: sql<number>`count(*)::int`,
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.siteId} = ${site.id}`,
        gte(analyticsEvents.createdAt, since),
        sql`${analyticsEvents.continent} IS NOT NULL`,
      ),
    )
    .groupBy(analyticsEvents.continent)
    .orderBy(desc(sql`count(*)`));
}

// p75 for each Web Vital in the window. Values stored as integers; CLS
// is stored as value*1000 so it fits — we divide back on read.
export async function getVitalsP75(days: Range) {
  const site = await getCurrentSite();
  const since = rangeStart(days);
  const rows = await db.execute<{ name: string; p75: number; samples: number }>(
    sql`
      SELECT name,
             percentile_cont(0.75) WITHIN GROUP (ORDER BY value)::int AS p75,
             count(*)::int AS samples
      FROM ${analyticsVitals}
      WHERE site_id = ${site.id}
        AND created_at >= ${since}
      GROUP BY name
    `,
  );
  const out: Record<
    'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB',
    { p75: number; samples: number } | null
  > = { LCP: null, CLS: null, INP: null, FCP: null, TTFB: null };
  for (const r of rows.rows) {
    const key = r.name as keyof typeof out;
    if (!(key in out)) continue;
    // CLS was stored *1000; scale back to the actual metric.
    const p75 = key === 'CLS' ? r.p75 / 1000 : r.p75;
    out[key] = { p75, samples: r.samples };
  }
  return out;
}

// ---- retention ---------------------------------------------------------
let lastCleanup = 0;
export async function opportunisticCleanup(days = 90) {
  const now = Date.now();
  if (now - lastCleanup < 60 * 60 * 1000) return; // at most once/hour
  lastCleanup = now;
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
  try {
    await db
      .delete(analyticsEvents)
      .where(sql`${analyticsEvents.createdAt} < ${cutoff}`);
    await db
      .delete(analyticsVitals)
      .where(sql`${analyticsVitals.createdAt} < ${cutoff}`);
  } catch (err) {
    console.error('opportunisticCleanup', err);
  }
}

export async function getOldestEventDate() {
  const [row] = await db
    .select({ oldest: sql<Date | null>`min(${analyticsEvents.createdAt})` })
    .from(analyticsEvents);
  return row?.oldest ?? null;
}
