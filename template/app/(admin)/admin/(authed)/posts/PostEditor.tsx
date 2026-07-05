'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { savePost, type PostFormState } from '@/lib/posts';
import MediaPicker from '@/components/MediaPicker';

type PostInitial = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  coverImage?: string | null;
  body?: unknown;
  isPublished?: boolean;
  externalUrl?: string | null;
  pressType?: 'story' | 'release' | 'report';
  isFeatured?: boolean;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function Toolbar({
  editor,
  onOpenMediaPicker,
}: {
  editor: Editor | null;
  onOpenMediaPicker: () => void;
}) {
  if (!editor) return null;
  const btn = (opts: { active?: boolean; label: string; onClick: () => void; title?: string }) => (
    <button
      type="button"
      className={opts.active ? 'is-active' : ''}
      onClick={opts.onClick}
      title={opts.title ?? opts.label}
    >
      {opts.label}
    </button>
  );
  return (
    <div className="admin-tiptap-menu">
      {btn({
        label: 'H2',
        active: editor.isActive('heading', { level: 2 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      })}
      {btn({
        label: 'H3',
        active: editor.isActive('heading', { level: 3 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      })}
      {btn({
        label: 'Bold',
        active: editor.isActive('bold'),
        onClick: () => editor.chain().focus().toggleBold().run(),
      })}
      {btn({
        label: 'Italic',
        active: editor.isActive('italic'),
        onClick: () => editor.chain().focus().toggleItalic().run(),
      })}
      {btn({
        label: 'Quote',
        active: editor.isActive('blockquote'),
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
      })}
      {btn({
        label: 'UL',
        active: editor.isActive('bulletList'),
        onClick: () => editor.chain().focus().toggleBulletList().run(),
      })}
      {btn({
        label: 'OL',
        active: editor.isActive('orderedList'),
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
      })}
      {btn({
        label: 'Link',
        active: editor.isActive('link'),
        onClick: () => {
          const href = window.prompt('URL');
          if (!href) return;
          editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
        },
      })}
      {btn({
        label: 'Image',
        onClick: onOpenMediaPicker,
      })}
      {btn({
        label: 'HR',
        onClick: () => editor.chain().focus().setHorizontalRule().run(),
      })}
    </div>
  );
}

export default function PostEditor({ initial, savedFlag }: { initial: PostInitial; savedFlag?: boolean }) {
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(
    savePost,
    { ok: savedFlag },
  );

  const [title, setTitle] = useState(initial.title ?? '');
  const [slug, setSlug] = useState(initial.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? '');
  const [coverImage, setCoverImage] = useState(initial.coverImage ?? '');
  const [externalUrl, setExternalUrl] = useState(initial.externalUrl ?? '');
  const [pressType, setPressType] = useState<'story' | 'release' | 'report'>(
    initial.pressType ?? 'story',
  );
  const [isFeatured, setIsFeatured] = useState(!!initial.isFeatured);
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [mediaPickerFor, setMediaPickerFor] = useState<
    'body' | 'cover' | null
  >(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  const initialContent = useMemo(() => {
    return (
      initial.body ?? {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      }
    );
  }, [initial.body]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: initialContent as Record<string, unknown>,
    immediatelyRender: false,
  });

  // Auto-slug from title until the user edits the slug themselves.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  function submit(action: 'draft' | 'publish') {
    if (!editor) return;
    const body = JSON.stringify(editor.getJSON());
    if (bodyInputRef.current) bodyInputRef.current.value = body;

    // populate a hidden field so the form action receives it
    const form = document.getElementById('post-editor-form') as HTMLFormElement | null;
    if (!form) return;
    const actionInput = form.elements.namedItem('action') as HTMLInputElement | null;
    if (actionInput) actionInput.value = action;
    form.requestSubmit();
  }

  return (
    <form id="post-editor-form" action={formAction} className="admin-editor">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="body" ref={bodyInputRef} />
      <input type="hidden" name="action" defaultValue="draft" />

      <div className="admin-editor__main">
        <input
          className="admin-title-input"
          type="text"
          name="title"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="admin-tiptap">
          <Toolbar
            editor={editor}
            onOpenMediaPicker={() => setMediaPickerFor('body')}
          />
          <EditorContent editor={editor} />
        </div>
      </div>

      <aside className="admin-editor__sidebar">
        <div className="admin-card">
          <h3 style={{ margin: '0 0 12px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--admin-ink-2)' }}>
            Publish
          </h3>
          {state.ok && !state.error && (
            <p className="admin-lede" style={{ color: '#166534' }}>Saved.</p>
          )}
          {state.error && <p className="admin-error">{state.error}</p>}
          <div className="admin-actions">
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
        </div>

        <div className="admin-card">
          <div className="admin-fielded">
            <label className="admin-label" htmlFor="slug">Slug</label>
            <input
              id="slug"
              name="slug"
              className="admin-input"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
            />
            <small style={{ color: 'var(--admin-ink-2)' }}>Public URL: /blog/{slug || '…'}</small>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-fielded">
            <label className="admin-label" htmlFor="excerpt">Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              className="admin-input"
              rows={4}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-fielded">
            <label className="admin-label" htmlFor="coverImage">Cover image</label>
            {coverImage && (
              <img
                src={coverImage}
                alt=""
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border)',
                  marginBottom: 6,
                }}
              />
            )}
            <input
              id="coverImage"
              name="coverImage"
              className="admin-input"
              type="url"
              placeholder="https://…"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => setMediaPickerFor('cover')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Browse media
              </button>
              {coverImage && (
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setCoverImage('')}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--admin-ink-2)',
            }}
          >
            Press room
          </h3>

          <div className="admin-fielded" style={{ marginBottom: 12 }}>
            <label className="admin-label" htmlFor="pressType">Type</label>
            <select
              id="pressType"
              name="pressType"
              className="admin-input"
              value={pressType}
              onChange={(e) => setPressType(e.target.value as typeof pressType)}
            >
              <option value="story">Story</option>
              <option value="release">Release</option>
              <option value="report">Report</option>
            </select>
          </div>

          <div className="admin-fielded" style={{ marginBottom: 12 }}>
            <label className="admin-label" htmlFor="externalUrl">External URL (optional)</label>
            <input
              id="externalUrl"
              name="externalUrl"
              className="admin-input"
              type="url"
              placeholder="https://linkedin.com/…"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
            />
            <small style={{ color: 'var(--admin-ink-2)' }}>
              If set, cards link here instead of /blog/{slug || '…'}.
            </small>
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
              name="isFeatured"
              value="true"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Featured on /press
          </label>
        </div>
      </aside>

      <MediaPicker
        open={mediaPickerFor !== null}
        onClose={() => setMediaPickerFor(null)}
        onSelect={(url) => {
          if (mediaPickerFor === 'body') {
            editor?.chain().focus().setImage({ src: url }).run();
          } else if (mediaPickerFor === 'cover') {
            setCoverImage(url);
          }
          setMediaPickerFor(null);
        }}
      />
    </form>
  );
}
