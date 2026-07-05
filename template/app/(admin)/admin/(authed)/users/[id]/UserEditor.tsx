'use client';

import { useActionState, useState } from 'react';
import {
  changePassword,
  deleteUser,
  updateUserProfile,
  updateUserRole,
  type UserFormState,
} from '@/lib/users';

export default function UserEditor({
  userId,
  initialName,
  initialRole,
  isMe,
}: {
  userId: string;
  initialName: string;
  initialRole: 'admin' | 'editor';
  isMe: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState<'admin' | 'editor'>(initialRole);
  const [password, setPassword] = useState('');

  const [profileState, profileAction, profilePending] = useActionState<
    UserFormState,
    FormData
  >(updateUserProfile, {});
  const [roleState, roleAction, rolePending] = useActionState<
    UserFormState,
    FormData
  >(updateUserRole, {});
  const [pwState, pwAction, pwPending] = useActionState<UserFormState, FormData>(
    changePassword,
    {},
  );
  const [delState, delAction, delPending] = useActionState<
    UserFormState,
    FormData
  >(deleteUser, {});

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 620px)' }}>
      {/* Profile */}
      <div className="admin-card">
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 12.5,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--admin-ink-3)',
            fontWeight: 700,
          }}
        >
          Profile
        </h3>
        <form action={profileAction} className="admin-form">
          <input type="hidden" name="id" value={userId} />
          <div className="admin-fielded">
            <label className="admin-label" htmlFor="u-name">Name</label>
            <input
              id="u-name"
              name="name"
              className="admin-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {profileState.error && (
            <p className="admin-error">{profileState.error}</p>
          )}
          {profileState.ok && !profileState.error && (
            <p className="admin-lede" style={{ color: '#166534', margin: 0 }}>
              Saved.
            </p>
          )}
          <div>
            <button className="admin-btn" type="submit" disabled={profilePending}>
              {profilePending ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Role */}
      <div className="admin-card">
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 12.5,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--admin-ink-3)',
            fontWeight: 700,
          }}
        >
          Role
        </h3>
        <form action={roleAction} className="admin-form">
          <input type="hidden" name="id" value={userId} />
          <div className="admin-fielded">
            <label className="admin-label" htmlFor="u-role">Access level</label>
            <select
              id="u-role"
              name="role"
              className="admin-input"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'editor')}
            >
              <option value="editor">Editor · content only</option>
              <option value="admin">Admin · content + user management</option>
            </select>
            {isMe && (
              <small style={{ color: 'var(--admin-ink-3)' }}>
                You can't downgrade your own admin role.
              </small>
            )}
          </div>
          {roleState.error && (
            <p className="admin-error">{roleState.error}</p>
          )}
          {roleState.ok && !roleState.error && (
            <p className="admin-lede" style={{ color: '#166534', margin: 0 }}>
              Role updated.
            </p>
          )}
          <div>
            <button className="admin-btn" type="submit" disabled={rolePending}>
              {rolePending ? 'Saving…' : 'Update role'}
            </button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="admin-card">
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 12.5,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--admin-ink-3)',
            fontWeight: 700,
          }}
        >
          Reset password
        </h3>
        <form action={pwAction} className="admin-form">
          <input type="hidden" name="id" value={userId} />
          <div className="admin-fielded">
            <label className="admin-label" htmlFor="u-pw">New password</label>
            <input
              id="u-pw"
              name="password"
              type="password"
              autoComplete="new-password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <small style={{ color: 'var(--admin-ink-3)' }}>
              Minimum 8 characters. This will sign the user out on their next request.
            </small>
          </div>
          {pwState.error && <p className="admin-error">{pwState.error}</p>}
          {pwState.ok && !pwState.error && (
            <p className="admin-lede" style={{ color: '#166534', margin: 0 }}>
              Password updated.
            </p>
          )}
          <div>
            <button className="admin-btn" type="submit" disabled={pwPending}>
              {pwPending ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger */}
      <div
        className="admin-card"
        style={{ borderColor: 'var(--admin-danger-soft)' }}
      >
        <h3
          style={{
            margin: '0 0 6px',
            fontSize: 12.5,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--admin-danger)',
            fontWeight: 700,
          }}
        >
          Danger zone
        </h3>
        <p className="admin-lede" style={{ marginBottom: 12 }}>
          Deleting a user is permanent. Their authored content is preserved but
          orphaned.
        </p>
        <form
          action={delAction}
          onSubmit={(e) => {
            if (
              !confirm(
                'Delete this user? This cannot be undone. Their content stays but is orphaned.',
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={userId} />
          {delState.error && <p className="admin-error">{delState.error}</p>}
          <button
            type="submit"
            className="admin-btn admin-btn--danger"
            disabled={delPending || isMe}
            title={isMe ? "You can't delete your own account." : undefined}
          >
            {delPending ? 'Deleting…' : 'Delete user'}
          </button>
        </form>
      </div>
    </div>
  );
}
