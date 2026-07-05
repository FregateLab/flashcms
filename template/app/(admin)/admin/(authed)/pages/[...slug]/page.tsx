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
  if (!known || !known.ready) notFound();

  const [row, editable, seo] = await Promise.all([
    getPageBySlugForAdmin(slug),
    getPageEditableData(slug),
    getPageSeo(slug),
  ]);

  return (
    <PageEditor
      initial={{
        slug: known.slug,
        label: known.label,
        path: known.path,
        data: editable,
        isPublished: !!row?.published,
        seo,
      }}
      savedFlag={sp.saved === '1'}
    />
  );
}
