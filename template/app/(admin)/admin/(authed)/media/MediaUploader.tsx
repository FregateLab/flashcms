'use client';

import { useActionState, useRef, useState } from 'react';
import { uploadMedia, type MediaFormState } from '@/lib/media';

export default function MediaUploader() {
  const [state, formAction, pending] = useActionState<MediaFormState, FormData>(
    uploadMedia,
    {},
  );
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function submitFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!inputRef.current || !formRef.current) return;
    const dt = new DataTransfer();
    for (const f of Array.from(files)) dt.items.add(f);
    inputRef.current.files = dt.files;
    formRef.current.requestSubmit();
  }

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
          <p style={{ margin: 0, fontWeight: 600 }}>
            {pending ? 'Uploading…' : 'Drop files here or'}
          </p>
          <small style={{ color: 'var(--admin-ink-2)' }}>
            Images or PDFs · up to 15 MB each
          </small>
        </div>
        <button
          type="button"
          className="admin-btn"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          Choose files
        </button>
      </div>

      {state.error && <p className="admin-error" style={{ marginTop: 10 }}>{state.error}</p>}
      {state.ok && !state.error && (
        <p className="admin-lede" style={{ color: '#166534', marginTop: 10 }}>
          Uploaded.
        </p>
      )}
    </form>
  );
}
