# Deployment

## Dokwe

Dokwe is the default target. It auto-detects Next.js and needs no
custom Dockerfile.

Environment variables to set on the platform (mirroring `.env.local`):

```
DATABASE_URI
AUTH_SECRET
AUTH_TRUST_HOST=true
DOKWE_SLUG
DOKWE_STORAGE_KEY
DOKWE_SECRET
```

Dokwe injects these headers automatically for analytics:

```
X-Country-Code:   e.g. NG
X-Country-Name:   e.g. Nigeria
X-Continent-Code: e.g. AF
```

The `/api/analytics/track` route reads them directly — no config
needed.

### Migrations at deploy

The seed step is a one-off. For migrations to run at deploy, either:

1. Wire `db:migrate` into a build hook / release step in your
   platform's dashboard.
2. Bake it into `postbuild`:

   ```json
   { "scripts": { "postbuild": "npm run db:migrate" } }
   ```

3. Or run manually on each deploy (safest during early days).

### Do not commit a custom Dockerfile

Earlier iterations included one for Payload. The plain Next auto-detect
works fine on Dokwe (they build with nixpacks or Buildpacks under the
hood) and had no memory issues once we dropped Payload.

## Vercel

Works with two adjustments:

1. Set the same env vars in the Vercel dashboard.
2. Change `lib/analytics/track/route.ts` to also read
   `x-vercel-ip-country` (already in the fallback chain).
3. Because Vercel enforces a 4.5 MB request-body cap on server
   actions, either lower `MAX_UPLOAD_BYTES` in `lib/media.ts` or move
   the media uploader to a presigned-PUT flow.

## Any Node host

Any host that can run `next start` works. Requirements:

- Node 20+
- A Postgres URL reachable at build/runtime
- S3 credentials reachable at runtime

## Build memory notes

Historic gotcha: when Payload CMS was in the tree, `next build` OOM'd
on Dokwe hosts because Payload pulled in a large dependency graph
(Postgres client, GraphQL, TSX loader, sharp with native binaries).

The current CMS is much lighter — ~28 npm packages, not 484. Build
runs comfortably under 1 GB of heap. If you re-add a heavy library and
start OOMing, the levers are:

- `NODE_OPTIONS=--max-old-space-size=4096` in your host's build stage.
- `eslint.ignoreDuringBuilds: true` in `next.config.mjs` (adds ~2m
  during CI type-check).

Both were shipped in the earlier fight; removed once the root cause
(Payload) was gone.

## First-run checklist

After deploying:

1. Verify `/admin/login` renders.
2. Sign in as the seeded admin.
3. Visit `/admin` — the analytics section will be empty until real
   visits land.
4. Open a private window and hit the public homepage twice, then
   `/about` once. Come back to `/admin` — you should see 3 visits, 1
   unique.
5. Create one page (or seed if you brought over existing seeds) and
   confirm the public route renders.
6. Upload one image via `/admin/media` and confirm it opens in a new
   tab.

If step 4 shows no data, check that:

- The public site has `<AnalyticsBeacon />` + `<VitalsReporter />` in
  its layout.
- `/api/analytics/track` responds `200 { ok: true }` (check the network
  tab).
- The DB actually has an `analytics_events` row (`SELECT COUNT(*)`).
