# flashcms

Repo: [`git@github.com:FregateLab/flashcms.git`](https://github.com/FregateLab/flashcms)

A self-contained content management system for Next.js apps. Extracted
from the Society for Family Health group website and designed to drop
into any other Next.js 15 (App Router) project.

## What's here

```
cms/
├── README.md             ← this file
├── INSTALL.md            ← step-by-step install (Claude/Codex-friendly)
├── ARCHITECTURE.md       ← how the pieces fit
├── template/             ← the source files a target project needs
│   ├── db/               →  copy to project root as-is
│   ├── lib/              →  copy to project root as-is
│   ├── components/       →  copy to project root as-is
│   ├── app/(admin)/      →  copy to project's app/(admin)/
│   ├── app/api/          →  merge into project's app/api/
│   ├── middleware.ts     →  copy to project root
│   ├── drizzle.config.ts →  copy to project root
│   └── scripts/          →  copy to project root
├── snippets/             ← things to merge into existing files
│   ├── package.json.merge.json
│   ├── next.config.mjs
│   ├── tsconfig.paths.json
│   ├── env.example
│   └── frontend-layout.tsx
└── docs/                 ← per-topic deep dives
    ├── content-model.md
    ├── blocks.md
    ├── analytics.md
    ├── seo.md
    ├── site-settings.md
    ├── auth-users.md
    ├── media-storage.md
    ├── deployment.md
    └── extending.md
```

## What you get

- **Puck block-based page editor** for authoring landing pages, marketing
  pages, and any content-heavy page. Pages are stored as structured JSON
  and rendered via `<Render>` on public routes.
- **TipTap-based blog post editor** for long-form articles with a rich
  content model (title, slug, excerpt, cover image, TipTap body).
- **Press-room posts** — same `posts` table doubles as a press room with
  `external_url` and `press_type` (story / release / report) fields for
  linking out to LinkedIn, external write-ups, etc.
- **Media library** with drag-drop upload to any S3-compatible bucket
  (Dokwe storage out of the box), copy-URL, delete.
- **User management** with two roles (admin / editor), self-service
  profile + password change, admin-only user CRUD.
- **Analytics** — first-party pageview tracking with no external service.
  Records path, referrer, session (cookie), device, country, continent,
  language. Web Vitals (LCP / CLS / INP / FCP / TTFB) with p75 dashboard.
  90-day retention with opportunistic + manual cleanup.
- **SEO management** — per-page meta title, meta description, OG image,
  canonical, noindex, with live Google-style preview.
- **Site chrome editor** — header nav (primary + mega columns) and
  footer (newsletter, brand, columns, legal strip) are jsonb on the
  `sites` row and editable at `/admin/site-settings`.
- **In-CMS update check** — `/admin/cms` compares the local
  `cms-version.json` to a remote manifest and fires a deploy webhook to
  redeploy the app with the latest CMS package. See `docs/updates.md`.
- **Auth.js v5** with credentials + JWT sessions, split Edge-safe /
  Node runtime configs.
- **Dark-mode-free branded admin UI** — sidebar layout, SFH-red primary,
  Poppins display, sleek dashboard with analytics.

## Not included / bring your own

- **Design system for public pages** — the CMS ships a starter Puck
  block library that's tightly styled for SFH. New sites will typically
  fork `lib/puck-config.tsx` and register their own blocks. See
  `docs/blocks.md`.
- **Newsletter delivery** — the footer signup form has `action="#"`.
  Wire it up to your email provider (Buttondown, Resend, Beehiiv, etc.).
- **Sitemap / robots.txt** — add a `sitemap.ts` and `robots.ts` at the
  root of your `app/` when you're ready to indexpage. The
  `getPublishedPageBySlug` helper is a good source.
- **Bulk export** — no CSV export yet.
- **Localization** — single-locale for now.

## Quick start (target project)

Assumes you already have a Next.js 15 App-Router project.

```bash
# From your target project root:

# 1. Grab the CMS template dir (adjust the origin as needed).
git clone --depth 1 git@github.com:FregateLab/flashcms.git /tmp/sfh-cms

# 2. Copy the source into your project.
cp -R /tmp/sfh-cms/template/* .
cp /tmp/sfh-cms/snippets/env.example .env.local  # then fill it in

# 3. Merge deps + scripts from cms/snippets/package.json.merge.json
#    into your package.json, then:
npm install

# 4. Ensure @/* path alias exists in tsconfig.json (see
#    snippets/tsconfig.paths.json).

# 5. Point drizzle at your Postgres and run migrations:
npm run db:migrate

# 6. Seed the first site + admin user:
ADMIN_EMAIL=you@example.org ADMIN_PASSWORD='strong' npm run db:seed

# 7. Start dev.
npm run dev
```

Then hit `http://localhost:3000/admin` and sign in with the seeded
credentials.

**See `INSTALL.md` for a step-by-step guide written for AI agents
(Claude Code, Codex, Cursor) to run automatically.**

## Documentation index

| Doc | Topic |
|---|---|
| [INSTALL.md](INSTALL.md) | Step-by-step install for humans and agents |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System overview, request flow, layering |
| [docs/content-model.md](docs/content-model.md) | Pages, Posts, Media, Sites |
| [docs/blocks.md](docs/blocks.md) | Puck block library, adding blocks, dynamic blocks |
| [docs/analytics.md](docs/analytics.md) | Pageview + vitals pipeline, retention |
| [docs/seo.md](docs/seo.md) | SEO fields + `buildCmsMetadata` |
| [docs/site-settings.md](docs/site-settings.md) | Header/footer editing model |
| [docs/auth-users.md](docs/auth-users.md) | Auth.js config, roles, session shape |
| [docs/media-storage.md](docs/media-storage.md) | S3 client, upload flow, migration |
| [docs/deployment.md](docs/deployment.md) | Dokwe deployment + env |
| [docs/updates.md](docs/updates.md) | In-CMS update check + webhook flow |
| [docs/extending.md](docs/extending.md) | Adding new tables, actions, admin pages |

## Versioning

This snapshot is against Next.js 15 App Router, Auth.js v5 beta,
Drizzle 0.45, Puck 0.20, TipTap 3. Bumping majors on any of these
usually requires touch-ups in the CMS files. See the release notes on
each library.

## License

Internal to SFH; add your own SPDX identifier when publishing.
