// Customise this file per-project — it drives the `/admin/pages` view.
//
// Each entry:
//   slug     — DB key; also used in the /admin/pages/… URL
//   label    — human-readable name
//   path     — public-site path this page renders at
//   section  — group heading in the /admin/pages table
//   icon     — glyph rendered next to the label (any unicode char)
//   ready    — false = show but disable editing (for future/wip routes)
//
// The /admin/pages view groups entries by `section`, preserving the
// order of first appearance for both the group and the pages within it.
//
// After adding a route here, wire the matching public route in
// app/<slug>/page.tsx to render CMS data — see lib/render-cms-page.tsx
// for the pattern.
export const KNOWN_EDITABLE_PAGES = [
  { slug: 'home', label: 'Home', path: '/', section: 'Overview', icon: '⌂', ready: true },
  { slug: 'about', label: 'About', path: '/about', section: 'Content', icon: '❖', ready: true },
] as const;

export type KnownEditablePage = (typeof KNOWN_EDITABLE_PAGES)[number];

export function findKnownPage(slug: string) {
  return KNOWN_EDITABLE_PAGES.find((p) => p.slug === slug);
}

/** slug used in `/admin/pages/…` URLs. Slashes stay as slashes; the
 *  route uses a catch-all so nested slugs like `countries/nigeria`
 *  work directly. */
export function slugToRouteParam(slug: string): string[] {
  return slug.split('/');
}

export function routeParamToSlug(param: string[]): string {
  return param.join('/');
}

/** Ordered list of unique sections (first-appearance order). */
export function knownSectionOrder(): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const p of KNOWN_EDITABLE_PAGES) {
    if (!seen.has(p.section)) {
      seen.add(p.section);
      order.push(p.section);
    }
  }
  return order;
}
