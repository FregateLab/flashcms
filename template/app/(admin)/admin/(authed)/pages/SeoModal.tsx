'use client';

import { useActionState, useEffect, useState } from 'react';
import MediaPicker from '@/components/MediaPicker';
import { savePageSeo, type SeoFormState, type PageSeo } from '@/lib/pages';

export default function SeoModal({
  open,
  onClose,
  slug,
  pageLabel,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  pageLabel: string;
  initial: PageSeo | null;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [canonical, setCanonical] = useState(initial?.canonical ?? '');
  const [noindex, setNoindex] = useState(!!initial?.noindex);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [state, formAction, pending] = useActionState<SeoFormState, FormData>(
    savePageSeo,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(onClose, 800);
      return () => clearTimeout(t);
    }
  }, [state.ok, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const previewTitle =
    (title.trim() || pageLabel) + ' · Society for Family Health';

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
        style={{ maxWidth: 620 }}
      >
        <header className="mediaPicker__head">
          <h3 style={{ margin: 0, fontSize: 17 }}>SEO — {pageLabel}</h3>
          <button
            type="button"
            className="mediaPicker__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <form
          action={formAction}
          style={{
            padding: '18px 20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            overflow: 'auto',
          }}
        >
          <input type="hidden" name="slug" value={slug} />

          {/* Google-style preview */}
          <div
            style={{
              padding: '12px 14px',
              border: '1px solid var(--admin-border)',
              borderRadius: 10,
              background: '#fff',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--admin-ink-3)', marginBottom: 6 }}>
              Search preview
            </div>
            <div
              style={{
                color: '#0f7c67',
                fontSize: 12.5,
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              sfhgroup.org › {slug === 'home' ? '' : slug}
            </div>
            <div
              style={{
                color: '#1a0dab',
                fontSize: 17,
                fontWeight: 500,
                lineHeight: 1.25,
                marginBottom: 4,
              }}
            >
              {previewTitle}
            </div>
            <div style={{ color: '#4d5156', fontSize: 13.5, lineHeight: 1.45 }}>
              {description.trim() || (
                <em style={{ color: 'var(--admin-ink-3)' }}>
                  No meta description set. Google will pick text from the page.
                </em>
              )}
            </div>
          </div>

          <div className="admin-fielded">
            <label className="admin-label" htmlFor="seo-title">Meta title</label>
            <input
              id="seo-title"
              name="title"
              className="admin-input"
              placeholder={pageLabel}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <small style={{ color: 'var(--admin-ink-3)' }}>
              {title.length} / ~60 recommended. Leave blank to use “{pageLabel}”.
            </small>
          </div>

          <div className="admin-fielded">
            <label className="admin-label" htmlFor="seo-desc">
              Meta description
            </label>
            <textarea
              id="seo-desc"
              name="description"
              className="admin-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={400}
            />
            <small style={{ color: 'var(--admin-ink-3)' }}>
              {description.length} / ~155 recommended.
            </small>
          </div>

          <div className="admin-fielded">
            <label className="admin-label" htmlFor="seo-image">
              Social share image (Open Graph)
            </label>
            {image && (
              <img
                src={image}
                alt=""
                style={{
                  width: '100%',
                  maxHeight: 200,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border)',
                  marginBottom: 6,
                }}
              />
            )}
            <input
              type="hidden"
              name="image"
              value={image}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                id="seo-image"
                type="url"
                className="admin-input"
                value={image}
                placeholder="https://…"
                onChange={(e) => setImage(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => setPickerOpen(true)}
              >
                Browse
              </button>
              {image && (
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setImage('')}
                >
                  Clear
                </button>
              )}
            </div>
            <small style={{ color: 'var(--admin-ink-3)' }}>
              Recommended 1200 × 630. Falls back to the page hero if blank.
            </small>
          </div>

          <div className="admin-fielded">
            <label className="admin-label" htmlFor="seo-canonical">
              Canonical URL (optional)
            </label>
            <input
              id="seo-canonical"
              name="canonical"
              type="url"
              className="admin-input"
              value={canonical}
              placeholder="https://sfhgroup.org/…"
              onChange={(e) => setCanonical(e.target.value)}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--admin-ink-2)',
            }}
          >
            <input
              type="checkbox"
              name="noindex"
              value="true"
              checked={noindex}
              onChange={(e) => setNoindex(e.target.checked)}
            />
            Hide this page from search engines (noindex, nofollow)
          </label>

          {state.error && <p className="admin-error">{state.error}</p>}
          {state.ok && (
            <p className="admin-lede" style={{ color: '#166534', margin: 0 }}>
              Saved.
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              marginTop: 4,
            }}
          >
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={onClose}
            >
              Close
            </button>
            <button type="submit" className="admin-btn" disabled={pending}>
              {pending ? 'Saving…' : 'Save SEO'}
            </button>
          </div>
        </form>
      </div>

      <MediaPicker
        open={pickerOpen}
        onSelect={(url) => setImage(url)}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
