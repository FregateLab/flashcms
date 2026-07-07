# Site-wide search

flashcms ships a small full-content search implementation that covers
CMS pages (published and latest draft), posts, and structural nav
targets. It's designed for the "elastic-in-spirit, not-in-infra"
sweet spot: no Elastic/Meilisearch cluster to run, but real
in-content matching with snippets that show *where* the term hit.

## What ships

- **`app/api/search/route.ts`** — the JSON endpoint at
  `GET /api/search?q=<term>`. Node runtime (uses `pg`). Site-scoped
  via `getCurrentSite()`.
- **`components/SearchOverlay.tsx`** — client overlay component. Drop
  it in your public site's `Header`, wire an `open`/`onClose` state
  from a button, done.

## What gets searched

The endpoint returns hits from three sources, deduped by URL:

| Source | Content indexed |
|---|---|
| `KNOWN_EDITABLE_PAGES` | Label, slug, section, path |
| `STATIC_NAV_TARGETS` (in the route file — populate per project) | Same fields |
| `pages` (this site) | Every string in `pages.published` JSONB, or the latest `page_versions.data` if unpublished |
| `posts` (this site, `isPublished=true`) | title + excerpt + every string in `posts.published` JSONB or latest `post_versions.data` |

Ranking (per hit):

1. exact title match — `100`
2. title starts with term — `80`
3. title contains term — `60`
4. excerpt contains term — `40`
5. body contains term — `10`

Client sees up to 25 hits, ordered.

## What gets skipped

To keep snippets readable, the JSONB walker skips:

- Structural keys: `id`, `type`, `slug`, `image`, `src`, `href`,
  `url`, `ctaHref`, `primaryHref`, `secondaryHref`, `photo`,
  `coverImage`, `flag`, `flagUrl`, `icon`, `poster`, `thumbnail`,
  `background`, `bg`.
- Any string value that looks like a URL/path — starts with `/`,
  `http:`, `https:`, `mailto:`, `tel:`, or ends in a common asset
  extension (`.jpg`, `.png`, `.svg`, `.pdf`, `.webp`, `.avif`, `.gif`).

Both lists live at the top of `route.ts` — extend per project if you
have props that shouldn't turn up in snippets (`slack`, `phone`,
`analyticsId`, etc.).

## Snippet extraction

For each match, the endpoint finds the first string that contains
the term and returns a 140-char window around it with `…` ellipses.
Passed through unchanged as `hit.excerpt`.

## Wiring it into your header

The template's `Header.tsx` is project-specific and not shipped by
flashcms itself. Wire it manually:

```tsx
'use client';

import { useState } from 'react';
import SearchOverlay from '@/components/SearchOverlay';

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <button aria-label="Search" onClick={() => setSearchOpen(true)}>
        🔍
      </button>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
```

The overlay handles its own scroll lock, keyboard shortcuts (↑↓, Enter,
Esc), debouncing, and empty states.

## Styling

The overlay uses `.ng-search__*` class names in its own CSS namespace.
Copy the block at the bottom of the SFH globals.css into your own
public stylesheet, or restyle from scratch — the markup is small.

## Upgrade path (proper full-text search)

The current implementation is `ILIKE`-free: it pulls all pages/posts
for the site (a small set) and does the matching in JS. Fine up to a
few thousand pages+posts total; beyond that:

1. Add generated `tsvector` columns to `pages` + `posts`:

    ```sql
    ALTER TABLE pages ADD COLUMN search_tsv tsvector
      GENERATED ALWAYS AS (
        to_tsvector('english',
          coalesce(title,'') || ' ' ||
          coalesce(published::text,''))
      ) STORED;
    CREATE INDEX pages_search_idx ON pages USING gin(search_tsv);
    ```

2. Swap the in-JS scan for a `websearch_to_tsquery` + `ts_rank_cd`
   query. Keep the SearchOverlay + endpoint interface identical.
