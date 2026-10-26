'use client';

import { useEffect, useState } from 'react';

type Frame = { src: string; alt: string };

/**
 * Client component that turns every <img> inside `containerSelector`
 * into a clickable trigger for a dark fullscreen viewer. Includes
 * prev/next buttons, keyboard nav (← → Esc), and a counter. Mounted
 * once on the detail page — it walks the DOM on mount, so any images
 * present in the server-rendered TipTap body are picked up
 * automatically, no per-image markup needed.
 */
export default function BlogArticleLightbox({
  containerSelector = '.blog-article',
}: {
  containerSelector?: string;
}) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const imgs = Array.from(
      container.querySelectorAll<HTMLImageElement>('img'),
    );
    const collected: Frame[] = imgs.map((img) => ({
      src: img.currentSrc || img.src,
      alt: img.alt || '',
    }));
    setFrames(collected);

    const cleanups: (() => void)[] = [];
    imgs.forEach((img, i) => {
      img.style.cursor = 'zoom-in';
      const onClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenIdx(i);
      };
      img.addEventListener('click', onClick);
      cleanups.push(() => img.removeEventListener('click', onClick));

      // If the image sits inside an <a>, intercept the anchor click too
      // so the viewer opens instead of navigating away.
      const anchor = img.closest('a');
      if (anchor) {
        const onAnchor = (e: MouseEvent) => {
          if (e.target instanceof HTMLImageElement) e.preventDefault();
        };
        anchor.addEventListener('click', onAnchor);
        cleanups.push(() => anchor.removeEventListener('click', onAnchor));
      }
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [containerSelector]);

  useEffect(() => {
    if (openIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIdx(null);
      else if (e.key === 'ArrowLeft')
        setOpenIdx((i) => (i === null || i === 0 ? i : i - 1));
      else if (e.key === 'ArrowRight')
        setOpenIdx((i) =>
          i === null || i >= frames.length - 1 ? i : i + 1,
        );
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [openIdx, frames.length]);

  if (openIdx === null) return null;
  const current = frames[openIdx];
  const canPrev = openIdx > 0;
  const canNext = openIdx < frames.length - 1;

  return (
    <div
      className="articleLightbox"
      onClick={() => setOpenIdx(null)}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        type="button"
        className="articleLightbox__close"
        onClick={(e) => {
          e.stopPropagation();
          setOpenIdx(null);
        }}
        aria-label="Close viewer"
      >
        ×
      </button>

      {canPrev && (
        <button
          type="button"
          className="articleLightbox__nav articleLightbox__nav--prev"
          onClick={(e) => {
            e.stopPropagation();
            setOpenIdx(openIdx - 1);
          }}
          aria-label="Previous image"
        >
          ‹
        </button>
      )}

      <figure
        className="articleLightbox__stage"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={current.src} alt={current.alt} />
        {current.alt ? (
          <figcaption className="articleLightbox__caption">
            {current.alt}
          </figcaption>
        ) : null}
      </figure>

      {canNext && (
        <button
          type="button"
          className="articleLightbox__nav articleLightbox__nav--next"
          onClick={(e) => {
            e.stopPropagation();
            setOpenIdx(openIdx + 1);
          }}
          aria-label="Next image"
        >
          ›
        </button>
      )}

      <div className="articleLightbox__counter">
        {openIdx + 1} / {frames.length}
      </div>
    </div>
  );
}
