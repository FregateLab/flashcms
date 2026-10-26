/**
 * COPY to app/(frontend)/[...slug]/page.tsx in your project.
 *
 * Serves custom CMS pages — the ones created from /admin/pages →
 * "New page…" that don't have a hand-coded route. Explicit routes always
 * win; this catch-all only fires for slugs no other route claims, and
 * 404s when the slug has no published `pages` row.
 *
 * If you already have a catch-all route, merge the renderCmsPage() call
 * into it instead.
 */
import { notFound } from 'next/navigation';
import { renderCmsPage, buildCmsMetadata } from '@/lib/render-cms-page';
import { getPublishedPageBySlug } from '@/lib/pages';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: segments } = await params;
  const slug = segments.join('/');
  const page = await getPublishedPageBySlug(slug);
  if (!page?.published) return {};
  return buildCmsMetadata(slug, page.title || slug);
}

export default async function CmsCustomPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: segments } = await params;
  const slug = segments.join('/');
  const rendered = await renderCmsPage(slug);
  if (!rendered) notFound();
  return rendered;
}
