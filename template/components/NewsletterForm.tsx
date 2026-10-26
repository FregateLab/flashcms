'use client';

import { useState } from 'react';
import { subscribeToNewsletter } from '@/lib/newsletter';

type Props = {
  placeholder: string;
  submitLabel: string;
  // Optional class-name overrides so each site's Footer can supply its
  // own CSS for the wrapper + input row. Defaults match the group-website
  // template so the "no-overrides" case Just Works.
  className?: string;
  rowClassName?: string;
  /** Text next to the required consent checkbox. */
  consentLabel?: string;
  /** id for the email input — change it if you render two forms on a page. */
  inputId?: string;
};

type State = { ok?: boolean; error?: string; already?: boolean };

export default function NewsletterForm({
  placeholder,
  submitLabel,
  className,
  rowClassName = 'footer__signup-form',
  consentLabel = 'I agree to receive newsletter emails and understand I can unsubscribe at any time.',
  inputId = 'footer-email',
}: Props) {
  const [state, setState] = useState<State>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState({});
    const form = new FormData(e.currentTarget);
    // subscribeToNewsletter is a server action — calling it from a
    // client is a normal async RPC. We use useState instead of
    // useActionState so this file works on React 18 as well as React 19.
    const result = await subscribeToNewsletter({}, form);
    setState(result);
    setPending(false);
  }

  if (state.ok) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{ padding: '4px 0', fontSize: 14 }}
      >
        {state.already
          ? "You're already on the list — thanks for the enthusiasm."
          : "Thanks! Check your inbox for a welcome email."}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-label="Newsletter sign-up"
      className={className}
    >
      <div className={rowClassName}>
        <label htmlFor={inputId} className="visually-hidden">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          name="email"
          placeholder={placeholder}
          required
          disabled={pending}
        />
        <button type="submit" disabled={pending}>
          {pending ? 'Subscribing…' : submitLabel}{' '}
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          marginTop: 12,
          fontSize: 13,
          lineHeight: 1.4,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          name="ack"
          required
          disabled={pending}
          style={{ marginTop: 3 }}
        />
        <span>{consentLabel}</span>
      </label>
      {state.error && (
        <p
          role="alert"
          style={{ marginTop: 8, fontSize: 13, color: '#F5B5B5' }}
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
