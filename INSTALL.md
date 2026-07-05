# Installing the SFH CMS into a Next.js project

This guide is written to be copy-pasted into Claude Code / Codex / Cursor
as a starting prompt. Each step names the exact file, the exact operation,
and how to verify.

> **Prerequisites**
> - Next.js 15 App Router project (created via `create-next-app` or
>   equivalent)
> - Postgres database you can migrate against
> - S3-compatible object storage (Dokwe out of the box; any S3 works
>   with credential/endpoint changes in `lib/storage.ts`)
> - Node 20+ and npm 10+

---

## AI-agent starter prompt

Paste this at the top of your session with the AI assistant:

> "I've pulled the `cms/` package from `<repo-url>`. Follow `cms/INSTALL.md`
> step by step. After each step, verify the outcome and stop for me to
> confirm before proceeding. Use the exact file paths in the guide. Ask
> before doing anything the guide doesn't cover."

---

## Step 1 — Copy the template tree

Everything in `cms/template/` mirrors the shape of the target project.
Copy it verbatim into the project root:

```bash
cp -R cms/template/* .
cp -R cms/template/.[!.]* . 2>/dev/null || true   # in case of hidden files later
```

**Verify:** `db/`, `lib/`, `components/`, `middleware.ts`,
`drizzle.config.ts`, `scripts/seed.ts`, `app/(admin)/admin/`, and
`app/api/{auth,analytics}` all now exist.

## Step 2 — Merge `package.json`

Open `cms/snippets/package.json.merge.json`. Merge its `scripts`,
`dependencies`, and `devDependencies` into the target's `package.json`
(order is up to you).

```bash
npm install
```

**Verify:** `npm run` lists `db:generate`, `db:migrate`, `db:push`,
`db:studio`, `db:seed`.

## Step 3 — TypeScript path alias

Make sure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  }
}
```

If your project uses a `src/` layout, change the alias to `["./src/*"]`
and also move `db/`, `lib/`, `components/` under `src/`. Every file in
the CMS imports from `@/...`.

## Step 4 — Next config

Merge `cms/snippets/next.config.mjs` into your `next.config.mjs`. The
important line is:

```js
experimental: { serverActions: { bodySizeLimit: '20mb' } }
```

Without this, the media uploader will 413 on files larger than 1 MB.

## Step 5 — Environment variables

```bash
cp cms/snippets/env.example .env.local
```

Fill in:
- `DATABASE_URI` — Postgres connection string
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `AUTH_TRUST_HOST=true` (required on most managed hosts)
- `DOKWE_SLUG`, `DOKWE_STORAGE_KEY`, `DOKWE_SECRET` — S3-compatible creds

If you're using a non-Dokwe S3 backend, edit `lib/storage.ts` to point
at your endpoint. The bucket name defaults to `DOKWE_SLUG`.

## Step 6 — Migrate the database

```bash
npm run db:migrate
```

If your host doesn't allow direct SQL connections from your dev machine,
apply each file in `db/migrations/` manually via your Postgres console.
The `_journal.json` records which have been applied.

**Verify:** the following tables exist — `users`, `accounts`, `sessions`,
`verification_tokens`, `sites`, `pages`, `page_versions`, `posts`,
`post_versions`, `media`, `analytics_events`, `analytics_vitals`.

## Step 7 — Seed the first site + admin

```bash
ADMIN_EMAIL=you@example.org \
ADMIN_PASSWORD='choose-strong-one' \
ADMIN_NAME='First editor' \
npm run db:seed
```

`scripts/seed.ts` creates a site with slug `sfhgroup` and inserts your
admin. To change the default site slug/name, edit `scripts/seed.ts`
and update the fallback in `lib/site.ts` to match.

## Step 8 — Customize `lib/site.ts`

Open `lib/site.ts`. Change the slug and site name to whatever you
seeded in step 7.

## Step 9 — Customize `lib/known-routes.ts`

Open `lib/known-routes.ts`. It's a hard-coded list of the marketing
routes the CMS considers editable (the pages that show up in
`/admin/pages`). Ships with `home` + `about` as placeholders — add
your project's routes.

Each entry has:
- `slug` — matches the `pages.slug` column
- `label` — shown in the admin
- `path` — the public URL
- `section` — group heading in `/admin/pages` (e.g. `Content`, `Legal`).
  Section order = first-appearance order.
- `icon` — any unicode glyph shown next to the label
- `ready` — set to `false` if you haven't finished registering blocks
  for this page yet; the admin table will say "Blocks pending".

The `/admin/pages` table groups by `section` and derives everything
from these entries, so you never need to touch the listing UI.

## Step 10 — Wire the public site to the CMS

For every public route you want to make editable through the CMS:

```tsx
// app/(frontend)/about/page.tsx
import { CmsPage, buildCmsMetadata } from '@/lib/render-cms-page';

