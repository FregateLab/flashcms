'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { listMedia, uploadMedia } from '@/lib/media';

type MediaRow = Awaited<ReturnType<typeof listMedia>>[number];

/**
 * Reusable media picker modal. Opens with `open`, calls `onSelect(url)` when
 * the user picks a file, and `onClose()` when the modal is dismissed. Also
 * has an inline uploader that adds new files to the grid without leaving
 * the modal.
 */
export default function MediaPicker({
  open,
  onSelect,
  onClose,
  accept = 'image/*',
}: {
  open: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
  accept?: string;
}) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listMedia();
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    for (const f of Array.from(files)) fd.append('files', f);
    setUploadError(null);
    startUpload(async () => {
      const res = await uploadMedia({}, fd);
      if (res.error) {
        setUploadError(res.error);
        return;
      }
      await refresh();
    });
  }

  if (!open) return null;

  const filtered = query
    ? items.filter((m) =>
        m.filename.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  return (
    <div
      className="mediaPicker"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mediaPicker__panel" role="dialog" aria-modal="true">
        <header className="mediaPicker__head">
          <h3 style={{ margin: 0, fontSize: 18 }}>Media library</h3>
          <button
            type="button"
            className="mediaPicker__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="mediaPicker__toolbar">
          <input
            type="search"
            className="admin-input"
            placeholder="Search files…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={accept}
            style={{ display: 'none' }}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="admin-btn"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>

        {uploadError && (
          <p className="admin-error" style={{ margin: '8px 20px' }}>
            {uploadError}
          </p>
        )}

        <div className="mediaPicker__body">
          {loading ? (
            <p className="admin-lede" style={{ padding: 24 }}>
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <p className="admin-lede" style={{ padding: 24 }}>
              {items.length === 0
                ? 'No uploads yet. Click Upload to add your first file.'
                : 'No matches for that query.'}
            </p>
          ) : (
            <ul className="mediaPicker__grid">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="mediaPicker__item"
                    onClick={() => {
                      onSelect(m.url);
                      onClose();
                    }}
                  >
                    <div className="mediaPicker__thumb">
                      {m.contentType?.startsWith('image/') ? (
                        <img src={m.url} alt={m.filename} loading="lazy" />
                      ) : (
                        <div className="mediaCard__doc">
                          {m.contentType?.split('/')[1] ?? 'file'}
                        </div>
                      )}
                    </div>
                    <span
                      className="mediaPicker__name"
                      title={m.filename}
                    >
                      {m.filename}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
