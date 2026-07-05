// The fixed list of marketing routes that are editable in the CMS.
// Adding a page to this list makes it appear in /admin/pages; wiring
// the actual public route to render Puck data is a per-page step.
export const KNOWN_EDITABLE_PAGES = [
  { slug: 'home', label: 'Home', path: '/', ready: true },
  { slug: 'about', label: 'About SFH', path: '/about', ready: true },
  { slug: 'countries', label: 'Countries', path: '/countries', ready: true },
  { slug: 'countries/nigeria', label: 'SFH Nigeria', path: '/countries/nigeria', ready: true },
  { slug: 'countries/ghana', label: 'SFH Ghana', path: '/countries/ghana', ready: true },
  { slug: 'countries/sierra-leone', label: 'SFH Sierra Leone', path: '/countries/sierra-leone', ready: true },
  { slug: 'countries/liberia', label: 'SFH Liberia', path: '/countries/liberia', ready: true },
  { slug: 'countries/cote-divoire', label: 'SFH Côte d’Ivoire', path: '/countries/cote-divoire', ready: true },
  { slug: 'entities', label: 'Entities', path: '/entities', ready: true },
  { slug: 'impact', label: 'Impact', path: '/impact', ready: true },
  { slug: 'products', label: 'Products', path: '/products', ready: true },
  { slug: 'careers', label: 'Careers', path: '/careers', ready: true },
  { slug: 'press', label: 'Press', path: '/press', ready: true },
  { slug: 'reports', label: 'Reports', path: '/reports', ready: true },
  { slug: 'privacy', label: 'Privacy', path: '/privacy', ready: true },
  { slug: 'terms', label: 'Terms', path: '/terms', ready: true },
  { slug: 'whistleblowing', label: 'Whistleblowing', path: '/whistleblowing', ready: true },
  { slug: 'contact', label: 'Contact', path: '/contact', ready: true },
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
