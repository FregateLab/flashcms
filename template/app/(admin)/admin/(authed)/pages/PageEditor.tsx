'use client';

import { Puck, type Data } from '@measured/puck';
import '@measured/puck/puck.css';
// Load the public site's stylesheet so Puck's iframe preview matches
// what visitors actually see. Puck copies parent-document stylesheets
// into its preview iframe automatically.
//
// Adjust this path to match where YOUR public-site stylesheet lives.
// Common layouts:
//   `@/app/globals.css`             (default flat layout)
//   `@/app/(frontend)/globals.css`  (route-group layout)
import '@/app/globals.css';
// Editor-only overrides — force reveal animations to their "revealed"
// state so blocks don't stay invisible in the preview.
import './puck-preview.css';
import { useActionState, useEffect, useRef, useState } from 'react';
import { savePage, type PageFormState, type PageSeo } from '@/lib/pages';
import { puckConfig } from '@/lib/puck-config';
import PageSwitcher from './PageSwitcher';
import SeoModal from './SeoModal';

type PageInitial = {
  slug: string;
  label: string;
  path: string;
  data?: unknown;
  isPublished?: boolean;
  seo?: PageSeo | null;
};

const emptyData: Data = { content: [], root: { props: {} } };

export default function PageEditor({
  initial,
  savedFlag,
}: {
  initial: PageInitial;
  savedFlag?: boolean;
}) {
  const [state, formAction, pending] = useActionState<PageFormState, FormData>(
    savePage,
    { ok: savedFlag },
  );

  const [data, setData] = useState<Data>((initial.data as Data) ?? emptyData);
  const [fullscreen, setFullscreen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const dataInputRef = useRef<HTMLInputElement>(null);

  function submit(action: 'draft' | 'publish') {
    if (dataInputRef.current) dataInputRef.current.value = JSON.stringify(data);
    const form = document.getElementById('page-editor-form') as HTMLFormElement | null;
    if (!form) return;
    const actionInput = form.elements.namedItem('action') as HTMLInputElement | null;
    if (actionInput) actionInput.value = action;
    form.requestSubmit();
  }

  // Lock body scroll while fullscreen; restore Escape as exit.
  useEffect(() => {
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFullscreen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  const actions = (
    <div className="admin-actions">
      <span
        className={`admin-pill ${
          initial.isPublished ? 'admin-pill--published' : 'admin-pill--draft'
        }`}
        style={{ alignSelf: 'center' }}
      >
        {initial.isPublished ? 'Published' : 'Draft'}
      </span>
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        onClick={() => setSeoOpen(true)}
        title="Edit SEO metadata"
      >
        SEO
      </button>
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        onClick={() => setFullscreen((f) => !f)}
        title={fullscreen ? 'Exit fullscreen (Esc)' : 'Expand editor to fullscreen'}
      >
        {fullscreen ? '↙ Exit fullscreen' : '⛶ Fullscreen'}
      </button>
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        disabled={pending}
        onClick={() => submit('draft')}
      >
        Save draft
      </button>
      <button
        type="button"
        className="admin-btn"
        disabled={pending}
        onClick={() => submit('publish')}
      >
        {initial.isPublished ? 'Update published' : 'Publish'}
      </button>
    </div>
  );

  return (
    <>
      <form
        id="page-editor-form"
        action={formAction}
        style={{ display: 'contents' }}
      >
        <input type="hidden" name="slug" value={initial.slug} />
        <input type="hidden" name="data" ref={dataInputRef} />
        <input type="hidden" name="action" defaultValue="draft" />
      </form>

      {/* Inline (normal) toolbar — hidden while fullscreen */}
      {!fullscreen && (
        <>
          <div className="admin-toolbar">
            <PageSwitcher
              currentSlug={initial.slug}
              currentLabel={initial.label}
            />
            {actions}
          </div>
          {state.ok && !state.error && (
            <p className="admin-lede" style={{ color: '#166534' }}>Saved.</p>
          )}
          {state.error && <p className="admin-error">{state.error}</p>}
        </>
      )}

      <div
        className={`admin-puck-wrap${fullscreen ? ' is-fullscreen' : ''}`}
      >
        {fullscreen && (
          <header className="admin-puck-topbar">
            <div className="admin-puck-topbar__meta">
              <span className="admin-brand__mark" aria-hidden="true">S</span>
              <div>
                <div className="admin-puck-topbar__title">{initial.label}</div>
                <div className="admin-puck-topbar__path">
                  <code>{initial.path}</code>
                </div>
              </div>
            </div>
            {actions}
          </header>
        )}
        <Puck
          config={puckConfig}
          data={data}
          onChange={(next) => setData(next)}
        />
      </div>

      <SeoModal
        open={seoOpen}
        onClose={() => setSeoOpen(false)}
        slug={initial.slug}
        pageLabel={initial.label}
        initial={initial.seo ?? null}
      />
    </>
  );
}
