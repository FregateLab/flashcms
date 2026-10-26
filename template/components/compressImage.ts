'use client';

// Client-side image shrinker used by MediaUploader, MediaPicker, and
// ImageCropModal. Draws the file onto a canvas, downscales to a max
// dimension, and re-encodes as JPEG at a set quality. Skips images
// that are already under the target size, and formats we can't
// re-encode without loss (GIF animations, SVG vectors). Images over
// 1.5 MB are shrunk by default, which keeps typical photos well under
// the server-action body cap (see MAX_CLIENT_UPLOAD_BYTES below).

export type CompressOptions = {
  /** Skip compression when the source is already at or below this size. */
  maxBytes?: number;
  /** Clamp width AND height to this value. */
  maxDimension?: number;
  /** JPEG quality, 0-1. */
  quality?: number;
};

const DEFAULTS: Required<CompressOptions> = {
  maxBytes: 1_500_000,
  maxDimension: 2400,
  quality: 0.85,
};

const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml']);

/**
 * Largest file the admin UI will send through the uploadMedia server
 * action, checked AFTER compression. Keep it at or below both
 * `experimental.serverActions.bodySizeLimit` in next.config and
 * MAX_UPLOAD_BYTES in lib/media.ts (15 MB by default). Override per
 * site with NEXT_PUBLIC_MAX_UPLOAD_MB (e.g. "2" on a host with a 2 MB
 * body cap).
 */
export const MAX_CLIENT_UPLOAD_BYTES =
  (Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 15) * 1024 * 1024;

/** Friendly message for a file that's still over the cap after compressing. */
export function tooLargeMessage(name: string, bytes: number): string {
  const mb = (bytes / 1024 / 1024).toFixed(1);
  const cap = (MAX_CLIENT_UPLOAD_BYTES / 1024 / 1024).toFixed(0);
  return `"${name}" is ${mb} MB after compressing — still larger than the ${cap} MB upload limit. Please shrink it further (e.g. tinyjpg.com / tinypng.com) and re-upload.`;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const { maxBytes, maxDimension, quality } = { ...DEFAULTS, ...options };

  if (!file.type.startsWith('image/')) return file;
  if (SKIP_TYPES.has(file.type)) return file;
  if (file.size <= maxBytes) return file;

  let img: HTMLImageElement;
  try {
    img = await loadImageFromFile(file);
  } catch {
    // If the browser can't decode it (corrupt, unsupported), let the
    // upload flow report the failure — don't silently swap it.
    return file;
  }

  const scale = Math.min(
    1,
    maxDimension / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  let blob: Blob | null = null;
  try {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });
  } catch {
    return file;
  }
  if (!blob || blob.size >= file.size) return file;

  const stem = file.name.replace(/\.[a-z0-9]+$/i, '') || 'image';
  return new File([blob], `${stem}.jpg`, { type: 'image/jpeg' });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image decode failed'));
    };
    img.src = url;
  });
}

/**
 * Turn any thrown/returned upload error into an editor-friendly message.
 * Recognises Next's server-action body-cap error string and suggests
 * TinyJPG / TinyPNG. Falls back to the raw message otherwise.
 */
export function humanizeUploadError(err: unknown, filename?: string): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'Upload failed.');
  const looksLikeBodyLimit =
    /body\s+exceeded|body\s+size|413|too\s+large|payload/i.test(raw);
  if (looksLikeBodyLimit) {
    const label = filename ? `"${filename}"` : 'That image';
    return `${label} is still too large after auto-compressing. Please shrink it further with tinyjpg.com or tinypng.com, then re-upload.`;
  }
  return raw;
}
