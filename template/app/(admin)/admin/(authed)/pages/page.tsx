import React from 'react';
import Link from 'next/link';
import {
  KNOWN_EDITABLE_PAGES,
  knownSectionOrder,
} from '@/lib/known-routes';
import { listPagesFromDb } from '@/lib/pages';
import DuplicatePageButton from './DuplicatePageButton';
import NewCustomPageButton from './NewCustomPageButton';

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

export default async function AdminPagesListPage() {
  const dbRows = await listPagesFromDb();
  const bySlug = new Map(dbRows.map((r) => [r.slug, r] as const));
  const knownSlugs = new Set<string>(KNOWN_EDITABLE_PAGES.map((p) => p.slug));

  // Custom pages = DB rows whose slug isn't in KNOWN_EDITABLE_PAGES.
  // Sorted alphabetically for stable rendering.
  const customRows = dbRows
    .filter((r) => !knownSlugs.has(r.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  // Precompute the list of ready pages that have content — used as
  // source-page options in every row's Duplicate modal. Custom pages
  // with published content also qualify as duplicate sources.
  const knownSourceOptions = KNOWN_EDITABLE_PAGES.filter((p) => p.ready).map(
    (p) => ({
      slug: p.slug,
      label: p.label,
      hasContent: !!bySlug.get(p.slug)?.published,
    }),
  );
  const customSourceOptions = customRows
    .filter((r) => !!r.published)
    .map((r) => ({
      slug: r.slug,
      label: r.title,
      hasContent: true,
    }));
  const otherPageOptions = [...knownSourceOptions, ...customSourceOptions];

  const readyCount = KNOWN_EDITABLE_PAGES.filter((p) => p.ready).length;
  const publishedCount = KNOWN_EDITABLE_PAGES.filter(
    (p) => bySlug.get(p.slug)?.published,
  ).length;

  // Section grouping is derived from the KNOWN_EDITABLE_PAGES data, so
  // each project can rearrange its own routes without editing this file.
  const grouped = knownSectionOrder()
    .map((name) => ({
      name,
      rows: KNOWN_EDITABLE_PAGES.filter((p) => p.section === name),
    }))
    .filter((g) => g.rows.length > 0);

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">Pages</h1>
          <p className="admin-lede">
            {publishedCount} of {readyCount} hard-coded pages published ·{' '}
            {KNOWN_EDITABLE_PAGES.length} routes tracked
            {customRows.length > 0 && (
              <> · {customRows.length} custom</>
            )}
            .
          </p>
        </div>
        <NewCustomPageButton />
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
                          {p.icon}
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
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <DuplicatePageButton
                            targetSlug={p.slug}
                            targetLabel={p.label}
                            otherPages={otherPageOptions.filter(
                              (o) => o.slug !== p.slug,
                            )}
                          />
                          <Link
                            className="admin-btn admin-btn--ghost"
                            href={`/admin/pages/${p.slug}`}
                            style={{ padding: '5px 12px', fontSize: 12 }}
                          >
                            Edit
                          </Link>
                        </div>
                      ) : (
                        <span className="tcell-mute">Soon</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
          {customRows.length > 0 && (
            <>
              <tr className="admin-table__group">
                <th colSpan={4}>Custom</th>
              </tr>
              {customRows.map((r) => (
                <tr key={r.slug}>
                  <td>
                    <div className="tcell-primary">
                      <span className="tcell-primary__icon" aria-hidden="true">
                        ✎
                      </span>
                      <span className="tcell-primary__lines">
                        <span className="tcell-primary__title">{r.title}</span>
                        <span className="tcell-primary__sub">
                          <code>/{r.slug}</code>
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="narrow">
                    {r.published ? (
                      <span className="admin-pill admin-pill--published">
                        Published
                      </span>
                    ) : (
                      <span className="admin-pill admin-pill--draft">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="narrow tcell-date">
                    {formatDate(r.updatedAt)}
                  </td>
                  <td className="narrow right">
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <DuplicatePageButton
                        targetSlug={r.slug}
                        targetLabel={r.title}
                        otherPages={otherPageOptions.filter(
                          (o) => o.slug !== r.slug,
                        )}
                      />
                      <Link
                        className="admin-btn admin-btn--ghost"
                        href={`/admin/pages/${r.slug}`}
                        style={{ padding: '5px 12px', fontSize: 12 }}
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </>
  );
}
