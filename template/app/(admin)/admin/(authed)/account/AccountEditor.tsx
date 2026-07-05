'use client';

import { useActionState, useState } from 'react';
import {
  changePassword,
  updateUserProfile,
  type UserFormState,
} from '@/lib/users';

export default function AccountEditor({
  userId,
  email,
  role,
  initialName,
}: {
  userId: string;
  email: string;
  role: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState('');

  const [profileState, profileAction, profilePending] = useActionState<
    UserFormState,
    FormData
  >(updateUserProfile, {});
  const [pwState, pwAction, pwPending] = useActionState<UserFormState, FormData>(
    changePassword,
    {},
  );

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 620px)' }}>
      <div className="admin-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 4,
          }}
        >
          <div
            className="tcell-primary__icon"
            style={{
              width: 44,
              height: 44,
              background: 'var(--sfh-navy-soft)',
              color: 'var(--sfh-navy)',
              fontWeight: 700,
              fontSize: 17,
              borderColor: 'transparent',
            }}
          >
            {(initialName || email).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{email}</div>
            <span
              className={
                role === 'admin'
                  ? 'admin-pill admin-pill--accent'
                  : 'admin-pill admin-pill--neutral'
              }
              style={{ marginTop: 4 }}
            >
              {role}
            </span>
          </div>
        </div>
      </div>

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
            <label className="admin-label" htmlFor="me-name">Name</label>
            <input
              id="me-name"
              name="name"
              className="admin-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {profileState.error && <p className="admin-error">{profileState.error}</p>}
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
          Change password
        </h3>
        <form action={pwAction} className="admin-form">
          <input type="hidden" name="id" value={userId} />
          <div className="admin-fielded">
            <label className="admin-label" htmlFor="me-pw">New password</label>
            <input
              id="me-pw"
              name="password"
              type="password"
              autoComplete="new-password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <small style={{ color: 'var(--admin-ink-3)' }}>Minimum 8 characters.</small>
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
    </div>
  );
}
