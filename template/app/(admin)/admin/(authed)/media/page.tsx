import { listMedia } from '@/lib/media';
import MediaUploader from './MediaUploader';
import MediaRow from './MediaRow';

function formatBytes(size: string | null) {
  if (!size) return '';
  const n = Number(size);
  if (!Number.isFinite(n)) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(d: Date | string | null) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function AdminMediaPage() {
  const rows = await listMedia();

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">Media</h1>
          <p className="admin-lede">
            Images uploaded to Dokwe storage. Paste a URL from here
            into any block or post.
          </p>
        </div>
      </div>

      <MediaUploader />

      {rows.length === 0 ? (
        <div className="admin-card admin-empty" style={{ marginTop: 20 }}>
          <p>No uploads yet.</p>
        </div>
      ) : (
        <ul className="mediaGrid">
          {rows.map((row) => (
            <MediaRow
              key={row.id}
              id={row.id}
              url={row.url}
              filename={row.filename}
              size={formatBytes(row.size)}
              created={formatDate(row.createdAt)}
              contentType={row.contentType}
            />
          ))}
        </ul>
      )}
    </>
  );
}
