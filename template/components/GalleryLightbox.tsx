'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Photo = { src: string; caption: string };

type Props = { photos: Photo[] };

/**
 * Fullscreen lightbox for the /gallery page. Listens for clicks on any
 * [data-gallery-index] element (the photo cards), opens a modal with a
 * large photo, prev/next nav, a scrollable thumbnail strip, and
 * keyboard controls (Esc to close, arrow keys to navigate).
 */
export default function GalleryLightbox({ photos }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const thumbRailRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const next = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);
  const prev = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  // Delegated click handler on the gallery photo cards.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-gallery-index]');
      if (!target) return;
      e.preventDefault();
      const idx = Number(target.dataset.galleryIndex);
      if (!Number.isNaN(idx)) setActiveIndex(idx);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Keyboard handlers + body scroll lock while open.
  useEffect(() => {
    if (activeIndex === null) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [activeIndex, close, next, prev]);

  // Auto-scroll the thumbnail strip so the active thumb is in view.
  useEffect(() => {
    if (activeIndex === null || !thumbRailRef.current) return;
    const rail = thumbRailRef.current;
    const active = rail.querySelector<HTMLElement>(`[data-thumb-index="${activeIndex}"]`);
    active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIndex]);

  if (activeIndex === null) return null;
  const photo = photos[activeIndex];

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo gallery">
      <button
        className="lightbox__scrim"
        type="button"
        onClick={close}
        aria-label="Close gallery"
      />

      <button
        className="lightbox__close"
        type="button"
        onClick={close}
        aria-label="Close gallery"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={24} height={24}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <button
        className="lightbox__nav lightbox__nav--prev"
        type="button"
        onClick={prev}
        aria-label="Previous photo"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <figure className="lightbox__frame">
        <img
          className="lightbox__image"
          src={photo.src}
          alt={photo.caption}
          key={photo.src}
        />
        <figcaption className="lightbox__caption">
          <span className="lightbox__count">
            {activeIndex + 1} / {photos.length}
          </span>
          <span className="lightbox__caption-text">{photo.caption}</span>
        </figcaption>
      </figure>

      <button
        className="lightbox__nav lightbox__nav--next"
        type="button"
        onClick={next}
        aria-label="Next photo"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>

      <div className="lightbox__thumbs" ref={thumbRailRef} aria-label="Gallery thumbnails">
        {photos.map((p, i) => (
          <button
            key={p.src}
            data-thumb-index={i}
            type="button"
            className={`lightbox__thumb${i === activeIndex ? ' is-active' : ''}`}
            onClick={() => setActiveIndex(i)}
            aria-label={p.caption}
            aria-current={i === activeIndex ? 'true' : undefined}
          >
            <img src={p.src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
