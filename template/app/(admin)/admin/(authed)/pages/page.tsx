import React from 'react';
import Link from 'next/link';
import { KNOWN_EDITABLE_PAGES } from '@/lib/known-routes';
import { listPagesFromDb } from '@/lib/pages';

function formatDate(d: Date | string | null) {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

type SectionName = 'Overview' | 'Content' | 'Countries' | 'Legal';
const SECTION_ORDER: SectionName[] = ['Overview', 'Content', 'Countries', 'Legal'];

function sectionFor(slug: string): SectionName {
  if (slug === 'home') return 'Overview';
  if (slug.startsWith('countries')) return 'Countries';
  if (['privacy', 'terms', 'whistleblowing'].includes(slug)) return 'Legal';
  return 'Content';
}

function pageIcon(slug: string) {
  if (slug === 'home') return '⌂';
  if (slug.startsWith('countries')) return '⬢';
  if (['privacy', 'terms', 'whistleblowing'].includes(slug)) return '§';
  return '❖';
}

export default async function AdminPagesListPage() {
  const dbRows = await listPagesFromDb();
  const bySlug = new Map(dbRows.map((r) => [r.slug, r] as const));

  const readyCount = KNOWN_EDITABLE_PAGES.filter((p) => p.ready).length;
  const publishedCount = KNOWN_EDITABLE_PAGES.filter(
    (p) => bySlug.get(p.slug)?.published,
  ).length;

  const grouped = SECTION_ORDER.map((name) => ({
    name,
    rows: KNOWN_EDITABLE_PAGES.filter((p) => sectionFor(p.slug) === name),
  })).filter((g) => g.rows.length > 0);

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">Pages</h1>
          <p className="admin-lede">
            {publishedCount} of {readyCount} pages published ·{' '}
            {KNOWN_EDITABLE_PAGES.length} routes tracked.
          </p>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Page</th>
            <th className="narrow">Status</th>
            <th className="narrow">Updated</th>
            <th className="narrow right"></th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((g) => (
            <React.Fragment key={g.name}>
              <tr className="admin-table__group">
                <th colSpan={4}>{g.name}</th>
              </tr>
              {g.rows.map((p) => {
                const row = bySlug.get(p.slug);
                return (
                  <tr key={p.slug}>
                    <td>
                      <div className="tcell-primary">
                        <span
                          className="tcell-primary__icon"
                          aria-hidden="true"
                        >
                          {pageIcon(p.slug)}
                        </span>
                        <span className="tcell-primary__lines">
                          <span className="tcell-primary__title">
                            {p.label}
                          </span>
                          <span className="tcell-primary__sub">
                            <code>{p.path}</code>
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="narrow">
                      {row?.published ? (
                        <span className="admin-pill admin-pill--published">
                          Published
                        </span>
                      ) : row ? (
                        <span className="admin-pill admin-pill--draft">
                          Draft
                        </span>
                      ) : p.ready ? (
                        <span className="admin-pill admin-pill--neutral">
                          Not started
                        </span>
                      ) : (
                        <span className="admin-pill admin-pill--info">
                          Blocks pending
                        </span>
                      )}
                    </td>
                    <td className="narrow tcell-date">
                      {formatDate(row?.updatedAt ?? null)}
                    </td>
                    <td className="narrow right">
                      {p.ready ? (
                        <Link
                          className="admin-btn admin-btn--ghost"
                          href={`/admin/pages/${p.slug}`}
                          style={{ padding: '5px 12px', fontSize: 12 }}
                        >
                          Edit
                        </Link>
                      ) : (
                        <span className="tcell-mute">Soon</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}
