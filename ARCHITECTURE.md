# Architecture

## Layers

```
┌────────────────────────────────────────────────────────────────────┐
│  Public marketing site                                             │
│  app/(frontend)/**  →  <CmsPage slug="…" /> + generateMetadata     │
│                                                                    │
│  Instrumentation                                                   │
│  ├── AnalyticsBeacon  ────────→  /api/analytics/track              │
│  └── VitalsReporter   ────────→  /api/analytics/vitals             │
└────────────────────────────────────────────────────────────────────┘
                            ▲
                            │  server actions / cache reads
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│  CMS admin                                                         │
│  app/(admin)/admin/**                                              │
│  ├── /login           auth flow                                    │
│  ├── /                dashboard + analytics                        │
│  ├── /pages           list, editor (Puck)                          │
│  ├── /posts           list, editor (TipTap)                        │
│  ├── /media           library + uploader                           │
│  ├── /users           team management (admin-only)                 │
│  ├── /site-settings   header + footer editor                       │
│  └── /account         self-service profile                         │
└────────────────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│  lib/ (server-only helpers + server actions)                       │
│  ├── pages.ts, posts.ts, blog.ts, media.ts, users.ts               │
│  ├── analytics.ts, analytics-actions.ts                            │
│  ├── site-settings.ts, site-settings-actions.ts                    │
│  ├── render-cms-page.tsx (Puck server config + Metadata builder)   │
│  ├── press-renderers.tsx (async server components for /press)      │
│  ├── auth.ts (Node), auth.config.ts (Edge-safe)                    │
│  └── storage.ts (S3 client)                                        │
└────────────────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│  Postgres (via Drizzle)                                            │
│  users · accounts · sessions · verification_tokens                 │
│  sites · pages · page_versions · posts · post_versions · media     │
│  analytics_events · analytics_vitals                               │
└────────────────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
                    Dokwe S3 (or any S3-compatible bucket)
```

## Request flow — public page render

1. Browser hits `/about`.
2. `app/(frontend)/about/page.tsx` calls `<CmsPage slug="about" />`.
3. `CmsPage` calls `getPublishedPageBySlug("about")` (in `lib/pages.ts`),
   which is `unstable_cache`d with tags `['pages', 'page:about']`.
4. Puck `<Render>` walks `page.published.content` and calls each
   registered block's `render` function.
5. Any `PressFeatDynamic` / `PressListDynamic` block hits its async
   server component in `lib/press-renderers.tsx` to fetch posts.
6. Metadata is produced by `generateMetadata` → `buildCmsMetadata`,
   which reads `pages.seo` and returns Next `Metadata`.

## Request flow — publish a page

1. Editor drags/edits blocks in Puck; state lives client-side in the
   PageEditor component.
2. On **Publish** click, the client submits a form to `savePage`
   server action.
3. `savePage`:
   - Validates the payload with Zod.
   - Updates `pages.published`, `pages.publishedAt`, `pages.updatedAt`.
   - Inserts a snapshot into `page_versions`.
   - `revalidateTag('pages')` + `revalidateTag('page:<slug>')` so the
     public route drops its cached copy.

## Request flow — analytics pageview

1. Public route renders. `AnalyticsBeacon` mounts client-side and calls
   `usePathname`.
2. On mount / route change, it POSTs `{ path, referrer }` to
   `/api/analytics/track` via `navigator.sendBeacon`.
3. `route.ts` (Node runtime):
   - Filters bots by user-agent.
   - Reads upstream headers for country (`X-Country-Code`) and continent
     (`X-Continent-Code`).
   - Parses device type from UA.
   - Reads / mints an `sfh_sid` cookie for the session id.
   - Inserts into `analytics_events`.

## Middleware & auth

- `middleware.ts` runs on the Edge runtime and imports **only**
  `lib/auth.config.ts` (no bcrypt, no adapter).
- The `authorized` callback:
  - Redirects unauthenticated `/admin/*` requests to `/admin/login`.
  - Redirects `/admin/login` for signed-in users to `/admin`.
  - Redirects `/admin/users` to `/admin` when the JWT role is not
    `admin`.
- `lib/auth.ts` (Node runtime) holds the credentials provider and the
  Drizzle adapter. It's imported by route handlers, admin pages, and
  server components.

## Layered caching

- `lib/pages.ts::getPublishedPageBySlug` → `unstable_cache` with tags
  `['pages', 'page:<slug>']`.
- `lib/blog.ts::getPublishedPosts` → tags `['posts', 'press']`.
- `lib/site-settings.ts::getHeaderConfig`, `getFooterConfig` → React
  `cache()` per-request, plus tag `site-chrome` on writes to
  `revalidateTag`.

Writes call `revalidateTag(…)` for the matching keys and, where
appropriate, `revalidatePath('/', 'layout')` for chrome changes.

## Files with SFH-specific content

The template files marked below need customization for a non-SFH project:

| File | What's SFH-specific | What to do |
|---|---|---|
| `lib/known-routes.ts` | Hard-coded list of `/about`, `/countries/*` etc. | Replace with your project's routes |
| `lib/site.ts` | Hardcoded slug `'sfhgroup'` | Change to your site's slug |
| `lib/site-settings.ts` | `DEFAULT_HEADER`, `DEFAULT_FOOTER` mirror SFH's chrome | Replace with your defaults (or leave empty and edit in `/admin/site-settings`) |
| `lib/puck-config.tsx` | ~40 SFH-styled blocks (Hero, StatsGrid, Countries, etc.) | Fork; keep whichever blocks fit, register your own |
| `lib/press-renderers.tsx` | Assumes `.pressFeat`, `.pressList` CSS classes | Restyle for your site |
| `app/(admin)/admin/layout.tsx` | favicon → `/v1/assets/sfh-icon.png` | Swap favicon |
| `app/(admin)/admin/admin.css` | SFH red (#E31B22) and navy (#1C2674) tokens | Change tokens |
| `app/(admin)/admin/(authed)/layout.tsx` | Brand text "SFH CMS", "Society for Family Health" | Rename |

Files that are 100% reusable:
`db/schema.ts`, `lib/auth.ts`, `lib/auth.config.ts`, `lib/pages.ts`,
`lib/posts.ts`, `lib/blog.ts`, `lib/media.ts`, `lib/storage.ts`,
`lib/users.ts`, `lib/analytics.ts`, `lib/analytics-actions.ts`,
`lib/site-settings-actions.ts`, `lib/render-cms-page.tsx`, all
`components/*`, all admin route files, all API routes.

## Runtime split

- **Node runtime**: everything under `lib/` that imports from `@/db`,
  bcrypt, or AWS SDK. `app/(admin)/**` server components. API routes.
- **Edge runtime**: `middleware.ts` only. It must never touch `@/db`
  or import files that do — that's why `auth.config.ts` is split out
  from `auth.ts`.
- **Client runtime**: `components/MediaField.tsx`, `MediaPicker.tsx`,
  `AnalyticsBeacon.tsx`, `VitalsReporter.tsx`, the admin editors
  (`PageEditor.tsx`, `PostEditor.tsx`, etc.). None of these import
  server-only modules directly; they call server actions instead.

## Session lifecycle

1. `/admin/login` posts credentials via `signIn('credentials', …)`.
2. `authorize()` in `lib/auth.ts` runs (Node), compares bcrypt hash.
3. Returned user is serialised into the JWT; `role` is copied through.
4. Every subsequent request: JWT decrypted in middleware (Edge), role
   available in `auth.user.role` for route guards.
