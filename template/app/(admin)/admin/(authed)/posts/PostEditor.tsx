'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { ResizableImage } from '@/lib/tiptap-extensions';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import {
  savePost,
  saveDraftForPreview,
  type PostFormState,
  type PostPreviewState,
} from '@/lib/posts';
import MediaPicker from '@/components/MediaPicker';
import ImageCropModal from '@/components/ImageCropModal';

type PostInitial = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  coverImage?: string | null;
  body?: unknown;
  isPublished?: boolean;
  externalUrl?: string | null;
  pressType?: 'story' | 'release' | 'report' | 'factsheet';
  isFeatured?: boolean;
  categoryId?: string | null;
};

type CategoryOption = { id: string; name: string };

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
  const btn = (opts: {
    active?: boolean;
    label: string;
    onClick: () => void;
    title?: string;
    className?: string;
  }) => (
    <button
      type="button"
      className={[opts.className, opts.active ? 'is-active' : '']
        .filter(Boolean)
        .join(' ')}
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
        label: '＋ Insert image',
        title: 'Insert an image between paragraphs',
        onClick: onOpenMediaPicker,
        className: 'admin-tiptap-menu__cta',
      })}
      {btn({
        label: 'HR',
        onClick: () => editor.chain().focus().setHorizontalRule().run(),
      })}
    </div>
  );
}

export default function PostEditor({
  initial,
  savedFlag,
  categories = [],
}: {
  initial: PostInitial;
  savedFlag?: boolean;
  categories?: CategoryOption[];
}) {
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(
    savePost,
    { ok: savedFlag },
  );
  const [previewState, previewAction, previewPending] = useActionState<
    PostPreviewState,
    FormData
  >(saveDraftForPreview, {});

  // Open the preview in a new tab as soon as the server action returns
  // a slug. The nonce guards against React skipping the effect when the
  // same slug is requested twice in a row.
  useEffect(() => {
    if (previewState.ok && previewState.slug) {
      window.open(`/blog/${previewState.slug}/preview`, '_blank', 'noopener');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewState.nonce]);

  const [title, setTitle] = useState(initial.title ?? '');
  const [slug, setSlug] = useState(initial.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? '');
  const [coverImage, setCoverImage] = useState(initial.coverImage ?? '');
  const [externalUrl, setExternalUrl] = useState(initial.externalUrl ?? '');
  const [pressType, setPressType] = useState<'story' | 'release' | 'report' | 'factsheet'>(
    initial.pressType ?? 'story',
  );
  const [isFeatured, setIsFeatured] = useState(!!initial.isFeatured);
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? '');
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [mediaPickerFor, setMediaPickerFor] = useState<
    'body' | 'body-replace' | 'cover' | null
  >(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
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
      ResizableImage,
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

  // A brand-new post gets its row created by the first Preview click;
  // carry that id into later saves so Save/Publish update the same row
  // instead of inserting a duplicate.
  const postId = initial.id ?? previewState.id;

  return (
    <form id="post-editor-form" action={formAction} className="admin-editor">
      {postId && <input type="hidden" name="id" value={postId} />}
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
          {editor && (
            <BubbleMenu
              editor={editor}
              shouldShow={({ editor }) => editor.isActive('image')}
            >
              <div className="admin-tiptap-bubble" role="toolbar" aria-label="Image controls">
                <span className="admin-tiptap-bubble__label">Size</span>
                {(['small', 'medium', 'full'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={
                      editor.getAttributes('image').width === size ||
                      (size === 'full' && !editor.getAttributes('image').width)
                        ? 'is-active'
                        : ''
                    }
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes('image', {
                          width: size === 'full' ? null : size,
                        })
                        .run()
                    }
                  >
                    {size[0].toUpperCase() + size.slice(1)}
                  </button>
                ))}
                <span className="admin-tiptap-bubble__sep" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setMediaPickerFor('body-replace')}
                >
                  Replace
                </button>
                <button
                  type="button"
                  className="admin-tiptap-bubble__danger"
                  onClick={() =>
                    editor.chain().focus().deleteSelection().run()
                  }
                >
                  Remove
                </button>
              </div>
            </BubbleMenu>
          )}
          <EditorContent editor={editor} />
          <p
            style={{
              margin: '8px 4px 0',
              fontSize: 12,
              color: 'var(--admin-ink-2)',
            }}
          >
            Tip: place your cursor between paragraphs and click{' '}
            <strong>＋ Insert image</strong> to add a picture inline.
          </p>
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
          {previewState.error && (
            <p className="admin-error">{previewState.error}</p>
          )}
          <div className="admin-actions">
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={pending || previewPending}
              onClick={() => submit('draft')}
            >
              Save draft
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn--ghost"
              formAction={previewAction}
              disabled={pending || previewPending}
              onClick={() => {
                if (!editor || !bodyInputRef.current) return;
                bodyInputRef.current.value = JSON.stringify(editor.getJSON());
              }}
              title="Save a draft and open in a new tab"
            >
              {previewPending ? 'Preparing…' : 'Preview'}
            </button>
            <button
              type="button"
              className="admin-btn"
              disabled={pending || previewPending}
              onClick={() => submit('publish')}
            >
              {initial.isPublished ? 'Update published' : 'Publish'}
            </button>
          </div>
          <small
            style={{
              display: 'block',
              marginTop: 8,
              color: 'var(--admin-ink-2)',
              fontSize: 12,
            }}
          >
            Preview saves a draft and opens the article in a new tab so
            you can see it exactly as readers will.
          </small>
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
                <>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => setCropSrc(coverImage)}
                  >
                    Crop
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => setCoverImage('')}
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
            <small
              style={{ color: 'var(--admin-ink-2)', display: 'block', marginTop: 6 }}
            >
              The detail-page hero renders at a wide banner ratio.
              {' '}
              <strong>Crop</strong> lets you preview the visible area and save
              a new copy without touching the original.
            </small>
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
            Category
          </h3>
          <div className="admin-fielded">
            <label className="admin-label" htmlFor="categoryId">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="admin-input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— Uncategorised —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <small style={{ color: 'var(--admin-ink-2)' }}>
                No categories yet — create some at{' '}
                <a href="/admin/categories" style={{ color: 'var(--admin-primary)' }}>
                  /admin/categories
                </a>
                .
              </small>
            )}
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
              <option value="factsheet">Factsheet</option>
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
        accept="image/*"
        onSelect={(url) => {
          if (mediaPickerFor === 'body') {
            const alt = (
              window.prompt(
                'Alt text (short description for screen readers + SEO):',
                '',
              ) ?? ''
            ).trim();
            editor
              ?.chain()
              .focus()
              .setImage({ src: url, alt: alt || undefined })
              .run();
          } else if (mediaPickerFor === 'body-replace') {
            // Swap the src of the currently selected image, keep its
            // width + alt so replacement is a one-click operation.
            editor
              ?.chain()
              .focus()
              .updateAttributes('image', { src: url })
              .run();
          } else if (mediaPickerFor === 'cover') {
            setCoverImage(url);
          }
          setMediaPickerFor(null);
        }}
      />

      <ImageCropModal
        open={cropSrc !== null}
        src={cropSrc}
        initialAspect={21 / 9}
        onClose={() => setCropSrc(null)}
        onCropped={(nextUrl) => {
          setCoverImage(nextUrl);
          setCropSrc(null);
        }}
      />
    </form>
  );
}
