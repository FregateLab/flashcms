'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KNOWN_EDITABLE_PAGES } from '@/lib/known-routes';

type SectionName = 'Overview' | 'Content' | 'Countries' | 'Legal';
function sectionFor(slug: string): SectionName {
  if (slug === 'home') return 'Overview';
  if (slug.startsWith('countries')) return 'Countries';
  if (['privacy', 'terms', 'whistleblowing'].includes(slug)) return 'Legal';
  return 'Content';
}
const SECTION_ORDER: SectionName[] = ['Overview', 'Content', 'Countries', 'Legal'];

export default function PageSwitcher({
  currentSlug,
  currentLabel,
}: {
  currentSlug: string;
  currentLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    // Focus the search box when the dropdown opens for quick filtering.
    setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SECTION_ORDER.map((name) => ({
      name,
      rows: KNOWN_EDITABLE_PAGES.filter(
        (p) =>
          p.ready &&
          sectionFor(p.slug) === name &&
          (!q ||
            p.label.toLowerCase().includes(q) ||
            p.path.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q)),
      ),
    })).filter((g) => g.rows.length > 0);
  }, [query]);

  return (
    <div className="pageSwitcher" ref={wrapRef}>
      <div className="pageSwitcher__crumbs">
        <Link href="/admin/pages" className="pageSwitcher__back">
          ← All pages
        </Link>
      </div>
      <div className="pageSwitcher__row">
        <h1 className="pageSwitcher__title">{currentLabel}</h1>
        <button
          type="button"
          className="pageSwitcher__button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          title="Switch to another page"
        >
          <span>Switch page</span>
          <span
            className="pageSwitcher__chev"
            aria-hidden="true"
            style={{ transform: open ? 'rotate(180deg)' : undefined }}
          >
            ▾
          </span>
        </button>
      </div>

      {open && (
        <div className="pageSwitcher__menu" role="listbox">
          <div className="pageSwitcher__searchWrap">
            <input
              ref={searchRef}
              type="search"
              className="pageSwitcher__search"
              placeholder="Search pages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {grouped.length === 0 && (
            <div
              className="pageSwitcher__section"
              style={{ padding: '18px 12px 22px', textTransform: 'none', letterSpacing: 0, color: 'var(--admin-ink-3)' }}
            >
              No pages match “{query}”.
            </div>
          )}
          {grouped.map((g) => (
            <div key={g.name} className="pageSwitcher__group">
              <div className="pageSwitcher__section">{g.name}</div>
              {g.rows.map((p) => (
                <Link
                  key={p.slug}
                  href={`/admin/pages/${p.slug}`}
                  className={`pageSwitcher__item${
                    p.slug === currentSlug ? ' is-current' : ''
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <span>{p.label}</span>
                  <code>{p.path}</code>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
