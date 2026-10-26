import { notFound } from 'next/navigation';
import GalleryPhotoEditor from '../GalleryPhotoEditor';
import { getGalleryPhotoById } from '@/lib/gallery';

export default async function AdminEditGalleryPhotoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const row = await getGalleryPhotoById(id);
  if (!row) notFound();

  return (
    <GalleryPhotoEditor
      initial={{
        id: row.id,
        image: row.image,
        caption: row.caption,
        sortOrder: row.sortOrder,
        isPublished: row.isPublished,
      }}
      savedFlag={sp.saved === '1'}
    />
  );
}
