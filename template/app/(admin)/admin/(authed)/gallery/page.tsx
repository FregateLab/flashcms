import Link from 'next/link';
import { listGalleryPhotos } from '@/lib/gallery';

export default async function AdminGalleryListPage() {
  const rows = await listGalleryPhotos();

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">Photo gallery</h1>
          <p className="admin-lede">
            Images shown on the public
            <code style={{ marginLeft: 6, marginRight: 6 }}>/gallery</code>
            page. Sort order drives the grid; unpublished photos are hidden
            without deleting them.
          </p>
        </div>
        <Link href="/admin/gallery/new" className="admin-btn">
          Add photo
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="admin-card admin-empty">
          <p>No photos yet.</p>
          <Link href="/admin/gallery/new" className="admin-btn">
            Add the first photo
          </Link>
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          }}
        >
          {rows.map((r) => (
            <li key={r.id} className="admin-card" style={{ padding: 12 }}>
              <Link
                href={`/admin/gallery/${r.id}`}
                style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
              >
                <div
                  style={{
                    aspectRatio: '16/10',
                    background: 'var(--admin-surface-2, #f3f4f6)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 10,
                  }}
                >
                  <img
                    src={r.image}
                    alt={r.caption}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 4,
                    fontSize: 12,
                    color: 'var(--admin-ink-2)',
                  }}
                >
                  <span>#{r.sortOrder}</span>
                  {r.isPublished ? (
                    <span className="admin-pill admin-pill--published">
                      Published
                    </span>
                  ) : (
                    <span className="admin-pill admin-pill--draft">Hidden</span>
                  )}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.4,
                    color: 'var(--admin-ink)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {r.caption}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
