'use server';

import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db, media } from '@/db';
import { getCurrentSite } from '@/lib/site';
import {
  deleteFromStorage,
  uploadToStorage,
} from '@/lib/storage';

export type MediaFormState = { error?: string; ok?: boolean };

// Maximum single-file upload size we let through the server action.
// Larger than this and editors should compress the image; we don't
// want the Node process buffering giant files.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// -------- reads ---------------------------------------------------------
export async function listMedia() {
  const site = await getCurrentSite();
  return db
    .select()
    .from(media)
    .where(eq(media.siteId, site.id))
    .orderBy(desc(media.createdAt));
}

// -------- upload --------------------------------------------------------
function slugifyFilename(name: string) {
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  const base = parts
    .join('.')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';
  return { base, ext };
}

export async function uploadMedia(
  _prev: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  const files = formData.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return { error: 'No files selected.' };

  const site = await getCurrentSite();
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');

  for (const file of files) {
    if (file.size === 0) continue;
    if (file.size > MAX_UPLOAD_BYTES) {
      return {
        error: `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB per file.`,
      };
    }

    const { base, ext } = slugifyFilename(file.name);
    const key = `${site.slug}/${yyyy}/${mm}/${randomUUID()}-${base}${ext ? '.' + ext : ''}`;
    const contentType = file.type || 'application/octet-stream';

    const bytes = new Uint8Array(await file.arrayBuffer());
    const url = await uploadToStorage(key, bytes, contentType);

    await db.insert(media).values({
      siteId: site.id,
      key,
      url,
      filename: file.name,
      contentType,
      size: String(file.size),
      uploadedBy: session.user.id!,
    });
  }

  revalidatePath('/admin/media');
  return { ok: true };
}

// -------- delete --------------------------------------------------------
export async function deleteMedia(
  _prev: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'Not authenticated.' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing id.' };

  const site = await getCurrentSite();
  const [row] = await db
    .select()
    .from(media)
    .where(and(eq(media.id, id), eq(media.siteId, site.id)));
  if (!row) return { error: 'Not found.' };

  try {
    await deleteFromStorage(row.key);
  } catch {
    // If the object is already gone in storage that's fine; still remove
    // the DB row so the library stays clean.
  }
  await db.delete(media).where(eq(media.id, id));

  revalidatePath('/admin/media');
  return { ok: true };
}