export function generateMetadata() {
  return buildCmsMetadata('about', 'About Us');
}

export default async function AboutPage() {
  return <CmsPage slug="about" />;
}
```

`slug` in `CmsPage` must match a row in `pages`; `buildCmsMetadata`
reads SEO from `pages.seo`.

For blog posts:

```tsx
// app/(frontend)/blog/page.tsx   — see cms/template/... no seed for
//                                    this; write your own list markup
//                                    using getPublishedPosts()
```

## Step 11 — Instrument the public layout

Merge the beacon + vitals reporter into your public (frontend) route's
`layout.tsx`:

```tsx
import { Suspense } from 'react';
import AnalyticsBeacon from '@/components/AnalyticsBeacon';
import VitalsReporter from '@/components/VitalsReporter';

<Suspense fallback={null}>
  <AnalyticsBeacon />
  <VitalsReporter />
</Suspense>
```

Also fetch `getHeaderConfig` and `getFooterConfig` from
`lib/site-settings.ts` and pass them into your Header/Footer components.
See `cms/snippets/frontend-layout.tsx` for a ready-made example.

## Step 12 — Customize the block library

`lib/puck-config.tsx` ships the SFH block library — hero, stats, country
grids, journey, etc. Every block class targets SFH CSS classes. Fork
this file and register whatever blocks your site needs.

See `docs/blocks.md` for the pattern.

## Step 13 — Register your favicon

In `app/(admin)/admin/layout.tsx` the `metadata.icons` currently point
at `/v1/assets/sfh-icon.png`. Swap that for your project's favicon path.

## Step 14 — Verify

```bash
npm run dev
```

Open `http://localhost:3000/admin/login` — you should see the login card.
Sign in with the credentials from step 7 and land on the dashboard.

Then walk through:
- **Pages** — create a page in the DB (via the admin) and confirm it
  renders on the corresponding public route.
- **Posts** — create a post; hit `/blog/<slug>` (once you've built a
  blog index route).
- **Media** — upload an image, copy the URL, use it in a block.
- **Users** — invite a second user.
- **Analytics** — visit a few public pages, come back to the dashboard,
  confirm visits appear.

## Optional: publishing to a "template" repo

If you plan to reuse this CMS across many SFH sites, publish the `cms/`
directory as its own repo:

```bash
cd cms
git init
git add .
git commit -m 'Initial CMS snapshot'
git remote add origin git@github.com:FregateLab/flashcms.git
git push -u origin main
```

Then in each new project, `git clone --depth 1 git@github.com:FregateLab/flashcms.git /tmp/cms`
before running Step 1.

## Troubleshooting

- **`Cannot find module '@/db'`** — TypeScript path alias not set. See
  Step 3.
- **413 Payload Too Large on media upload** — bodySizeLimit not set in
  `next.config.mjs`. See Step 4.
- **`Error: DATABASE_URI is not set`** — `.env.local` not loaded by
  drizzle-kit. Confirm `drizzle.config.ts` calls `config({ path: '.env.local' })`.
- **`Edge runtime does not support crypto`** — you accidentally
  imported `lib/auth.ts` (Node runtime) into middleware. Middleware
  must import `lib/auth.config.ts` only.
- **Puck editor blank** — likely a client/server split issue. The
  dynamic press blocks (`PressFeatDynamic`, `PressListDynamic`) render
  placeholders in the editor by design; they render live data on the
  public site. See `docs/blocks.md`.
