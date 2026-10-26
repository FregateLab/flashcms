'use client';

import { useState } from 'react';
import MediaPicker from './MediaPicker';

/**
 * Custom Puck field for image URLs. Shows a small thumbnail, the raw URL
 * (still editable inline as a fallback), a "Browse" button that opens
 * MediaPicker, and a "Clear" button. Used everywhere blocks expose an
 * image URL prop.
 */
export default function MediaField({
  value,
  onChange,
  placeholder,
}: {
  value: string | undefined;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const url = value ?? '';

  return (
    <div className="mediaField">
      <div className="mediaField__preview">
        {url ? (
          <img src={url} alt="" />
        ) : (
          <span>none</span>
        )}
      </div>
      <div className="mediaField__controls">
        <input
          className="mediaField__url"
          // `type="text"` (not "url") on purpose — the field accepts
          //   * absolute URLs from the Media picker (S3 uploads), AND
          //   * absolute site paths for bundled /public assets
          //     (e.g. "/assets/hero.jpg").
          // Native url-validation rejects the second form, blocking Save
          // whenever an editor kept a bundled default image.
          type="text"
          value={url}
          placeholder={placeholder ?? 'https://… or /assets/…'}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="mediaField__buttons">
          <button
            type="button"
            className="mediaField__btn"
            onClick={() => setPickerOpen(true)}
          >
            Browse
          </button>
          {url && (
            <button
              type="button"
              className="mediaField__btn"
              onClick={() => onChange('')}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onSelect={(picked) => onChange(picked)}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
