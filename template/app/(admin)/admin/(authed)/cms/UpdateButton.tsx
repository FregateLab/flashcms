'use client';

import { useActionState } from 'react';
import {
  triggerCmsUpdate,
  type CmsUpdateState,
} from '@/lib/cms-actions';

export default function UpdateButton({
  disabled,
  status,
  webhookConfigured,
}: {
  disabled?: boolean;
  status: string;
  webhookConfigured: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    CmsUpdateState,
    FormData
  >(triggerCmsUpdate, {});

  const label =
    status === 'up-to-date'
      ? 'Up to date'
      : status === 'ahead'
        ? 'No update needed'
        : status === 'unknown'
          ? 'Check unavailable'
          : webhookConfigured
            ? 'Trigger update'
            : 'Webhook not set';

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            'Trigger a redeploy? This will POST to your CMS_UPDATE_WEBHOOK_URL and cause your host to pull the latest CMS files.',
          )
        )
          e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="admin-btn"
        disabled={disabled || pending}
      >
        {pending ? 'Triggering…' : label}
      </button>
      {state.error && (
        <p className="admin-error" style={{ marginTop: 10, textAlign: 'right' }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p
          className="admin-lede"
          style={{
            marginTop: 10,
            textAlign: 'right',
            color: '#166534',
          }}
        >
          Update triggered.
          {state.targetVersion && ` Target v${state.targetVersion}.`}
        </p>
      )}
    </form>
  );
}
