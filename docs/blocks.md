# Puck blocks

## Overview

Pages are stored as Puck `Data` in `pages.published`:

```jsonc
{
  "root": { "props": {} },
  "content": [
    { "type": "AboutHero", "props": { … } },
    { "type": "AboutFacts", "props": { … } },
    { "type": "AboutFeature", "props": { … } }
  ],
  "zones": {}
}
```

Each entry in `content` names a block registered in
`lib/puck-config.tsx`. Puck's `<Render>` walks the array and calls the
block's `render` function.

## The block library

The starter library covers roughly 30 SFH-styled blocks. Skim
`lib/puck-config.tsx` for the full list. Groups:

- Interior hero pattern (`AboutHero`)
- Homepage hero carousel (`HeroCarousel`)
- Stats strips (`StatsStrip`, `AboutFacts`)
- Editorial copy (`WhoBand`, `AboutFeature`, `VisionMission`)
- Rows and grids (`CountriesGrid`, `CountriesEditorial`,
  `EntitiesEditorial`, `PeopleBand`, `Gallery`, `NumberedCardsGrid`)
- Feature cards (`CpageFeature`, `CareersCtaCard`)
- Products (`ProductPlatforms`, `ProductsSpotlight`)
- Reports (`ReportsFeat`, `ReportsList`, `ReportsArchive`)
- Impact (`ImpactDeliver`, `ImpactKeyResults`, `ImpactProgrammes`,
  `ImpactResearch`)
- Journey / timeline (`JourneyChapters`)
- Contact (`ContactRoutes`, `ContactMessageForm`, `ContactOffices`,
  `CpageOffice`)
- Homepage press (`HomePressGrid`)
- Marquees (`PartnersMarquee`)
- Utility (`Hero`, `TextBlock`, `CTA`, `RawHtmlSection`, `CpageIntro`)
- Dynamic (`PressFeatDynamic`, `PressListDynamic`, `PressMediaBand`)

## Adding a new block

Open `lib/puck-config.tsx`. Add to `PuckComponents` and to
`components`:

```tsx
type CalloutProps = {
  title: string;
  body: string;
  emphasis?: 'default' | 'red';
};

export type PuckComponents = {
  // …existing…
  Callout: CalloutProps;
};

// then in the Config object, under components:
Callout: {
  label: 'Callout',
  fields: {
    title: { type: 'text', label: 'Title' },
    body: { type: 'textarea', label: 'Body' },
    emphasis: {
      type: 'select',
      label: 'Emphasis',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Red', value: 'red' },
      ],
    },
  },
  defaultProps: { title: 'Hello', body: '', emphasis: 'default' },
  render: ({ title, body, emphasis }) => (
    <section
      className={`callout ${emphasis === 'red' ? 'callout--red' : ''}`}
    >
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  ),
},
```

That's it — the block shows up in the Puck editor's palette immediately.

## Field types

The most common:

| Type | Notes |
|---|---|
| `text` | Single-line string |
| `textarea` | Multi-line string |
| `select` | Dropdown with `options` |
| `radio` | Radio group with `options` |
| `number` | Numeric input |
| `array` | Repeatable sub-fields via `arrayFields`. See `PeopleBand`, `HeroCarousel` for examples |
| `object` | Nested object with `objectFields` |
| `custom` | Bring your own React component. Used by `imageField(label)` for the media picker |

## Image fields → media picker

Rather than a raw `text` field for image URLs, use the `imageField`
helper defined near the top of `lib/puck-config.tsx`:

```tsx
image: imageField('Background image URL'),
```

It emits a Puck `custom` field that shows a thumbnail preview + a
Browse button that opens `MediaPicker`. See
`components/MediaField.tsx`.

## Dynamic (DB-backed) blocks

`PressFeatDynamic` and `PressListDynamic` are unusual: their content
comes from the DB at render time, not from the block's props.

Pattern:
- In `lib/puck-config.tsx` the block's `render` returns a static
  placeholder JSX (so the Puck editor iframe stays client-safe and
  never pulls in `@/db`).
- In `lib/render-cms-page.tsx`, `serverPuckConfig` overrides these
  render functions with the real async server components from
  `lib/press-renderers.tsx`.

If you add another dynamic block:

```tsx
// lib/puck-config.tsx
MyLatestPostsFeed: {
  fields: { limit: { type: 'number', label: 'Limit' } },
  defaultProps: { limit: 5 },
  render: () => <PressBlockPlaceholder label="Latest posts (dynamic)" />,
},
```

```tsx
// lib/render-cms-page.tsx
import { MyLatestPostsFeedServer } from './my-renderers';

const serverPuckConfig = {
  ...puckConfig,
  components: {
    ...puckConfig.components,
    MyLatestPostsFeed: {
      ...puckConfig.components.MyLatestPostsFeed,
      render: MyLatestPostsFeedServer as unknown as
        (typeof puckConfig.components.MyLatestPostsFeed)['render'],
    },
  },
} satisfies typeof puckConfig;
```

```tsx
// lib/my-renderers.tsx (server-only)
import { getLatestPosts } from '@/lib/blog';
export async function MyLatestPostsFeedServer({ limit }: { limit: number }) {
  const posts = await getLatestPosts(limit);
  return <ul>{/* … */}</ul>;
}
```

## Editor preview parity with the public site

The Puck editor iframe inherits parent-document stylesheets. In the
page editor client, we import:

```tsx
import '@/app/(frontend)/globals.css';    // your public site's CSS
import './puck-preview.css';               // editor-only overrides
```

`puck-preview.css` neutralises the `[data-reveal]` fade-in pattern that
would otherwise leave blocks invisible in the preview (the public
`ClientEffects` script isn't running there).

## Full-width fullscreen editing

`PageEditor.tsx` supports a fullscreen mode (⛶ button). It positions
the wrapper `position: fixed; inset: 0` with its own compact top bar.
Escape exits. Body scroll is locked while fullscreen.

## SEO

Every page has an **SEO** button in the editor toolbar that opens
`SeoModal.tsx`. Fields land in `pages.seo`. On the public route,
`buildCmsMetadata(slug, fallbackTitle)` in `lib/render-cms-page.tsx`
turns that JSON into a full Next `Metadata` object with OG + Twitter
tags. See `docs/seo.md`.
