/**
 * MERGE into your public (frontend) route group's layout.tsx.
 *
 * The AnalyticsBeacon fires a pageview on every route change; the
 * VitalsReporter posts Web Vitals metrics. Both skip /admin/* on their
 * own so it's safe to mount at the very top of the tree.
 *
 * Wrap in <Suspense> so they don't block streaming.
 */
import { Suspense } from 'react';
import AnalyticsBeacon from '@/components/AnalyticsBeacon';
import VitalsReporter from '@/components/VitalsReporter';
import { getFooterConfig, getHeaderConfig } from '@/lib/site-settings';
import { buildCmsMetadata } from '@/lib/render-cms-page';

/**
 * If you'd like site-wide default metadata to also come from the CMS,
 * use this pattern on individual routes instead of a static metadata
 * export at the layout level.
 */
export async function generateMetadata() {
  return buildCmsMetadata('home', 'My Site');
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Header/footer live in the sites row and are edited from
  // /admin/site-settings. Falls back to DEFAULT_HEADER/DEFAULT_FOOTER
  // if no row has been customised yet.
  const [headerConfig, footerConfig] = await Promise.all([
    getHeaderConfig(),
    getFooterConfig(),
  ]);

  return (
    <html lang="en">
      <body>
        {/* Render your own Header/Footer/MobileMenu here; pass the
            resolved configs as props. See docs/site-settings.md for
            the shape. */}
        {children}
        <Suspense fallback={null}>
          <AnalyticsBeacon />
          <VitalsReporter />
        </Suspense>
      </body>
    </html>
  );
}
