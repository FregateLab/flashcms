'use client';

import { useEffect, useRef, useState } from 'react';

type Hit = {
  type: 'page' | 'post';
  title: string;
  excerpt: string;
  url: string;
  category?: string;
};

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Autofocus + reset on open
  useEffect(() => {
    if (open) {
      setQ('');
      setHits([]);
      setActiveIdx(0);
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced fetch
  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error('search failed');
        const json = (await res.json()) as { hits: Hit[] };
        setHits(json.hits ?? []);
        setActiveIdx(0);
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          setHits([]);
        }
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  // Escape / arrow keys
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, hits.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const h = hits[activeIdx];
        if (h) {
          window.location.href = h.url;
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hits, activeIdx, onClose]);

  // Lock scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const pageHits = hits.filter((h) => h.type === 'page');
  const postHits = hits.filter((h) => h.type === 'post');

  return (
    <div
      className="ng-search"
      role="dialog"
      aria-modal="true"
      aria-label="Site search"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ng-search__panel">
        <div className="ng-search__inputRow">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            width={20}
            height={20}
            aria-hidden="true"
            className="ng-search__icon"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            className="ng-search__input"
            type="search"
            placeholder="Search pages, posts, reports…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search"
            autoComplete="off"
          />
          <button
            type="button"
            className="ng-search__close"
            onClick={onClose}
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        <div className="ng-search__body">
          {loading ? (
            <p className="ng-search__hint">Searching…</p>
          ) : q.trim().length < 2 ? (
            <p className="ng-search__hint">Type at least 2 characters to search.</p>
          ) : hits.length === 0 ? (
            <p className="ng-search__hint">
              No matches for <strong>“{q}”</strong>.
            </p>
          ) : (
            <>
              {pageHits.length ? (
                <>
                  <h3 className="ng-search__group">Pages</h3>
                  <ul className="ng-search__results">
                    {pageHits.map((h) => (
                      <Result
                        key={`p-${h.url}`}
                        hit={h}
                        active={hits[activeIdx]?.url === h.url}
                        onHover={() =>
                          setActiveIdx(hits.findIndex((x) => x.url === h.url))
                        }
                      />
                    ))}
                  </ul>
                </>
              ) : null}
              {postHits.length ? (
                <>
                  <h3 className="ng-search__group">Posts &amp; reports</h3>
                  <ul className="ng-search__results">
                    {postHits.map((h) => (
                      <Result
                        key={`o-${h.url}`}
                        hit={h}
                        active={hits[activeIdx]?.url === h.url}
                        onHover={() =>
                          setActiveIdx(hits.findIndex((x) => x.url === h.url))
                        }
                      />
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}
        </div>

        <footer className="ng-search__footer">
          <span>
            <kbd>↑ ↓</kbd> navigate
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </footer>
      </div>
    </div>
  );
}

function Result({
  hit,
  active,
  onHover,
}: {
  hit: Hit;
  active: boolean;
  onHover: () => void;
}) {
  return (
    <li className="ng-search__result" data-active={active ? 'true' : undefined}>
      <a
        href={hit.url}
        className="ng-search__resultLink"
        onMouseEnter={onHover}
      >
        <div className="ng-search__resultMeta">
          {hit.category ? (
            <span className="ng-search__resultCat">{hit.category}</span>
          ) : null}
        </div>
        <div className="ng-search__resultTitle">{hit.title}</div>
        {hit.excerpt ? (
          <div className="ng-search__resultExcerpt">{hit.excerpt}</div>
        ) : null}
      </a>
    </li>
  );
}
