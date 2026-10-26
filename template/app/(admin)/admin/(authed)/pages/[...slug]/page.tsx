import { notFound } from 'next/navigation';
import PageEditor from '../PageEditor';
import { findKnownPage, routeParamToSlug } from '@/lib/known-routes';
import {
  getPageBySlugForAdmin,
  getPageEditableData,
  getPageSeo,
} from '@/lib/pages';

export default async function AdminPageEditorRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug: slugSegments } = await params;
  const sp = await searchParams;
  const slug = routeParamToSlug(slugSegments);

  const known = findKnownPage(slug);
  const [row, editable, seo] = await Promise.all([
    getPageBySlugForAdmin(slug),
    getPageEditableData(slug),
    getPageSeo(slug),
  ]);

  // Two paths in: (1) a slug that IS in KNOWN_EDITABLE_PAGES — hard-coded
  // route the admin can edit; must be ready. (2) a custom slug that
  // exists as a pages row (created via /admin/pages "New page…"); served
  // by the catch-all frontend route.
  if (known) {
    if (!known.ready) notFound();
  } else if (!row) {
    notFound();
  }

  return (
    <PageEditor
      initial={{
        slug,
        label: known?.label ?? row?.title ?? slug,
        path: known?.path ?? `/${slug}`,
        data: editable,
        isPublished: !!row?.published,
        seo,
      }}
      savedFlag={sp.saved === '1'}
    />
  );
}
