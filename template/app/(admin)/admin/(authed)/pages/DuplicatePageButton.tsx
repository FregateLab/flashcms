'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { duplicatePage, type PageFormState } from '@/lib/pages';

type PageOption = {
  slug: string;
  label: string;
  hasContent: boolean;
};

type Props = {
  /** The target page — content gets copied INTO this slug. */
  targetSlug: string;
  targetLabel: string;
  /** Every other page on the site, so the admin can pick a source. */
  otherPages: PageOption[];
};

export default function DuplicatePageButton({
  targetSlug,
  targetLabel,
  otherPages,
}: Props) {
  const [open, setOpen] = useState(false);
  const [sourceSlug, setSourceSlug] = useState('');
  const [publish, setPublish] = useState(false);
  const [state, setState] = useState<PageFormState>({});
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const sources = otherPages.filter((p) => p.hasContent);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState({});
    const form = new FormData();
    form.set('sourceSlug', sourceSlug);
    form.set('targetSlug', targetSlug);
    form.set('publish', publish ? 'true' : 'false');
    const result = await duplicatePage({}, form);
    setState(result);
    setPending(false);
    if (result.ok) {
      // Send admin straight to the target editor with the copied content
      // loaded in — they can review and publish from there.
      router.push(`/admin/pages/${targetSlug}?duplicated=1`);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        style={{ padding: '5px 12px', fontSize: 12 }}
        onClick={() => setOpen(true)}
        title={`Copy another page's content into "${targetLabel}"`}
      >
        Duplicate from…
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Duplicate content into ${targetLabel}`}
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
        // Click on the backdrop closes; clicks inside the card don't.
        if (e.target === e.currentTarget && !pending) setOpen(false);
      }}
    >
      <div
        className="admin-card"
        style={{ maxWidth: 480, width: '100%', padding: 24 }}
      >
        <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>
          Duplicate into &ldquo;{targetLabel}&rdquo;
        </h2>
        <p className="admin-lede" style={{ marginTop: 0 }}>
          Copies the source page&rsquo;s design + content into this page&rsquo;s
          slot. Overwrites the current draft.
        </p>

        <form className="admin-form" onSubmit={onSubmit}>
          <div>
            <label className="admin-label" htmlFor="dup-source">
              Copy from
            </label>
            <select
              id="dup-source"
              className="admin-input"
              value={sourceSlug}
              onChange={(e) => setSourceSlug(e.target.value)}
              required
            >
              <option value="">Select a page…</option>
              {sources.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.label} ({p.slug})
                </option>
              ))}
            </select>
            {sources.length === 0 && (
              <small style={{ color: 'var(--admin-ink-2)' }}>
                No other pages have content yet.
              </small>
            )}
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--admin-ink-2)',
            }}
          >
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              disabled={pending}
            />
            Publish immediately (default: draft only)
          </label>

          {state.error && <p className="admin-error">{state.error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
              disabled={pending || !sourceSlug}
            >
              {pending ? 'Copying…' : 'Duplicate content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
