import type { Metadata } from 'next';
import { Render } from '@measured/puck';
import type { ReactNode } from 'react';
import { getPublishedPageBySlug, type PageSeo } from '@/lib/pages';
import { puckConfig } from '@/lib/puck-config';
import { PressFeatServer, PressListServer } from '@/lib/press-renderers';

const SITE_TAG = 'Society for Family Health';

/** Build Next `Metadata` for a CMS-driven route, reading the pages.seo
 *  column and falling back to sensible defaults. */
export async function buildCmsMetadata(
  slug: string,
  fallbackTitle: string,
): Promise<Metadata> {
  const page = await getPublishedPageBySlug(slug);
  const seo = (page?.seo as PageSeo | null) ?? null;

  const rawTitle = (seo?.title?.trim() || page?.title?.trim() || fallbackTitle).trim();
  const title = rawTitle.includes('SFH') ? rawTitle : `${rawTitle} · SFH`;
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
      siteName: SITE_TAG,
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

export async function CmsPage({
  slug,
  before,
  after,
}: {
  slug: string;
  before?: ReactNode;
  after?: ReactNode;
}) {
  const page = await getPublishedPageBySlug(slug);
  if (!page?.published) {
    return (
      <main>
        <section className="aboutHero">
          <div className="aboutHero__overlay" aria-hidden="true" />
          <div className="container aboutHero__panel">
            <span className="aboutHero__eyebrow">SFH</span>
            <h1 className="aboutHero__title">Content pending</h1>
          </div>
        </section>
      </main>
    );
  }
  return (
    <main>
      {before}
      <Render
        config={serverPuckConfig}
        data={page.published as Parameters<typeof Render>[0]['data']}
      />
      {after}
    </main>
  );
}
