# Photo gallery

A per-site collection of photos with captions, managed in the admin and
rendered by your site's own `/gallery` route. Added in 1.1.0.

## What ships

| File | Role |
|---|---|
| `db/schema.ts` → `galleryPhotos` | Table `gallery_photos` (migration `0010`). |
| `lib/gallery.ts` | Server actions. Admin: `listGalleryPhotos`, `getGalleryPhotoById`, `saveGalleryPhoto`, `deleteGalleryPhoto`, `toggleGalleryPhotoPublished`. Public: `getPublishedGalleryPhotos` (cached, tag `gallery`). |
| `app/(admin)/admin/(authed)/gallery/` | `/admin/gallery` card grid, `/admin/gallery/new`, `/admin/gallery/[id]` editor (media picker, 16:10 crop, caption, sort order, visibility, delete). |
| `components/GalleryLightbox.tsx` | Client fullscreen viewer: prev/next, thumbnail strip, Esc / ← / → keys, body scroll lock. |
| `snippets/gallery-page.tsx` | Drop-in `app/(frontend)/gallery/page.tsx`. |
| `snippets/cms-frontend.css` | `.cms-gallery`, `.gphoto`, `.lightbox` styles. |
| `scripts/seed-gallery.ts` | Bulk-load photos from a JSON file. |

## Data model

```
gallery_photos
  id            uuid pk
  site_id       uuid → sites.id (cascade)
  image         text        absolute URL or /public path
  caption       text        ≤ 240 chars; also the alt text
  sort_order    integer     lower first; ties → newest first
  is_published  boolean     hidden photos stay in the admin only
  created_by    uuid → users.id (set null)
  created_at / updated_at
```

Any signed-in user (editor or admin) can manage photos. Every write
calls `revalidateTag('gallery')` + `revalidatePath('/gallery')`.

## Per-site integration

1. `npm run db:migrate` (adds `gallery_photos`).
2. Copy `snippets/gallery-page.tsx` to `app/(frontend)/gallery/page.tsx`
   and restyle the hero/heading to match your site.
3. Append `snippets/cms-frontend.css` to your public stylesheet (or copy
   just the gallery + lightbox sections).
4. Optional: migrate an existing hard-coded gallery:

   ```bash
   npx tsx scripts/seed-gallery.ts gallery-seed.json
   # [{ "image": "/assets/a.jpg", "caption": "…" }, …]
   ```

5. Optional: add `{ slug: 'gallery', … }` to `lib/known-routes.ts` if
   editors should be able to replace the page with a Puck layout — the
   snippet renders the CMS version first when one is published.

## Using the lightbox elsewhere

`GalleryLightbox` listens for clicks on any element with
`data-gallery-index="<n>"` and opens photo `n` of its `photos` prop, so
it works with any grid markup:

```tsx
<ul>
  {photos.map((p, i) => (
    <li key={p.src} data-gallery-index={i}><img src={p.src} alt={p.caption} /></li>
  ))}
</ul>
<GalleryLightbox photos={photos} />
```

For images inside rendered rich text (blog posts) use
`components/BlogArticleLightbox.tsx` instead — it wires up every `<img>`
inside a container selector automatically.

## As a Puck block

The template's block library doesn't register a gallery block (block
markup is site-specific). To add one, follow `docs/dynamic-blocks.md`:
a client-safe placeholder in `lib/puck-config.tsx` plus a server render
in `lib/render-cms-page.tsx` that calls `getPublishedGalleryPhotos()`.
