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
          type="url"
          value={url}
          placeholder={placeholder ?? 'https://…'}
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
