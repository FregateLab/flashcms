# SEO

## Data shape

`pages.seo` (jsonb, nullable):

```ts
type PageSeo = {
  title?: string | null;
  description?: string | null;
  image?: string | null;      // OG image URL
  canonical?: string | null;
  noindex?: boolean;
};
```

## Editor UI

Every page editor has an **SEO** button in the toolbar that opens
`SeoModal.tsx`:

- Meta title (with character counter, falls back to the page label)
- Meta description (with character counter)
- OG image (uses `MediaPicker` for browse)
- Canonical URL
- Noindex / nofollow checkbox
- **Live Google-style preview** at the top updates as you type

Save fires `savePageSeo` → updates `pages.seo` + `revalidateTag`.

## Public site rendering

Every CMS-driven route uses `generateMetadata` and calls
`buildCmsMetadata(slug, fallbackTitle)`:

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

`buildCmsMetadata` returns a Next `Metadata` object with:

- `title` (appends `· SFH` if not already present — rename in the
  helper for your brand)
- `description`
- `openGraph` (`title`, `description`, `siteName`, `type: 'website'`,
  `images`)
- `twitter` card (auto-picks `summary_large_image` when an OG image
  is set)
- `alternates.canonical` when set
- `robots: { index: false, follow: false }` when noindex is on

## What's not included

- **Sitemap generation** — add `app/sitemap.ts`. `getPublishedPageBySlug`
  and `getPublishedPosts` are your data sources.
- **robots.txt** — add `app/robots.ts`.
- **hreflang** for multi-locale — the CMS is single-locale today.
- **Structured data / JSON-LD** — hand-code in your route pages or add
  a `SchemaOrg` block to the Puck library.

## Fallback chain

`buildCmsMetadata(slug, fallbackTitle)` uses this order:

1. `pages.seo.title` → 2. `pages.title` → 3. `fallbackTitle` argument.

Same for description → `pages.seo.description` only (no fallback
paragraph is generated).
