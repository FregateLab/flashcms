'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Reports Web Vitals metrics (LCP, CLS, INP, FCP, TTFB) to
 * /api/analytics/vitals. Fires each metric once per page load. Uses the
 * dynamic import so the tiny web-vitals lib only ships when needed and
 * is safe when the API isn't supported (older browsers).
 */
export default function VitalsReporter() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin surface — CMS UX isn't public performance.
    if (!pathname || pathname.startsWith('/admin')) return;

    let cancelled = false;

    (async () => {
      try {
        const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import(
          'web-vitals'
        );
        if (cancelled) return;

        const send = (metric: { name: string; value: number; id: string }) => {
          const payload = JSON.stringify({
            name: metric.name,
            value: metric.value,
            id: metric.id,
            path: pathname,
          });
          try {
            if (
              typeof navigator !== 'undefined' &&
              typeof navigator.sendBeacon === 'function'
            ) {
              navigator.sendBeacon(
                '/api/analytics/vitals',
                new Blob([payload], { type: 'application/json' }),
              );
              return;
            }
          } catch {
            /* fall through */
          }
          fetch('/api/analytics/vitals', {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          }).catch(() => undefined);
        };

        onLCP(send);
        onCLS(send);
        onINP(send);
        onFCP(send);
        onTTFB(send);
      } catch {
        /* web-vitals failed to load — ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
