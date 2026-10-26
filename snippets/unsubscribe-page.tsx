/**
 * COPY to app/(frontend)/unsubscribe/[token]/page.tsx in your project.
 *
 * One-click unsubscribe target for the link in the newsletter welcome
 * email (lib/emails/subscribe-welcome.ts builds `${origin}/unsubscribe/<token>`).
 * Lives in snippets/ because the (frontend) route group is per-site and
 * not part of the template. Restyle freely — the inline styles are a
 * neutral starting point.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { unsubscribeByToken } from '@/lib/newsletter';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await unsubscribeByToken(token);

  return (
    <main className="container" style={{ padding: '80px 20px', maxWidth: 640 }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #E4E7EE',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 4px 16px -8px rgba(15,23,42,0.10)',
        }}
      >
        {!result.ok ? (
          <>
            <h1 style={{ margin: '0 0 12px', color: '#1C2674', fontSize: 24 }}>
              Link expired or invalid
            </h1>
            <p style={{ margin: '0 0 20px', color: '#4A5568' }}>
              We couldn't find a matching subscription. The link may have
              already been used, or the URL may have been mistyped.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                background: '#E31B22',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
                padding: '12px 22px',
                borderRadius: 8,
              }}
            >
              Return home
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ margin: '0 0 12px', color: '#1C2674', fontSize: 24 }}>
              {result.alreadyUnsubscribed
                ? "You're already unsubscribed"
                : "You've been unsubscribed"}
            </h1>
            <p style={{ margin: '0 0 8px', color: '#4A5568' }}>
              {result.alreadyUnsubscribed
                ? `${result.email} was already removed from the newsletter list.`
                : `${result.email} has been removed from the newsletter list. You won't receive further emails from us.`}
            </p>
            <p style={{ margin: '0 0 24px', color: '#4A5568', fontSize: 14 }}>
              If this was a mistake, you can re-subscribe from the footer of
              any page.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                background: '#E31B22',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
                padding: '12px 22px',
                borderRadius: 8,
              }}
            >
              Return home
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
