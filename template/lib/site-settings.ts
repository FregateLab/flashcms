import { eq } from 'drizzle-orm';
import { cache } from 'react';
import { db, sites } from '@/db';
import { getCurrentSite } from '@/lib/site';

// ---------- Types ------------------------------------------------------
export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
  iconUrl?: string;
};

export type NavItem = {
  label: string;
  href: string;
  megaKey?: string; // 'about' | 'countries' | 'entities' | 'impact' | 'careers' | 'products'
};

export type HeaderConfig = {
  primaryNav: NavItem[];
  // Mega menu columns keyed by megaKey.
  mega: Record<string, NavLink[]>;
};

export type FooterColumn = {
  title: string;
  links: NavLink[];
};

export type FooterConfig = {
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
  columns: FooterColumn[];
  bottom: {
    copyright: string;
    links: NavLink[];
  };
};

// ---------- Defaults (match the current hard-coded site 1:1) -----------
export const DEFAULT_HEADER: HeaderConfig = {
  primaryNav: [
    { label: 'Home', href: '/' },
    { label: 'About SFH', href: '/about', megaKey: 'about' },
    { label: 'Countries', href: '/countries', megaKey: 'countries' },
    { label: 'Entities', href: '/entities', megaKey: 'entities' },
    { label: 'Impact', href: '/impact', megaKey: 'impact' },
    { label: 'Careers', href: '/careers', megaKey: 'careers' },
    { label: 'Products', href: '/products', megaKey: 'products' },
  ],
  mega: {
    about: [
      { label: 'Our story', href: '/about' },
      { label: 'Founders', href: '/about#founders' },
      { label: 'Leadership', href: '/about#leadership' },
      { label: 'Board of Trustees', href: '/about#trustees' },
      { label: 'Annual reports', href: '/reports' },
      { label: 'Contact us', href: '/contact' },
    ],
    countries: [
      { label: 'SFH Nigeria', href: 'https://sfhnigeria.org', external: true },
      { label: 'SFH Ghana', href: '/countries/ghana' },
      { label: 'SFH Sierra Leone', href: '/countries/sierra-leone' },
      { label: 'SFH Liberia', href: '/countries/liberia' },
      { label: 'SFH Côte d’Ivoire', href: '/countries/cote-divoire' },
    ],
    entities: [
      { label: 'SFH Nigeria', href: 'https://sfhnigeria.org', external: true },
      { label: 'SFH Institute of Public Health', href: 'https://sfhinstitute.com', external: true },
      { label: 'RevoHealth HMO Ltd', href: 'https://revohealthhmo.com', external: true },
      { label: 'SFH Access to Health GTE', href: 'https://sfhaccess.com', external: true },
      { label: 'SFH Advisory & Professional Services', href: '/entities#advisory' },
    ],
    impact: [
      { label: 'Key results', href: '/impact#key-results' },
      { label: 'Programmes', href: '/impact#programmes' },
      { label: 'Research & publications', href: '/impact#research' },
      { label: 'Annual reports', href: '/reports' },
      { label: 'Press releases', href: '/press' },
    ],
    careers: [
      { label: 'Open roles', href: '/careers#roles' },
      { label: 'Why join SFH', href: '/careers#why' },
      { label: 'Internships & fellowships', href: '/careers#internships' },
    ],
    products: [
      { label: 'AccessCare', href: 'https://accesscare.sfhaccess.com/', external: true },
      { label: 'SFH Logistics', href: 'https://logistics.sfhaccess.com/', external: true },
      { label: 'AccessMeds', href: 'https://accessmeds.sfhaccess.com/', external: true },
    ],
  },
};

export const DEFAULT_FOOTER: FooterConfig = {
  newsletter: {
    eyebrow: 'Quarterly bulletin',
    title: 'Stay close to our work',
    consentHtml:
      'By subscribing you agree to our <a href="/privacy">Privacy Policy</a>. Unsubscribe anytime.',
    placeholder: 'your@email.com',
    submitLabel: 'Subscribe',
  },
  brand: {
    imageUrl: '/v1/assets/sfh-logo.png',
    tagline:
      'Society for Family Health — a network of public-health organisations working across West Africa.',
  },
  columns: [
    {
      title: 'About SFH',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Leadership', href: '/about#leadership' },
        { label: 'Annual reports', href: '/reports' },
        { label: 'Press releases', href: '/press' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Countries',
      links: [
        { label: 'Nigeria', href: 'https://sfhnigeria.org', external: true, iconUrl: '/v1/assets/flags/Flag_of_Nigeria.png' },
        { label: 'Ghana', href: '/countries/ghana', iconUrl: '/v1/assets/flags/Flag_of_Ghana.png' },
        { label: 'Sierra Leone', href: '/countries/sierra-leone', iconUrl: '/v1/assets/flags/Flag_of_Sierra_Leone.png' },
        { label: 'Liberia', href: '/countries/liberia', iconUrl: '/v1/assets/flags/Flag_of_Liberia.svg' },
        { label: 'Côte d’Ivoire', href: '/countries/cote-divoire', iconUrl: '/v1/assets/flags/Flag_of_Cote_d_Ivoire.svg' },
      ],
    },
    {
      title: 'Connect',
      links: [
        { label: 'Contact us', href: '/contact' },
        { label: 'Press room', href: '/press' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/company/society-for-family-health-nigeria', external: true },
        { label: 'X · Twitter', href: 'https://twitter.com/SFHNigeria', external: true },
      ],
    },
  ],
  bottom: {
    copyright: `© ${new Date().getFullYear()} Society for Family Health`,
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Cookies', href: '#cookies' },
      { label: 'Whistleblowing', href: '/whistleblowing' },
    ],
  },
};

// ---------- Readers ----------------------------------------------------
export const getHeaderConfig = cache(async (): Promise<HeaderConfig> => {
  const site = await getCurrentSite();
  const [row] = await db
    .select({ header: sites.header })
    .from(sites)
    .where(eq(sites.id, site.id));
  return (row?.header as HeaderConfig | null) ?? DEFAULT_HEADER;
});

export const getFooterConfig = cache(async (): Promise<FooterConfig> => {
  const site = await getCurrentSite();
  const [row] = await db
    .select({ footer: sites.footer })
    .from(sites)
    .where(eq(sites.id, site.id));
  return (row?.footer as FooterConfig | null) ?? DEFAULT_FOOTER;
});
