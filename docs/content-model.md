# Content model

## Tables

| Table | Purpose |
|---|---|
| `sites` | The site being edited. Multi-tenant-ready via `slug`. Also holds `header` + `footer` JSON. |
| `pages` | Marketing pages: Puck JSON in `published`, SEO in `seo`. |
| `page_versions` | Snapshot of every save (draft or publish) for pages. |
| `posts` | Blog + press posts: title, slug, excerpt, cover, TipTap body, plus `external_url` / `press_type` / `is_featured`. |
| `post_versions` | Snapshot per save for posts. |
| `media` | Uploaded assets metadata; blob lives in S3. |
| `users`, `accounts`, `sessions`, `verification_tokens` | Auth.js schema. `users` extended with `role` (`admin` \| `editor`) and `password_hash`. |
| `analytics_events`, `analytics_vitals` | Analytics pipeline (see `docs/analytics.md`). |

Every content table carries `site_id` so a single Postgres serves many
sites. Sites are keyed by `slug` (see `lib/site.ts::getCurrentSite`).

## Pages

Model:
- `slug` — matches a route in your app (e.g. `about`, `countries/nigeria`)
- `title` — used as fallback SEO title
- `published` — Puck `Data` (`{ content: [], root: {}, zones: {} }`)
- `published_at` — timestamp of last publish
- `seo` — `{ title?, description?, image?, canonical?, noindex? }`

Read path:
- `getPublishedPageBySlug(slug)` — cached, tagged with
  `['pages', 'page:<slug>']`
- `getPageEditableData(slug)` — admin-only, returns the current publish
  or the latest draft snapshot

Write path:
- `savePage` server action in `lib/pages.ts`. Publishing writes to
  `published` + `published_at` and calls `revalidateTag`.

## Posts

Same versioning pattern as pages, but content is TipTap JSON, not Puck.

Extra columns for the press-room use case:
- `external_url` — when set, the card in `/press` links out there
  instead of `/blog/<slug>`.
- `press_type` — `story` / `release` / `report` — drives the filter
  pills on `/press`.
- `is_featured` — surfaces the post in `PressFeatDynamic`.

Read:
- `getPublishedPosts()` in `lib/blog.ts` — cached, tagged
  `['posts', 'press']`.
- `getFeaturedOrLatestPost()` — used by `PressFeatDynamic`.

## Media

Every upload creates a `media` row with `url`, `filename`, `size`,
`content_type`, `key` (object key in the bucket).

- Uploader: `MediaUploader.tsx` → `uploadMedia` server action.
- Picker (block image fields + TipTap image button): `MediaPicker.tsx`.
- Delete: removes from S3 and DB.

Keys look like: `<site-slug>/<yyyy>/<mm>/<uuid>-<filename-slug>.<ext>`.

## Multi-site setup

The scaffold supports multiple sites in one Postgres:

1. Insert additional rows into `sites`.
2. Add subdomain / host-based routing to `getCurrentSite` (currently
   hard-coded to `slug='sfhgroup'`).
3. Each admin session inherits the current site; posts / pages queries
   are always `site_id`-scoped.

If you have only one site, leave `getCurrentSite` as-is and just change
the slug string.
