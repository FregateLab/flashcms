import type { Metadata } from 'next';
import { Render } from '@measured/puck';
import type { ReactElement, ReactNode } from 'react';
import { getPublishedPageBySlug, type PageSeo } from '@/lib/pages';
import { getCurrentSite } from '@/lib/site';
import { puckConfig } from '@/lib/puck-config';
import { PressFeatServer, PressListServer } from '@/lib/press-renderers';

/** Build Next `Metadata` for a CMS-driven route, reading the pages.seo
 *  column and falling back to sensible defaults. */
export async function buildCmsMetadata(
  slug: string,
  fallbackTitle: string,
): Promise<Metadata> {
  const [page, site] = await Promise.all([
    getPublishedPageBySlug(slug),
    getCurrentSite(),
  ]);
  const seo = (page?.seo as PageSeo | null) ?? null;

  // Title suffix + og:site_name come from the sites row, so every
  // tenant gets its own brand without editing this file.
  const rawTitle = (seo?.title?.trim() || page?.title?.trim() || fallbackTitle).trim();
  const suffix = site.name;
  const title = rawTitle.toLowerCase().includes(suffix.toLowerCase())
    ? rawTitle
    : `${rawTitle} · ${suffix}`;
  const description = seo?.description?.trim() || undefined;
  const image = seo?.image || undefined;
  const canonical = seo?.canonical || undefined;
  const noindex = !!seo?.noindex;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      siteName: site.name,
      images: image ? [image] : undefined,
      type: 'website',
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

// Server-side Puck config. Wraps the client-safe puckConfig with real
// implementations for dynamic blocks whose renderers pull from the DB.
// The client bundle still only sees the placeholder renders, so @/db
// stays server-only.
//
// Puck's `render` type expects a synchronous JSX-returning function.
// PressFeatServer / PressListServer are React 19 async server components
// — legal at runtime but not in Puck's older types. The cast bridges
// that gap; there's no other type mismatch to worry about.
const serverPuckConfig = {
  ...puckConfig,
  components: {
    ...puckConfig.components,
    PressFeatDynamic: {
      ...puckConfig.components.PressFeatDynamic,
      render: PressFeatServer as unknown as (typeof puckConfig.components.PressFeatDynamic)['render'],
    },
    PressListDynamic: {
      ...puckConfig.components.PressListDynamic,
      render: PressListServer as unknown as (typeof puckConfig.components.PressListDynamic)['render'],
    },
  },
} satisfies typeof puckConfig;

/**
 * Returns rendered CMS JSX for `slug`, or null if the page isn't
 * published yet. Callers render their own fallback for the null case
 * (hand-coded content, notFound(), …). Calling a plain async function
 * keeps async components out of JSX, so this stays React-18-types
 * compatible.
 *
 *   const cms = await renderCmsPage('about');
 *   if (cms) return cms;
 *   return <HandCodedAbout />;
 */
export async function renderCmsPage(
  slug: string,
  opts?: { before?: ReactNode; after?: ReactNode },
): Promise<ReactElement | null> {
  const page = await getPublishedPageBySlug(slug);
  if (!page?.published) return null;
  return (
    <main>
      {opts?.before}
      <Render
        config={serverPuckConfig}
        data={page.published as Parameters<typeof Render>[0]['data']}
      />
      {opts?.after}
    </main>
  );
}

/**
 * JSX form kept for backwards compatibility with 1.0.x routes
 * (`<CmsPage slug="about" />`). Shows a generic "Content pending"
 * panel when nothing is published. Prefer `renderCmsPage` for new code.
 */
export async function CmsPage({
  slug,
  before,
  after,
}: {
  slug: string;
  before?: ReactNode;
  after?: ReactNode;
}) {
  const rendered = await renderCmsPage(slug, { before, after });
  if (rendered) return rendered;
  const site = await getCurrentSite();
  return (
    <main>
      <section className="aboutHero">
        <div className="aboutHero__overlay" aria-hidden="true" />
        <div className="container aboutHero__panel">
          <span className="aboutHero__eyebrow">{site.name}</span>
          <h1 className="aboutHero__title">Content pending</h1>
        </div>
      </section>
    </main>
  );
}
