'use client';

import { useState } from 'react';
import {
  createCategory,
  updateCategory,
  type CategoryFormState,
} from '@/lib/categories';

type EditableCategory = {
  id?: string;
  slug?: string;
  name?: string;
  description?: string | null;
  sortOrder?: number;
};

type Props = {
  mode: 'create' | 'edit';
  category?: EditableCategory;
  /** Called on successful save/update. Editor row uses this to collapse. */
  onDone?: () => void;
};

export default function CategoryEditor({ mode, category, onDone }: Props) {
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [state, setState] = useState<CategoryFormState>({});
  const [pending, setPending] = useState(false);

  // Auto-generate slug from name on create until admin edits it directly.
  const [slugDirty, setSlugDirty] = useState(mode === 'edit');
  function onNameChange(v: string) {
    setName(v);
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
    if (mode === 'edit' && category?.id) form.set('id', category.id);
    form.set('name', name);
    form.set('slug', slug);
    form.set('description', description);
    form.set('sortOrder', sortOrder);
    const result =
      mode === 'edit'
        ? await updateCategory({}, form)
        : await createCategory({}, form);
    setState(result);
    setPending(false);
    if (result.ok) {
      if (mode === 'create') {
        // Clear the create form so admins can add another quickly.
        setName('');
        setSlug('');
        setDescription('');
        setSortOrder('0');
        setSlugDirty(false);
      }
      onDone?.();
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 2fr 1fr',
          gap: 12,
          alignItems: 'end',
        }}
      >
        <div>
          <label className="admin-label" htmlFor={`cat-name-${category?.id ?? 'new'}`}>
            Name
          </label>
          <input
            id={`cat-name-${category?.id ?? 'new'}`}
            className="admin-input"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="admin-label" htmlFor={`cat-slug-${category?.id ?? 'new'}`}>
            Slug
          </label>
          <input
            id={`cat-slug-${category?.id ?? 'new'}`}
            className="admin-input"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlugDirty(true);
              setSlug(e.target.value);
            }}
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            required
          />
        </div>
        <div>
          <label className="admin-label" htmlFor={`cat-sort-${category?.id ?? 'new'}`}>
            Sort
          </label>
          <input
            id={`cat-sort-${category?.id ?? 'new'}`}
            className="admin-input"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ maxWidth: 100 }}
          />
        </div>
      </div>
      <div>
        <label className="admin-label" htmlFor={`cat-desc-${category?.id ?? 'new'}`}>
          Description (optional)
        </label>
        <textarea
          id={`cat-desc-${category?.id ?? 'new'}`}
          className="admin-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      {state.error && <p className="admin-error">{state.error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="admin-btn" type="submit" disabled={pending}>
          {pending
            ? 'Saving…'
            : mode === 'edit'
              ? 'Save changes'
              : 'Add category'}
        </button>
        {mode === 'edit' && onDone && (
          <button
            className="admin-btn admin-btn--ghost"
            type="button"
            onClick={onDone}
            disabled={pending}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
