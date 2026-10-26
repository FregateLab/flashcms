'use client';

import { useState } from 'react';
import {
  adminResubscribe,
  adminUnsubscribe,
} from '@/lib/newsletter';

export default function SubscriberActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = status === 'subscribed' ? adminUnsubscribe : adminResubscribe;
  const label = status === 'subscribed' ? 'Unsubscribe' : 'Resubscribe';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await action({}, form);
    if (result.error) setError(result.error);
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="admin-btn admin-btn--ghost"
        style={{ padding: '5px 12px', fontSize: 12 }}
        disabled={pending}
        title={error ?? ''}
      >
        {pending ? '…' : label}
      </button>
    </form>
  );
}
