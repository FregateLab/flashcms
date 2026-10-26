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
| `post_categories` | Admin-defined taxonomy per site (1.1.0). `posts.category_id` / `pages.category_id` point here. See `docs/categories.md`. |
| `gallery_photos` | Photo gallery: image URL + caption + sort order + published flag (1.1.0). See `docs/gallery.md`. |
| `newsletter_subscribers` | Footer sign-ups with unsubscribe tokens (1.0.9). See `docs/newsletter.md`. |
| `users`, `accounts`, `sessions`, `verification_tokens` | Auth.js schema. `users` extended with `role` (`admin` \| `editor`) and `password_hash`. |
| `analytics_events`, `analytics_vitals` | Analytics pipeline (see `docs/analytics.md`). |

Every content table carries `site_id` so a single Postgres serves many
sites. Sites are keyed by `slug` (see `lib/site.ts::getCurrentSite`).

## Pages

Model:
- `slug` — matches a route in your app (e.g. `about`, `countries/nigeria`),
  or a **custom page** created at runtime (see below)
- `title` — used as fallback SEO title
- `published` — Puck `Data` (`{ content: [], root: {}, zones: {} }`)
- `published_at` — timestamp of last publish
- `seo` — `{ title?, description?, image?, canonical?, noindex? }`

Read path:
- `getPublishedPageBySlug(slug)` — cached, tagged with
  `['pages', 'page:<slug>']`
- `getPageEditableData(slug)` — admin-only, returns the latest
  `page_versions` snapshot (so unpublished drafts survive a reload),
  falling back to `published`

Write path:
- `savePage` server action in `lib/pages.ts`. Publishing writes to
  `published` + `published_at` and calls `revalidateTag`.

### Custom pages + duplication (1.1.0)

- **New page…** on `/admin/pages` (`createCustomPage`, admins) creates
  a `pages` row at any kebab-case slug that isn't a known route or a
  reserved root (`admin`, `api`, `blog`, `press`, `gallery`,
  `unsubscribe`, … — `RESERVED_SLUG_ROOTS` in `lib/pages.ts`, extend it
  per site). Custom pages are listed under a "Custom" group and served
  by the frontend catch-all (`snippets/catch-all-page.tsx`) once
  published.
- **Duplicate from…** (`duplicatePage`, admins) copies another page's
  published document (or latest draft) into a known route or existing
  custom page as a new draft version; optionally publishes it.
- `updatePageCategory` links a page to a `post_categories` row (no
  admin UI yet — call it from your own control or a script).

## Posts

Same versioning pattern as pages, but content is TipTap JSON, not Puck.

Extra columns for the press-room use case:
- `external_url` — when set, the card in `/press` links out there
  instead of `/blog/<slug>`.
- `press_type` — `story` / `release` / `report` / `factsheet` — drives
  the filter pills on `/press` and `/admin/posts`.
- `category_id` — optional link to `post_categories` (1.1.0).
- `is_featured` — surfaces the post in `PressFeatDynamic`.

Read:
- `getPublishedPosts()` in `lib/blog.ts` — cached, tagged
  `['posts', 'press']`.
- `getFeaturedOrLatestPost()` — used by `PressFeatDynamic`.
- `getPublishedPosts({ categorySlug })` filters by category;
  `listVisibleCategories()` returns categories with ≥1 published post.

Editor (1.1.0): inline image size control (small / medium / full via
`lib/tiptap-extensions.ts::ResizableImage`, rendered as
`blog-img--<size>` classes), image bubble menu (resize / replace /
remove), sticky toolbar, alt-text prompt on insert, cover-image crop,
category select, and **Preview** — saves a draft (`saveDraftForPreview`)
and opens `/blog/<slug>/preview` (`snippets/blog-preview-page.tsx`).
The admin editor loads the latest draft version first.

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
