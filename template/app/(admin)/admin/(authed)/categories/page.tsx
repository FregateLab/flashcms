import { listCategories } from '@/lib/categories';
import CategoryEditor from './CategoryEditor';
import CategoryRow from './CategoryRow';

function formatDate(d: Date | string | null | undefined) {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function AdminCategoriesPage() {
  const rows = await listCategories();

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">Categories</h1>
          <p className="admin-lede">
            Site-owned taxonomy for posts. Assign a category when editing a
            post; readers filter by category on <code>/blog?category=…</code>.{' '}
            <strong>{rows.length}</strong> total.
          </p>
        </div>
      </div>

      {/* Inline "new category" form — no modal, no separate route. */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <span className="admin-card__eyebrow">New category</span>
        <CategoryEditor mode="create" />
      </div>

      {rows.length === 0 ? (
        <p className="admin-lede" style={{ marginTop: 24 }}>
          No categories yet. Create the first one above.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th className="narrow">Slug</th>
              <th className="narrow">Sort</th>
              <th className="narrow">Created</th>
              <th className="narrow right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <CategoryRow
                key={row.id}
                category={{
                  id: row.id,
                  slug: row.slug,
                  name: row.name,
                  description: row.description,
                  sortOrder: row.sortOrder,
                  createdAtLabel: formatDate(row.createdAt),
                }}
              />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
