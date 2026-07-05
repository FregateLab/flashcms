'use client';

import { useActionState } from 'react';
import {
  cleanupOldAnalytics,
  type CleanupState,
} from '@/lib/analytics-actions';

function formatDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CleanupCard({ oldest }: { oldest: string | null }) {
  const [state, formAction, pending] = useActionState<CleanupState, FormData>(
    cleanupOldAnalytics,
    {},
  );

  return (
    <div
      className="admin-card"
      style={{ borderColor: 'var(--admin-danger-soft)' }}
    >
      <span
        className="admin-card__eyebrow"
        style={{ color: 'var(--admin-danger)' }}
      >
        Retention
      </span>
      <p className="admin-lede" style={{ marginTop: 6, marginBottom: 12 }}>
        {oldest
          ? `Oldest event on record: ${formatDate(oldest)}. `
          : 'No events recorded yet. '}
        Analytics rows older than 90 days are pruned opportunistically
        (once per process per hour). Use the button below to force a
        purge with a custom horizon.
      </p>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm('Delete analytics rows older than that many days?')) {
            e.preventDefault();
          }
        }}
        style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <label
          htmlFor="cleanup-days"
          style={{ fontSize: 12.5, color: 'var(--admin-ink-2)' }}
        >
          Delete rows older than
        </label>
        <input
          id="cleanup-days"
          name="days"
          type="number"
          min={1}
          max={3650}
          defaultValue={90}
          className="admin-input"
          style={{ width: 100 }}
        />
        <span style={{ fontSize: 12.5, color: 'var(--admin-ink-2)' }}>days</span>
        <button
          type="submit"
          className="admin-btn admin-btn--danger"
          disabled={pending}
          style={{ marginLeft: 'auto' }}
        >
          {pending ? 'Purging…' : 'Delete old events'}
        </button>
      </form>
      {state.error && <p className="admin-error" style={{ marginTop: 10 }}>{state.error}</p>}
      {state.ok && (
        <p
          className="admin-lede"
          style={{ color: '#166534', marginTop: 10, marginBottom: 0 }}
        >
          Deleted {state.deletedEvents?.toLocaleString() ?? 0} events and{' '}
          {state.deletedVitals?.toLocaleString() ?? 0} vitals rows.
        </p>
      )}
    </div>
  );
}
