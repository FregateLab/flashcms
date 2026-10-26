'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCustomPage,
  type CustomPageCreateState,
} from '@/lib/pages';

export default function NewCustomPageButton() {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [slugDirty, setSlugDirty] = useState(false);
  const [state, setState] = useState<CustomPageCreateState>({});
  const [pending, setPending] = useState(false);
  const router = useRouter();

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugDirty) {
      setSlug(
        v
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, ''),
      );
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState({});
    const form = new FormData();
    form.set('slug', slug);
    form.set('title', title);
    const result = await createCustomPage({}, form);
    setState(result);
    setPending(false);
    if (result.ok && result.slug) {
      router.push(`/admin/pages/${result.slug}`);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="admin-btn"
        onClick={() => setOpen(true)}
        style={{ padding: '8px 16px', fontSize: 13 }}
      >
        New page…
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create a custom page"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) setOpen(false);
      }}
    >
      <div
        className="admin-card"
        style={{ maxWidth: 480, width: '100%', padding: 24 }}
      >
        <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>New page</h2>
        <p className="admin-lede" style={{ marginTop: 0 }}>
          Creates a wholly new CMS page. It renders at{' '}
          <code>/{slug || 'your-slug'}</code> via the catch-all frontend route
          once you publish it. Slug can&rsquo;t clash with a hard-coded
          route.
        </p>

        <form className="admin-form" onSubmit={onSubmit}>
          <div>
            <label className="admin-label" htmlFor="new-title">
              Title
            </label>
            <input
              id="new-title"
              className="admin-input"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="new-slug">
              Slug
            </label>
            <input
              id="new-slug"
              className="admin-input"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugDirty(true);
                setSlug(e.target.value);
              }}
              pattern="^[a-z0-9]+(?:[-/][a-z0-9]+)*$"
              required
            />
            <small style={{ color: 'var(--admin-ink-2)' }}>
              Lowercase letters, digits, hyphens. Optional slashes for nested
              URLs like <code>news/2026</code>.
            </small>
          </div>
          {state.error && <p className="admin-error">{state.error}</p>}
          <div
            style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}
          >
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn"
              disabled={pending || !title || !slug}
            >
              {pending ? 'Creating…' : 'Create page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
