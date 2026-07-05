'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Fires a pageview beacon to /api/analytics/track on every route change,
 * including the first render. Uses sendBeacon when the browser supports
 * it (survives page unloads); otherwise falls back to fetch.
 */
export default function AnalyticsBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    // Skip the admin surface — it's authenticated dogfood, not visitors.
    if (pathname.startsWith('/admin')) return;

    const qs = searchParams?.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (lastRef.current === url) return;
    lastRef.current = url;

    const payload = JSON.stringify({
      path: pathname, // path only; query is dropped server-side anyway
      referrer: document.referrer || null,
    });

    try {
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.sendBeacon === 'function'
      ) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/track', blob);
        return;
      }
    } catch {
      /* fall through to fetch */
    }
    fetch('/api/analytics/track', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).catch(() => {
      /* ignore analytics errors */
    });
  }, [pathname, searchParams]);

  return null;
}
