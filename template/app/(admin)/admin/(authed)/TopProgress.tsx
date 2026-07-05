'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type State = 'idle' | 'loading' | 'done';

/**
 * Thin top-of-viewport progress bar. Fires on any same-origin link
 * click or form submit that would navigate. Clears as soon as the new
 * pathname (or search params) lands. Gives editors instant "click was
 * registered" feedback when network latency is high.
 */
export default function TopProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>('idle');
  const stateRef = useRef<State>('idle');
  stateRef.current = state;

  // When the route lands, flick to `done` then back to `idle`.
  useEffect(() => {
    if (stateRef.current === 'loading') {
      setState('done');
      const t = setTimeout(() => setState('idle'), 320);
      return () => clearTimeout(t);
    }
  }, [pathname, searchParams]);

  // Also reset if navigation aborts (user cancelled, etc.). Safety valve
  // so the bar never sits forever if we miss a transition.
  useEffect(() => {
    if (state !== 'loading') return;
    const t = setTimeout(() => setState('idle'), 15_000);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    function isNavigableHref(href: string) {
      if (!href) return false;
      if (href.startsWith('#')) return false;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
      if (/^javascript:/i.test(href)) return false;
      if (/^https?:/i.test(href)) {
        try {
          return new URL(href).origin === window.location.origin;
        } catch {
          return false;
        }
      }
      return true;
    }

    function onClick(e: MouseEvent) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      if (e.defaultPrevented) return;
      const el = (e.target as Element | null)?.closest('a');
      if (!el) return;
      if (el.hasAttribute('download')) return;
      if (el.getAttribute('target') === '_blank') return;
      const href = el.getAttribute('href');
      if (!href || !isNavigableHref(href)) return;

      const here = window.location.pathname + window.location.search;
      // Same URL — no navigation will fire.
      if (href === here || href === window.location.pathname) return;

      setState('loading');
    }

    function onSubmit(e: SubmitEvent) {
      const form = e.target as HTMLFormElement | null;
      if (!form) return;
      // Skip explicit dialog forms and forms opting out via data attribute.
      if (form.getAttribute('method')?.toLowerCase() === 'dialog') return;
      if (form.dataset.progress === 'off') return;
      setState('loading');
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
    };
  }, []);

  return (
    <div
      className="admin-progress"
      data-state={state}
      aria-hidden="true"
      role="progressbar"
    />
  );
}
