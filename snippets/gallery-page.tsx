/**
 * COPY to app/(frontend)/gallery/page.tsx in your project.
 *
 * Public photo gallery backed by the gallery_photos table (managed at
 * /admin/gallery). Click any photo to open <GalleryLightbox> — a
 * fullscreen viewer with prev/next, thumbnails and keyboard controls.
 * Styles: see snippets/cms-frontend.css (.cms-gallery, .gphoto, .lightbox).
 *
 * Optional: register `gallery` in lib/known-routes.ts if you want
 * editors to be able to replace this page with a Puck layout — the
 * renderCmsPage() call below takes over once a CMS version is published.
 */
import { renderCmsPage, buildCmsMetadata } from '@/lib/render-cms-page';
import GalleryLightbox from '@/components/GalleryLightbox';
import { getPublishedGalleryPhotos } from '@/lib/gallery';

// Render per request (data is still cached via unstable_cache + the
// 'gallery' tag). Without this, `next build` prerenders the page and
// needs DATABASE_URI in the build environment.
export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return buildCmsMetadata('gallery', 'Gallery');
}

export default async function GalleryPage() {
  const cms = await renderCmsPage('gallery');
  if (cms) return cms;

  const photos = (await getPublishedGalleryPhotos()).map((r) => ({
    src: r.image,
    caption: r.caption,
  }));

  return (
    <main>
      <section className="cms-gallery" aria-label="Photo gallery">
        <div className="container">
          <h1>Gallery</h1>
          {photos.length === 0 ? (
            <p>No photos yet.</p>
          ) : (
            <ul className="cms-gallery__grid">
              {photos.map((p, i) => (
                <li
                  className="gphoto"
                  key={`${p.src}-${i}`}
                  data-gallery-index={i}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${p.caption} in the gallery viewer`}
                >
                  <figure className="gphoto__media">
                    <img src={p.src} alt={p.caption} loading="lazy" />
                  </figure>
                  <figcaption className="gphoto__caption">{p.caption}</figcaption>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Opens on click via document-level delegation on [data-gallery-index]. */}
      <GalleryLightbox photos={photos} />
    </main>
  );
}
