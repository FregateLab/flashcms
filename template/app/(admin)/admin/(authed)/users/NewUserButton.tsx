'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser, type UserFormState } from '@/lib/users';

export default function NewUserButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    createUser,
    {},
  );

  useEffect(() => {
    if (state.ok && state.id) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <>
      <button
        type="button"
        className="admin-btn"
        onClick={() => setOpen(true)}
      >
        New user
      </button>

      {open && (
        <div
          className="mediaPicker"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="mediaPicker__panel"
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: 460 }}
          >
            <header className="mediaPicker__head">
              <h3 style={{ margin: 0, fontSize: 17 }}>Add a user</h3>
              <button
                type="button"
                className="mediaPicker__close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <form
              action={formAction}
              style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div className="admin-fielded">
                <label className="admin-label" htmlFor="nu-name">Name</label>
                <input
                  id="nu-name"
                  name="name"
                  className="admin-input"
                  required
                />
              </div>
              <div className="admin-fielded">
                <label className="admin-label" htmlFor="nu-email">Email</label>
                <input
                  id="nu-email"
                  name="email"
                  type="email"
                  className="admin-input"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="admin-fielded">
                <label className="admin-label" htmlFor="nu-password">Password</label>
                <input
                  id="nu-password"
                  name="password"
                  type="password"
                  className="admin-input"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <small style={{ color: 'var(--admin-ink-3)' }}>Minimum 8 characters.</small>
              </div>
              <div className="admin-fielded">
                <label className="admin-label" htmlFor="nu-role">Role</label>
                <select
                  id="nu-role"
                  name="role"
                  className="admin-input"
                  defaultValue="editor"
                >
                  <option value="editor">Editor — content only</option>
                  <option value="admin">Admin — content + user management</option>
                </select>
              </div>

              {state.error && (
                <p className="admin-error">{state.error}</p>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn"
                  disabled={pending}
                >
                  {pending ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
