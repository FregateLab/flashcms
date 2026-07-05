'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Row = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  excerpt: string | null;
  externalUrl: string | null;
  pressType: 'story' | 'release' | 'report';
  isFeatured: boolean;
  isPublished: boolean;
  updatedAt: string | null;
};

type Filter = 'all' | 'story' | 'release' | 'report';

function formatDate(iso: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function pressPill(type: Row['pressType']) {
  switch (type) {
    case 'release':
      return { label: 'Release', cls: 'admin-pill--info' };
    case 'report':
      return { label: 'Report', cls: 'admin-pill--accent' };
    default:
      return { label: 'Story', cls: 'admin-pill--neutral' };
  }
}

export default function PostsTable({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const c = { all: rows.length, story: 0, release: 0, report: 0 } as Record<Filter, number>;
    for (const r of rows) c[r.pressType]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== 'all' && r.pressType !== filter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.excerpt ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  const pill = (f: Filter, label: string) => (
    <button
      key={f}
      type="button"
      className="admin-filterPill"
      data-active={filter === f ? 'true' : undefined}
      onClick={() => setFilter(f)}
    >
      {label} <span style={{ opacity: 0.7 }}>· {counts[f]}</span>
    </button>
  );

  return (
    <>
      <div className="admin-filters">
        {pill('all', 'All')}
        {pill('story', 'Stories')}
        {pill('release', 'Releases')}
        {pill('report', 'Reports')}
        <input
          type="search"
          className="admin-search"
          placeholder="Search titles, slugs, excerpts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="admin-card admin-empty">
          <p>No posts match that filter.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Post</th>
              <th className="narrow">Type</th>
              <th className="narrow">Status</th>
              <th className="narrow">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const type = pressPill(row.pressType);
              const external = !!row.externalUrl;
              return (
                <tr key={row.id}>
                  <td>
                    <Link
                      href={`/admin/posts/${row.id}`}
                      className="tcell-primary"
                      style={{ color: 'inherit' }}
                    >
                      <span className="tcell-primary__thumb">
                        {row.coverImage ? (
                          <img
                            src={row.coverImage}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            style={{
                              fontSize: 14,
                              color: 'var(--admin-ink-3)',
                            }}
                          >
                            ▤
                          </span>
                        )}
                      </span>
                      <span className="tcell-primary__lines">
                        <span
                          className="tcell-primary__title"
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          {row.title}
                          {row.isFeatured && (
                            <span
                              className="admin-pill admin-pill--accent"
                              style={{ padding: '2px 8px' }}
                              title="Featured on /press"
                            >
                              Featured
                            </span>
                          )}
                        </span>
                        <span className="tcell-primary__sub">
                          <code>/{row.slug}</code>
                          {external && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span title={row.externalUrl ?? undefined}>
                                External ↗
                              </span>
                            </>
                          )}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="narrow">
                    <span className={`admin-pill ${type.cls}`}>{type.label}</span>
                  </td>
                  <td className="narrow">
                    {row.isPublished ? (
                      <span className="admin-pill admin-pill--published">
                        Published
                      </span>
                    ) : (
                      <span className="admin-pill admin-pill--draft">Draft</span>
                    )}
                  </td>
                  <td className="narrow tcell-date">
                    {formatDate(row.updatedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
