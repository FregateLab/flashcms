# Site settings (header + footer)

The header nav and footer are editable at `/admin/site-settings`. Data
lives in the `sites` row as two jsonb columns.

## Header shape

```ts
type HeaderConfig = {
  primaryNav: {
    label: string;
    href: string;
    megaKey?: string;    // matches a key under `mega`
  }[];

  mega: Record<
    string,   // key (e.g. 'about', 'countries')
    {
      label: string;
      href: string;
      external?: boolean;
      iconUrl?: string;
    }[]
  >;
};
```

## Footer shape

```ts
type FooterConfig = {
  newsletter: {
    eyebrow: string;
    title: string;
    consentHtml: string;
    placeholder: string;
    submitLabel: string;
  };
  brand: {
    imageUrl: string;
    tagline: string;
  };
  columns: {
    title: string;
    links: {
      label: string;
      href: string;
      external?: boolean;
      iconUrl?: string;
    }[];
  }[];
  bottom: {
    copyright: string;
    links: { label: string; href: string; external?: boolean }[];
  };
};
```

## Defaults

`lib/site-settings.ts` exports `DEFAULT_HEADER` and `DEFAULT_FOOTER`
mirroring the current SFH marketing site. If a target project hasn't
customised anything, these render on the public site.

Replace `DEFAULT_HEADER` / `DEFAULT_FOOTER` with your own defaults, or
edit them from `/admin/site-settings` and never touch the file.

## Rendering

The public layout fetches both configs server-side:

```tsx
// app/(frontend)/layout.tsx
import { getFooterConfig, getHeaderConfig } from '@/lib/site-settings';

const [headerConfig, footerConfig] = await Promise.all([
  getHeaderConfig(),
  getFooterConfig(),
]);

<Header config={headerConfig} />
<Footer config={footerConfig} />
<MobileMenu config={headerConfig} />
```

`Header.tsx` (client, uses `usePathname`), `MobileMenu.tsx` (server),
and `Footer.tsx` (server) all take the config as a prop. Rebuild them
for your site's design if the SFH markup doesn't match — the JSON shape
above is all that matters.

## Editor

- `/admin/site-settings` has two tabs — Header & Navigation, Footer.
- Every list has ↑ ↓ × row controls plus an add button.
- Save fires `saveHeaderConfig` / `saveFooterConfig` → updates the
  `sites` row, `revalidatePath('/', 'layout')` so the whole public tree
  drops its cached chrome.
- **Sticky save bar** at the bottom of each tab with a **Reset changes**
  button that reverts to what was loaded.
- **Reset to defaults** — expose the `resetHeaderConfig` /
  `resetFooterConfig` actions (already in
  `lib/site-settings-actions.ts`) with an admin-only button if you want
  a "restore factory" option.
