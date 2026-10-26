'use client';

import { useActionState, useState } from 'react';
import {
  deleteGalleryPhoto,
  saveGalleryPhoto,
  type GalleryFormState,
} from '@/lib/gallery';
import MediaPicker from '@/components/MediaPicker';
import ImageCropModal from '@/components/ImageCropModal';

type Initial = {
  id?: string;
  image?: string | null;
  caption?: string | null;
  sortOrder?: number;
  isPublished?: boolean;
};

export default function GalleryPhotoEditor({
  initial,
  savedFlag,
}: {
  initial: Initial;
  savedFlag?: boolean;
}) {
  const [state, formAction, pending] = useActionState<GalleryFormState, FormData>(
    saveGalleryPhoto,
    { ok: savedFlag },
  );
  const [, deleteAction, deletePending] = useActionState<GalleryFormState, FormData>(
    deleteGalleryPhoto,
    {},
  );

  const [image, setImage] = useState(initial.image ?? '');
  const [caption, setCaption] = useState(initial.caption ?? '');
  const [sortOrder, setSortOrder] = useState(
    initial.sortOrder != null ? String(initial.sortOrder) : '0',
  );
  const [isPublished, setIsPublished] = useState(initial.isPublished ?? true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const missing = !image;

  return (
    <form action={formAction} className="admin-editor">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="image" value={image} />
      <input type="hidden" name="isPublished" value={String(isPublished)} />

      <div className="admin-editor__main">
        <div className="admin-card">
          <div className="admin-fielded">
            <label className="admin-label">Photo</label>
            {image ? (
              <div
                style={{
                  aspectRatio: '16/10',
                  background: 'var(--admin-surface-2, #f3f4f6)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  marginBottom: 8,
                }}
              >
                <img
                  src={image}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            ) : (
              <p
                className="admin-lede"
                style={{
                  padding: 24,
                  textAlign: 'center',
                  borderRadius: 10,
                  border: '1px dashed var(--admin-border)',
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                No photo attached yet.
              </p>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => setPickerOpen(true)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {image ? 'Replace photo' : 'Browse media'}
              </button>
              {image && (
                <>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => setCropSrc(image)}
                  >
                    Crop
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => setImage('')}
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-fielded">
            <label className="admin-label" htmlFor="caption">
              Caption
            </label>
            <textarea
              id="caption"
              name="caption"
              className="admin-input"
              rows={3}
              placeholder="e.g. Volunteers at the spring open day"
              value={caption}
              maxLength={240}
              onChange={(e) => setCaption(e.target.value)}
              required
            />
            <small style={{ color: 'var(--admin-ink-2)' }}>
              Displayed under the photo on /gallery and used as the alt text.
            </small>
          </div>
        </div>
      </div>

      <aside className="admin-editor__sidebar">
        <div className="admin-card">
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--admin-ink-2)',
            }}
          >
            Publish
          </h3>
          {state.ok && !state.error && (
            <p className="admin-lede" style={{ color: '#166534' }}>
              Saved.
            </p>
          )}
          {state.error && <p className="admin-error">{state.error}</p>}
          {missing && (
            <p className="admin-lede" style={{ color: 'var(--admin-ink-2)' }}>
              Attach a photo before saving.
            </p>
          )}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--admin-ink-2)',
              marginBottom: 12,
            }}
          >
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Visible on /gallery
          </label>
          <div className="admin-actions">
            <button
              type="submit"
              className="admin-btn"
              disabled={pending || missing || !caption.trim()}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {pending ? 'Saving…' : 'Save photo'}
            </button>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-fielded">
            <label className="admin-label" htmlFor="sortOrder">
              Sort order
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              className="admin-input"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <small style={{ color: 'var(--admin-ink-2)' }}>
              Lower numbers show first. Ties break by newest first.
            </small>
          </div>
        </div>

        {initial.id && (
          <div className="admin-card">
            <h3
              style={{
                margin: '0 0 12px',
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#b91c1c',
              }}
            >
              Danger zone
            </h3>
            {/* No nested <form> here (invalid HTML — the browser drops
                the inner tag and the button would submit the SAVE
                action). The button overrides the outer form's action
                instead; the hidden `id` input above travels with it. */}
            <div>
              <button
                type="submit"
                formAction={deleteAction}
                formNoValidate
                className="admin-btn admin-btn--ghost"
                disabled={deletePending}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  color: '#b91c1c',
                }}
                onClick={(e) => {
                  if (!window.confirm('Delete this photo? This cannot be undone.')) {
                    e.preventDefault();
                  }
                }}
              >
                Delete photo
              </button>
            </div>
          </div>
        )}
      </aside>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        accept="image/*"
        onSelect={(url) => {
          setImage(url);
          setPickerOpen(false);
        }}
      />

      <ImageCropModal
        open={cropSrc !== null}
        src={cropSrc}
        initialAspect={16 / 10}
        onClose={() => setCropSrc(null)}
        onCropped={(nextUrl) => {
          setImage(nextUrl);
          setCropSrc(null);
        }}
      />
    </form>
  );
}
