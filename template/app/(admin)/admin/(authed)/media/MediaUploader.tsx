'use client';

import { useActionState, useRef, useState, useTransition } from 'react';
import { uploadMedia, type MediaFormState } from '@/lib/media';
import {
  MAX_CLIENT_UPLOAD_BYTES,
  compressImage,
  humanizeUploadError,
  tooLargeMessage,
} from '@/components/compressImage';

export default function MediaUploader() {
  const [state, formAction, pending] = useActionState<MediaFormState, FormData>(
    uploadMedia,
    {},
  );
  const [dragging, setDragging] = useState(false);
  const [compressing, startCompression] = useTransition();
  const [clientError, setClientError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function submitFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!inputRef.current || !formRef.current) return;
    setClientError(null);
    const originals = Array.from(files);
    startCompression(async () => {
      try {
        // Auto-shrink each file, then abort with a friendly hint if
        // it's still over the server-action upload cap.
        const prepared: File[] = [];
        for (const f of originals) {
          const c = await compressImage(f);
          if (c.size > MAX_CLIENT_UPLOAD_BYTES) {
            setClientError(tooLargeMessage(f.name, c.size));
            return;
          }
          prepared.push(c);
        }
        const dt = new DataTransfer();
        for (const f of prepared) dt.items.add(f);
        if (!inputRef.current || !formRef.current) return;
        inputRef.current.files = dt.files;
        formRef.current.requestSubmit();
      } catch (err) {
        setClientError(humanizeUploadError(err, originals[0]?.name));
      }
    });
  }

  const busy = pending || compressing;
  const label = compressing
    ? 'Compressing…'
    : pending
      ? 'Uploading…'
      : 'Drop files here or';
  const errorMsg =
    clientError ??
    (state.error ? humanizeUploadError(state.error) : null);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`mediaUploader${dragging ? ' is-dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        submitFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        name="files"
        multiple
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => submitFiles(e.target.files)}
      />

      <div className="mediaUploader__inner">
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
          <small style={{ color: 'var(--admin-ink-2)' }}>
            Images or PDFs · large photos auto-compress before upload
            (limit {Math.round(MAX_CLIENT_UPLOAD_BYTES / 1024 / 1024)} MB). For very large files,
            use{' '}
            <a
              href="https://tinyjpg.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--admin-primary, #e31b22)' }}
            >
              tinyjpg.com
            </a>{' '}
            or{' '}
            <a
              href="https://tinypng.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--admin-primary, #e31b22)' }}
            >
              tinypng.com
            </a>{' '}
            first.
          </small>
        </div>
        <button
          type="button"
          className="admin-btn"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          Choose files
        </button>
      </div>

      {errorMsg && (
        <p className="admin-error" style={{ marginTop: 10 }}>
          {errorMsg}
        </p>
      )}
      {state.ok && !state.error && !clientError && (
        <p className="admin-lede" style={{ color: '#166534', marginTop: 10 }}>
          Uploaded.
        </p>
      )}
    </form>
  );
}
