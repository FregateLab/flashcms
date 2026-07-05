'use client';

import { useState } from 'react';
import type {
  FooterConfig,
  HeaderConfig,
} from '@/lib/site-settings';
import HeaderEditor from './HeaderEditor';
import FooterEditor from './FooterEditor';

type Tab = 'header' | 'footer';

export default function SiteSettingsEditor({
  initialHeader,
  initialFooter,
}: {
  initialHeader: HeaderConfig;
  initialFooter: FooterConfig;
}) {
  const [tab, setTab] = useState<Tab>('header');

  return (
    <>
      <div className="admin-filters" style={{ marginTop: 4 }}>
        <button
          type="button"
          className="admin-filterPill"
          data-active={tab === 'header' ? 'true' : undefined}
          onClick={() => setTab('header')}
        >
          Header & Navigation
        </button>
        <button
          type="button"
          className="admin-filterPill"
          data-active={tab === 'footer' ? 'true' : undefined}
          onClick={() => setTab('footer')}
        >
          Footer
        </button>
      </div>

      {tab === 'header' && <HeaderEditor initial={initialHeader} />}
      {tab === 'footer' && <FooterEditor initial={initialFooter} />}
    </>
  );
}
