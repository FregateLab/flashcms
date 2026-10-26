'use server';

import { and, asc, desc, eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, galleryPhotos } from '@/db';
import { getCurrentSite } from '@/lib/site';

const upsertInput = z.object({
  id: z.string().uuid().optional(),
  image: z.string().min(1, 'Attach an image.'),
  caption: z.string().min(1).max(240),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.coerce.boolean().default(true),
});

export type GalleryFormState = { error?: string; ok?: boolean };

// -------- reads -------------------------------------------------------
// Admin reads include hidden photos, so they're auth-gated — every
// export of a 'use server' module is callable from the client.
export async function listGalleryPhotos() {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated.');
  const site = await getCurrentSite();
  return db
    .select()
    .from(galleryPhotos)
    .where(eq(galleryPhotos.siteId, site.id))
    .orderBy(asc(galleryPhotos.sortOrder), desc(galleryPhotos.createdAt));
}

export async function getGalleryPhotoById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated.');
  const site = await getCurrentSite();
  const [row] = await db
    .select()
    .from(galleryPhotos)
    .where(and(eq(galleryPhotos.id, id), eq(galleryPhotos.siteId, site.id)));
  return row ?? null;
}

// Public read — cache-tagged so publishes flush cleanly.
export async function getPublishedGalleryPhotos() {
  const loader = unstable_cache(
    async () => {
      const site = await getCurrentSite();
      return db
        .select({
          id: galleryPhotos.id,
          image: galleryPhotos.image,
          caption: galleryPhotos.caption,
        })
        .from(galleryPhotos)
        .where(
          and(
            eq(galleryPhotos.siteId, site.id),
            eq(galleryPhotos.isPublished, true),
          ),
        )
        .orderBy(asc(galleryPhotos.sortOrder), desc(galleryPhotos.createdAt));
    },
    ['published-gallery-photos'],
    { tags: ['gallery'] },
  );
  return loader();
}

// -------- write -------------------------------------------------------
export async function saveGalleryPhoto(
  _prev: GalleryFormState,
  formData: FormData,
): Promise<GalleryFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  const parsed = upsertInput.safeParse({
    id: formData.get('id') || undefined,
    image: formData.get('image'),
    caption: formData.get('caption'),
    sortOrder: formData.get('sortOrder') || 0,
    isPublished: formData.get('isPublished') === 'true',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const input = parsed.data;

  const site = await getCurrentSite();
  const userId = session.user.id!;
  const now = new Date();

  const isCreate = !input.id;
  let rowId = input.id;
  if (rowId) {
    await db
      .update(galleryPhotos)
      .set({
        image: input.image,
        caption: input.caption,
        sortOrder: input.sortOrder,
        isPublished: input.isPublished,
        updatedAt: now,
      })
      .where(
        and(eq(galleryPhotos.id, rowId), eq(galleryPhotos.siteId, site.id)),
      );
  } else {
    const [row] = await db
      .insert(galleryPhotos)
      .values({
        siteId: site.id,
        image: input.image,
        caption: input.caption,
        sortOrder: input.sortOrder,
        isPublished: input.isPublished,
        createdBy: userId,
      })
      .returning({ id: galleryPhotos.id });
    rowId = row.id;
  }

  revalidateTag('gallery');
  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');

  if (isCreate) redirect('/admin/gallery');
  redirect(`/admin/gallery/${rowId}?saved=1`);
}

export async function deleteGalleryPhoto(
  _prev: GalleryFormState,
  formData: FormData,
): Promise<GalleryFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing id.' };
  const site = await getCurrentSite();

  await db
    .delete(galleryPhotos)
    .where(and(eq(galleryPhotos.id, id), eq(galleryPhotos.siteId, site.id)));

  revalidateTag('gallery');
  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
  redirect('/admin/gallery');
}

export async function toggleGalleryPhotoPublished(
  _prev: GalleryFormState,
  formData: FormData,
): Promise<GalleryFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing id.' };
  const site = await getCurrentSite();

  const [row] = await db
    .select({ isPublished: galleryPhotos.isPublished })
    .from(galleryPhotos)
    .where(and(eq(galleryPhotos.id, id), eq(galleryPhotos.siteId, site.id)));
  if (!row) return { error: 'Not found.' };

  await db
    .update(galleryPhotos)
    .set({ isPublished: !row.isPublished, updatedAt: new Date() })
    .where(and(eq(galleryPhotos.id, id), eq(galleryPhotos.siteId, site.id)));

  revalidateTag('gallery');
  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
  return { ok: true };
}
