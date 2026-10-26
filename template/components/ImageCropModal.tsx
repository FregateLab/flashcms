'use client';

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { uploadMedia } from '@/lib/media';
import {
  MAX_CLIENT_UPLOAD_BYTES,
  compressImage,
  humanizeUploadError,
  tooLargeMessage,
} from './compressImage';

// Aspect-ratio presets shown as pill toggles. "cover" matches a wide
// article hero (roughly 21:9); "square" is for thumbnails / people
// portraits; "free" removes the constraint. EXTENSION POINT: adjust to
// the ratios your site's templates actually render.
const RATIOS: { key: string; label: string; value: number | undefined }[] = [
  { key: 'cover', label: 'Banner (21:9)', value: 21 / 9 },
  { key: 'wide', label: 'Wide (16:9)', value: 16 / 9 },
  { key: 'square', label: 'Square (1:1)', value: 1 },
  { key: 'portrait', label: 'Portrait (4:5)', value: 4 / 5 },
  { key: 'free', label: 'Free', value: undefined },
];

/**
 * Modal that lets an editor crop an existing image (either the current
 * cover on the post editor OR any media-library entry). On save it
 * canvas-encodes the cropped region, uploads it as a NEW media-library
 * file through the uploadMedia server action, and calls `onCropped`
 * with the new public URL. The original image is preserved.
 *
 * The source image is loaded with crossOrigin="anonymous" so the canvas
 * can read it — your storage bucket must serve images with an
 * Access-Control-Allow-Origin header that covers the admin origin
 * (see docs/media-storage.md).
 */
export default function ImageCropModal({
  open,
  src,
  initialAspect,
  onClose,
  onCropped,
}: {
  open: boolean;
  src: string | null;
  initialAspect?: number;
  onClose: () => void;
  onCropped: (nextUrl: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(
    initialAspect ?? 21 / 9,
  );
  const [pixels, setPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCompleted = useCallback((_area: Area, areaPixels: Area) => {
    setPixels(areaPixels);
  }, []);

  async function save() {
    if (!src || !pixels) return;
    setError(null);
    setSaving(true);
    try {
      const blob = await cropToBlob(src, pixels);
      const base = filenameFromUrl(src).replace(/\.[a-z0-9]+$/i, '') || 'image';
      const filename = `${base}-cropped-${Date.now()}.jpg`;
      let file = new File([blob], filename, { type: 'image/jpeg' });
      // Shrink the crop (always JPEG-encodes oversized crops).
      file = await compressImage(file);
      if (file.size > MAX_CLIENT_UPLOAD_BYTES) {
        setError(tooLargeMessage('Cropped image', file.size) + ' Or try cropping tighter.');
        setSaving(false);
        return;
      }
      const fd = new FormData();
      fd.append('files', file);
      const res = await uploadMedia({}, fd);
      if (res.error) throw new Error(res.error);
      // uploadMedia returns the stored URL(s); the filename lookup is a
      // fallback for older lib/media.ts copies that don't.
      const found = res.urls?.[0] ?? (await findMediaByFilename(file.name));
      if (!found) throw new Error('Uploaded, but could not resolve URL.');
      onCropped(found);
      onClose();
    } catch (err) {
      setError(humanizeUploadError(err));
    } finally {
      setSaving(false);
    }
  }

  if (!open || !src) return null;

  return (
    <div
      className="mediaPicker"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="mediaPicker__panel"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 960 }}
      >
        <header className="mediaPicker__head">
          <h3 style={{ margin: 0, fontSize: 18 }}>Crop image</h3>
          <button
            type="button"
            className="mediaPicker__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          {RATIOS.map((r) => (
            <button
              key={r.key}
              type="button"
              className="admin-btn admin-btn--ghost"
              data-active={aspect === r.value ? 'true' : undefined}
              onClick={() => setAspect(r.value)}
              style={{
                padding: '6px 12px',
                fontSize: 12.5,
                background: aspect === r.value ? 'var(--admin-ink)' : undefined,
                color: aspect === r.value ? '#fff' : undefined,
                borderColor: aspect === r.value ? 'var(--admin-ink)' : undefined,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div
          style={{
            position: 'relative',
            height: 480,
            background: '#111',
          }}
        >
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCompleted}
            restrictPosition={false}
          />
        </div>

        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderTop: '1px solid var(--admin-border)',
          }}
        >
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--admin-ink-2)',
            }}
          >
            Zoom
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: 220 }}
            />
          </label>
          <div style={{ flex: 1 }} />
          {error && (
            <span style={{ color: '#b91c1c', fontSize: 13 }}>{error}</span>
          )}
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={save}
            disabled={saving || !pixels}
          >
            {saving ? 'Saving…' : 'Save cropped'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- helpers ---------------------------------------------------------

function filenameFromUrl(url: string): string {
  try {
    const u = new URL(url, 'https://x.invalid');
    return u.pathname.split('/').filter(Boolean).pop() ?? '';
  } catch {
    return url.split('/').pop() ?? '';
  }
}

async function findMediaByFilename(name: string): Promise<string | null> {
  // Look up the just-uploaded row in the media library so we can hand
  // the caller a public URL. listMedia is a server action from
  // lib/media.ts and is safe to call from the client.
  const { listMedia } = await import('@/lib/media');
  const rows = await listMedia();
  const match = rows.find((r) => r.filename === name);
  return match?.url ?? null;
}

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported in this browser.');
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height,
  );
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas encode failed.'))),
      'image/jpeg',
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Bucket objects are public-read; setting crossOrigin lets the
    // canvas read pixel data without tainting (needs CORS on the bucket).
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the image to crop.'));
    img.src = src;
  });
}
