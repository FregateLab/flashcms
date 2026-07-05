# Analytics

Self-hosted analytics. No third-party tag.

## Pipeline

```
AnalyticsBeacon  ─POST──▶  /api/analytics/track  ──▶  analytics_events
VitalsReporter   ─POST──▶  /api/analytics/vitals ──▶  analytics_vitals
                                                    ▲
                                                    │
                                Dashboard reads via lib/analytics.ts
```

## Instrumentation

Include both components under `<Suspense>` in your public layout:

```tsx
<Suspense fallback={null}>
  <AnalyticsBeacon />
  <VitalsReporter />
</Suspense>
```

- `AnalyticsBeacon` fires on every route change via `usePathname` +
  `useSearchParams`.
- `VitalsReporter` uses the `web-vitals` npm to record LCP / CLS / INP /
  FCP / TTFB per pageview.
- Both skip `/admin/*` — editor dogfood doesn't skew stats.

## What's captured per pageview

| Column | Source |
|---|---|
| `path` | `location.pathname` (query stripped server-side) |
| `referrer` | `document.referrer` (only external referrers stored) |
| `session_id` | `sfh_sid` cookie, minted on first visit (16 bytes hex, 180-day expiry, `HttpOnly`, `SameSite=lax`) |
| `user_agent` | Truncated to 200 chars |
| `device_type` | `mobile` / `tablet` / `desktop`, from lightweight UA regex |
| `country` | 2-letter ISO from `X-Country-Code` / `CF-IPCountry` / `X-Vercel-IP-Country` / `X-Country` (first that's set) |
| `continent` | 2-letter code from `X-Continent-Code` |
| `language` | Primary Accept-Language locale |

Bots (per UA regex) are filtered out entirely.

## Web Vitals

LCP / INP / FCP / TTFB are stored as integer ms.
CLS is stored as `Math.round(value * 1000)` (integer-friendly) and
scaled back on read.

Dashboard uses:

```sql
percentile_cont(0.75) WITHIN GROUP (ORDER BY value)
```

per metric. Each is colour-coded green / amber / red against Google's
recommended thresholds.

## Aggregates

`lib/analytics.ts` exports:

| Function | Returns |
|---|---|
| `getAnalyticsTotals(range)` | `{ visits, uniques }` |
| `getDailyBuckets(range)` | Backfilled day-by-day series |
| `getTopPaths(range)` | Top N paths by visits |
| `getTopReferrers(range)` | Top N external referrers |
| `getDeviceBreakdown(range)` | Split by `device_type` |
| `getCountryBreakdown(range)` | Top countries |
| `getContinentBreakdown(range)` | Split by continent |
| `getVitalsP75(range)` | `{ LCP, CLS, INP, FCP, TTFB }` p75 |
| `getOldestEventDate()` | Retention indicator |

`Range = 7 | 30` — extend with 90 if you want a longer window.

## Retention

- **Opportunistic**: every dashboard render calls
  `opportunisticCleanup(90)` in `lib/analytics.ts`, which is a no-op
  unless the last run was over an hour ago (`lastCleanup` in-memory
  timestamp). When it runs, it deletes both tables where
  `created_at < now - 90 days`.
- **Manual**: `CleanupCard.tsx` on the dashboard lets an admin type any
  cutoff and force a purge (`cleanupOldAnalytics` in
  `lib/analytics-actions.ts`).

If you want a scheduled purge without depending on dashboard traffic:

- Vercel: add a cron route
- Dokwe: add a cron via the platform UI hitting an authed endpoint
- Anywhere: `node --experimental-vm-modules cleanup-cron.mjs` on your
  own schedule

## Header wiring (Dokwe)

Dokwe injects `X-Country-Code`, `X-Country-Name`, and
`X-Continent-Code`. On other hosts:

- Cloudflare Workers / Pages: use `cf-ipcountry`.
- Vercel: use `x-vercel-ip-country` + `x-vercel-ip-country-region`.
- Bare metal / your own reverse proxy: set a header like `X-Country`
  from GeoIP data.

Edit `lib/api/analytics/track/route.ts` if your host uses a different
header name.

## What analytics does *not* do

- No cross-domain tracking / UTM cohort analysis (yet).
- No conversion funnels.
- No individual-visitor journey view.
- No client-side heatmaps.

For those, plug in PostHog / Plausible / Umami alongside; the beacon
model is stackable.
