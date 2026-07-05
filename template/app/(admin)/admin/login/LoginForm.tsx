'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setSubmitting(false);
    if (!res || res.error) {
      setError('Invalid email or password.');
      return;
    }
    window.location.href = res.url ?? callbackUrl;
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div>
        <label className="admin-label" htmlFor="email">Email</label>
        <input
          id="email"
          className="admin-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="admin-label" htmlFor="password">Password</label>
        <input
          id="password"
          className="admin-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="admin-error">{error}</p>}
      <button
        className="admin-btn"
        type="submit"
        disabled={submitting}
        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
