'use client';

import { useActionState, useState } from 'react';
import { deleteMedia, type MediaFormState } from '@/lib/media';

export default function MediaRow({
  id,
  url,
  filename,
  size,
  created,
  contentType,
}: {
  id: string;
  url: string;
  filename: string;
  size: string;
  created: string;
  contentType: string | null;
}) {
  const [, formAction, pending] = useActionState<MediaFormState, FormData>(
    deleteMedia,
    {},
  );
  const [copied, setCopied] = useState(false);

  const isImage = !!contentType?.startsWith('image/');

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <li className="mediaCard">
      <div className="mediaCard__thumb">
        {isImage ? (
          <img src={url} alt={filename} loading="lazy" />
        ) : (
          <div className="mediaCard__doc">{contentType?.split('/')[1] ?? 'file'}</div>
        )}
      </div>
      <div className="mediaCard__body">
        <p className="mediaCard__name" title={filename}>{filename}</p>
        <p className="mediaCard__meta">
          {size} · {created}
        </p>
        <div className="mediaCard__actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={copyUrl}
          >
            {copied ? 'Copied' : 'Copy URL'}
          </button>
          <form action={formAction}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="admin-btn admin-btn--danger"
              disabled={pending}
              onClick={(e) => {
                if (!confirm(`Delete "${filename}"?`)) e.preventDefault();
              }}
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}
