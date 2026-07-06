# Dynamic blocks (data-driven Puck blocks)

Static blocks (Hero, Heading, RichText, CardGrid) render whatever props
the editor typed. **Dynamic blocks** render data from the database:
a "Latest posts" band, a "Featured event", an "Upcoming release" tile,
a "Team members" grid populated from the `users` table. Same visual,
different source of truth.

This page explains the pattern flashcms uses for dynamic blocks and
the constraints they have to respect.

## The two-config trick

flashcms splits the Puck configuration into a **client-safe** shape
(the block's `render` returns a placeholder React tree) and a
**server-side override** (the block's `render` is an async server
component that queries the DB).

- The client editor bundle imports the client-safe config and never
  touches `@/db`. Preview shows a friendly placeholder.
- Public routes call `renderCmsPage(slug)` which merges the client
  config with the server overrides, so the DB-backed renderers run
  during SSR.

```ts
// lib/render-cms-page.tsx
const serverPuckConfig = {
  ...puckConfig,
  components: {
    ...puckConfig.components,
    LatestPosts: {
      ...puckConfig.components.LatestPosts,
      render:
        LatestPostsServer as unknown as (typeof puckConfig.components.LatestPosts)['render'],
    },
  },
} satisfies typeof puckConfig;
```

Why the cast? Puck's `render` type expects a synchronous JSX-returning
function. React 19 async server components are legal at runtime but
not in Puck's older types. The `as unknown as …` bridges the gap.

## Writing a dynamic block

1. **Define the client-safe placeholder** in `lib/puck-config.tsx`:

    ```tsx
    LatestPosts: {
      label: 'Latest posts',
      fields: {
        heading: { type: 'text', label: 'Heading' },
        limit: { type: 'number', label: 'How many posts' },
      },
      defaultProps: { heading: 'Latest news', limit: 3 },
      // Editor-only render: shows a placeholder line so authors know
      // the block will fill on the public site.
      render: ({ heading, limit }) => (
        <section style={{ padding: 24, background: '#f8fafc' }}>
          <h2>{heading}</h2>
          <p><em>Dynamic — the {limit} latest posts render here on
          the public site.</em></p>
        </section>
      ),
    },
    ```

2. **Write the server renderer** in a separate file (e.g.
   `lib/dynamic-renderers.tsx`) — this is the async server component
   that queries the DB:

    ```tsx
    export async function LatestPostsServer(props: {
      heading: string;
      limit: number;
    }) {
      const site = await getCurrentSite();
      const rows = await db.select().from(posts)
        .where(and(eq(posts.siteId, site.id), eq(posts.isPublished, true)))
        .orderBy(desc(posts.publishedAt))
        .limit(props.limit);

      // Hide the section on the public site when there's nothing to
      // show. Editor still shows the placeholder.
      if (!rows.length) return null;

      return (
        <section>
          <h2>{props.heading}</h2>
          {/* … render rows … */}
        </section>
      );
    }
    ```

3. **Wire the override** in `lib/render-cms-page.tsx` (see the
   `serverPuckConfig` block above).

That's it. Editors drag `LatestPosts` into a page, tune fields,
publish — the public route fetches posts at render time.

## Hide-when-empty is the default

Every dynamic block should return `null` when there's no data:

- The public site collapses cleanly — no orphan headings, no
  "coming soon" text that looks like a broken page.
- The editor keeps rendering the placeholder because it uses the
  client-safe config, not the server override.

## Constraints

- **The client config must not import `@/db`, `@/lib/auth`, or any
  Node-only module.** Server renderers live in a separate file so the
  client bundle stays clean.
- **Dynamic blocks re-render per request.** Wrap DB queries in
  `unstable_cache` with a `revalidateTag` if you need caching — see
  how `lib/pages.ts` tags published pages.
- **The Puck type cast for async components is intentional.** Don't
  chase it — it's a known upstream typing gap.

## When to reach for a dynamic block

Use a dynamic block when:
- The list changes without editorial action (recent posts, upcoming
  events with a date filter, team members from `users`).
- You want editors to control the surrounding chrome (heading,
  eyebrow, "view all" URL) but not the items themselves.
- The count is variable — a static CardGrid with 6 slots doesn't
  scale to "everything published this year".

Use a static block instead when the content is editorially curated
and stable — a hand-picked "featured programmes" grid where the
sequence matters.
