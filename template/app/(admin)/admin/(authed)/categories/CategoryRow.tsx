'use client';

import { useState } from 'react';
import { deleteCategory } from '@/lib/categories';
import CategoryEditor from './CategoryEditor';

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAtLabel: string;
};

export default function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (
      !confirm(
        `Delete "${category.name}"? Posts in this category will become uncategorised (they won't be deleted).`,
      )
    )
      return;
    setDeleting(true);
    const form = new FormData();
    form.set('id', category.id);
    const result = await deleteCategory({}, form);
    setDeleting(false);
    if (result.error) alert(result.error);
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={5}>
          <div className="admin-card" style={{ margin: '4px 0' }}>
            <span className="admin-card__eyebrow">Edit category</span>
            <CategoryEditor
              mode="edit"
              category={category}
              onDone={() => setEditing(false)}
            />
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <div className="tcell-primary">
          <span className="tcell-primary__lines">
            <span className="tcell-primary__title">{category.name}</span>
            {category.description && (
              <span className="tcell-primary__sub">{category.description}</span>
            )}
          </span>
        </div>
      </td>
      <td className="narrow">
        <code>{category.slug}</code>
      </td>
      <td className="narrow">{category.sortOrder}</td>
      <td className="narrow tcell-date">{category.createdAtLabel}</td>
      <td className="narrow right">
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <button
            className="admin-btn admin-btn--ghost"
            type="button"
            style={{ padding: '5px 12px', fontSize: 12 }}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <button
            className="admin-btn admin-btn--danger"
            type="button"
            style={{ padding: '5px 12px', fontSize: 12 }}
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  );
}
