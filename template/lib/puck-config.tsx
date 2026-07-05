import type { Config } from '@measured/puck';
import MediaField from '@/components/MediaField';

// Custom Puck field for any image URL prop — replaces the plain text
// input with a preview thumbnail + Browse button that opens the media
// picker modal.
function imageField(label: string) {
  return {
    type: 'custom' as const,
    label,
    render: ({
      value,
      onChange,
    }: {
      value: string | undefined;
      onChange: (next: string) => void;
    }) => <MediaField value={value} onChange={onChange} />,
  };
}

// -------- dynamic block placeholders ------------------------------------
// PressFeatDynamic + PressListDynamic pull posts from the DB. This file
// stays 100% client-safe so the Puck editor bundle never touches @/db.
// The server-side renderer (lib/render-cms-page.tsx) swaps these
// placeholder renders for the real async server components before
// rendering on the public site.

export function PressBlockPlaceholder({ label }: { label: string }) {
  return (
    <section
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--admin-bg, #f7f7f9)',
        border: '1px dashed rgba(0,0,0,0.15)',
        borderRadius: 12,
        margin: '16px 0',
        color: 'var(--admin-ink-2, #475569)',
      }}
    >
      <strong style={{ display: 'block', marginBottom: 4 }}>{label}</strong>
      <small>Renders live posts from CMS on the public site.</small>
    </section>
  );
}

// ---------------------------------------------------------------------
// SFH marketing-site block library, registered as Puck components.
//
// Each block below produces the exact JSX the hard-coded pages use, so
// a page composed in the CMS is visually identical to the current
// static version. New blocks are added incrementally as we convert
// more marketing routes over.
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Shared prop types
// ---------------------------------------------------------------------
type PersonItem = { name: string; role: string; photo: string; personKey?: string };
type StatItem = { number: string; label: string };
type PillarItem = { title: string; body: string };
type GalleryItem = { src: string };

type AboutHeroProps = {
  eyebrow: string;
  titleWords: { word: string; italic?: boolean }[];
  ariaLabel: string;
  image: string;
  scrollHref: string;
};

type AboutFactsProps = {
  facts: StatItem[];
};

type AboutFeatureProps = {
  eyebrow: string;
  title: string;
  lede: string;
  signatureTitle: string;
  signatureSub: string;
  pillars: PillarItem[];
};

type PeopleBandProps = {
  variant: 'surface' | 'default';
  eyebrow: string;
  title: string;
  lede: string;
  people: PersonItem[];
  anchor?: string;
};

type GalleryProps = {
  eyebrow: string;
  title: string;
  lede: string;
  images: GalleryItem[];
};

type CountryFeatureStat = { label: string; value: string };
type CountryFeatureProps = {
  href: string;
  ariaLabel: string;
  image: string;
  imageAlt: string;
  flag: string;
  eyebrow: string;
  title: string;
  desc: string;
  stats: CountryFeatureStat[];
  ctaLabel: string;
};

type CountryCardItem = {
  href: string;
  flag: string;
  eyebrow: string;
  title: string;
  desc: string;
};
type CountriesGridProps = {
  headEyebrow: string;
  headTitle: string;
  headLede: string;
  feature?: CountryFeatureProps;
  cards: CountryCardItem[];
  anchor?: string;
};

type JourneyChapterItem = {
  years: string;
  title: string;
  body: string;
};
type JourneyChaptersProps = {
  eyebrow: string;
  title: string;
  lede: string;
  chapters: JourneyChapterItem[];
};

type PartnersLogoItem = { src: string; alt: string; href?: string };
type PartnersMarqueeProps = {
  eyebrow: string;
  logos: PartnersLogoItem[];
};

type CpageFeatureProps = {
  mediaSide: 'left' | 'right';
  anchor?: string;
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  body: string;
};

type CpageOfficeProps = {
  eyebrow: string;
  city: string;
  addressHtml: string;
  ctaLabel: string;
  ctaHref: string;
};

type CountryRowItem = {
  index: string;
  flag: string;
  name: string;
  meta: string;
  lede: string;
  image: string;
  imageAlt: string;
  stats: { label: string; value: string }[];
  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;
};

type CountriesEditorialProps = {
  eyebrow: string;
  title: string;
  lede: string;
  anchor?: string;
  rows: CountryRowItem[];
};

type CpageIntroProps = {
  eyebrow: string;
  title: string;
  lede: string;
  anchor?: string;
};

type EntityRowItem = {
  index: string;
  name: string;
  meta: string;
  lede: string;
  image: string;
  imageAlt: string;
  anchor?: string;
  stats: { label: string; value: string }[];
  ctaLabel?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
};
type EntitiesEditorialProps = {
  eyebrow: string;
  title: string;
  lede: string;
  anchor?: string;
  rows: EntityRowItem[];
};

type RawHtmlSectionProps = {
  html: string;
  containerClass?: string;
  anchor?: string;
};

type ReportsFeatProps = {
  coverYearVariant: string;
  coverTitle: string;
  badge: string;
  eyebrow: string;
  title: string;
  lede: string;
  stats: { label: string; value: string }[];
  pdfLabel: string;
  pdfHref: string;
};

type ReportCardItem = {
  yearVariant: string;
  year: string;
  coverTitle: string;
  bodyTitle: string;
  summary: string;
  href: string;
};
type ReportsListProps = {
  eyebrow: string;
  title: string;
  lede: string;
  reports: ReportCardItem[];
};

type ReportsArchiveProps = {
  eyebrow: string;
  title: string;
  lede: string;
  ctaLabel: string;
  ctaHref: string;
};

type PlatformItem = {
  reverse?: boolean;
  href: string;
  ariaLabel: string;
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  desc: string;
  ctaLabel: string;
};
type ProductPlatformsProps = {
  anchor?: string;
  platforms: PlatformItem[];
};

type SpotlightProductItem = {
  href: string;
  image: string;
  imageAlt: string;
  categoryLabel: string;
  categoryKey: string;
  title: string;
  desc: string;
};
type ProductsSpotlightProps = {
  eyebrow: string;
  title: string;
  lede: string;
  anchor?: string;
  products: SpotlightProductItem[];
  ctaLabel: string;
  ctaHref: string;
};

type ImpactDeliverRow = {
  index: string;
  name: string;
  meta: string;
  lede: string;
  image: string;
  imageAlt: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
};
type ImpactDeliverProps = {
  eyebrow: string;
  title: string;
  lede: string;
  anchor?: string;
  rows: ImpactDeliverRow[];
};

type ImpactKrCardItem = { sub: string; num: string; label: string };
type ImpactKeyResultsProps = {
  anchor?: string;
  eyebrow: string;
  title: string;
  lede: string;
  heroImage: string;
  heroEyebrow: string;
  heroNum: string;
  heroLabel: string;
  heroDesc: string;
  cards: ImpactKrCardItem[];
  footHtml: string;
};

type FeaturedProgrammeItem = {
  index: string;
  title: string;
  lede: string;
  image: string;
  imageAlt: string;
  href: string;
};
type SupportingProgrammeItem = {
  index: string;
  title: string;
  lede: string;
  image: string;
  imageAlt: string;
};
type ImpactProgrammesProps = {
  anchor?: string;
  eyebrow: string;
  title: string;
  lede: string;
  featured: FeaturedProgrammeItem[];
  supportingHeadEyebrow: string;
  supporting: SupportingProgrammeItem[];
};

type HeroCarouselSlide = {
  image: string;
  tag: string;
  titleLine1: string;
  titleLine2Em: string;
  lede: string;
  ctaLabel: string;
  ctaHref: string;
};
type HeroCarouselProps = {
  slides: HeroCarouselSlide[];
  scrollHref: string;
};

type StatItem2 = { num: string; label: string };
type StatsStripProps = {
  ariaLabel: string;
  stats: StatItem2[];
};

type WhoBandProps = {
  centered?: boolean;
  anchor?: string;
  title: string;
  lede: string;
  ctaLabel: string;
  ctaHref: string;
};

type VisionMissionProps = {
  anchor?: string;
  visionLabel: string;
  visionStatementHtml: string;
  missionLabel: string;
  missionStatementHtml: string;
  ctaLabel: string;
  ctaHref: string;
  primaryImage: string;
  primaryImageAlt: string;
  accentImage: string;
  accentImageAlt: string;
  peekImage: string;
};

type HomePressItem = {
  href: string;
  image: string;
  imageAlt: string;
  meta: string;
  title: string;
};
type HomePressGridProps = {
  anchor?: string;
  eyebrow: string;
  title: string;
  items: HomePressItem[];
};

type PressFeatDynamicProps = {
  eyebrow: string;
  badge: string;
  ctaLabel: string;
};

type PressListDynamicProps = {
  anchor?: string;
  eyebrow: string;
  title: string;
  lede: string;
  showFilter?: boolean;
  ctaLabel: string;
  externalCtaLabel: string;
};

type PressMediaKitLink = { label: string; href: string; arrow?: string };
type PressMediaBandProps = {
  eyebrow: string;
  title: string;
  lede: string;
  email: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  kitEyebrow: string;
  kitLinks: PressMediaKitLink[];
};

type ContactRouteItem = {
  index: string;
  title: string;
  lede: string;
  linkLabel: string;
  linkHref: string;
  accent?: boolean;
};
type ContactRoutesProps = {
  anchor?: string;
  routes: ContactRouteItem[];
};

type ContactFactItem = { label: string; value: string };
type ContactMessageFormProps = {
  anchor?: string;
  copyEyebrow: string;
  copyTitle: string;
  copyLede: string;
  facts: ContactFactItem[];
  noteHtml: string;
  submitLabel: string;
  consentHtml: string;
  topics: { label: string }[];
};

type ContactOfficeItem = {
  label: string;
  name: string;
  flag: string;
  addressHtml: string;
  email: string;
  linkLabel: string;
  linkHref: string;
  linkExternal?: boolean;
};
type ContactOfficesProps = {
  eyebrow: string;
  title: string;
  lede: string;
  offices: ContactOfficeItem[];
};

type NumberedCardItem = {
  index: string;
  title: string;
  body: string;
  meta?: string;
};
type NumberedCardsGridProps = {
  anchor?: string;
  variantClass?: string;
  eyebrow: string;
  title: string;
  lede: string;
  cards: NumberedCardItem[];
  gridExtraClass?: string;
};

type CareersCtaCardProps = {
  anchor?: string;
  image: string;
  eyebrow: string;
  title: string;
  lede: string;
  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;
};

type ImpactResearchProps = {
  anchor?: string;
  eyebrow: string;
  title: string;
  body: string;
  types: { value: string }[];
  cardEyebrow: string;
  cardTitle: string;
  cardBody: string;
  cardCtaLabel: string;
  cardCtaHref: string;
  cardSubLinkLabel: string;
  cardSubLinkHref: string;
};

// legacy generic blocks kept from the earlier iteration - still useful
type HeroProps = {
  eyebrow?: string;
  title: string;
  emphasise?: string;
  lede?: string;
  image?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type TextBlockProps = {
  eyebrow?: string;
  title?: string;
  body: string;
  align?: 'left' | 'center';
};

type CTAProps = {
  title: string;
  body?: string;
  ctaLabel: string;
  ctaHref: string;
};

export type PuckComponents = {
  AboutHero: AboutHeroProps;
  AboutFacts: AboutFactsProps;
  AboutFeature: AboutFeatureProps;
  PeopleBand: PeopleBandProps;
  Gallery: GalleryProps;
  CountriesGrid: CountriesGridProps;
  CpageFeature: CpageFeatureProps;
  CpageOffice: CpageOfficeProps;
  CountriesEditorial: CountriesEditorialProps;
  CpageIntro: CpageIntroProps;
  EntitiesEditorial: EntitiesEditorialProps;
  RawHtmlSection: RawHtmlSectionProps;
  ReportsFeat: ReportsFeatProps;
  ReportsList: ReportsListProps;
  ReportsArchive: ReportsArchiveProps;
  ProductPlatforms: ProductPlatformsProps;
  ProductsSpotlight: ProductsSpotlightProps;
  ImpactDeliver: ImpactDeliverProps;
  ImpactKeyResults: ImpactKeyResultsProps;
  ImpactProgrammes: ImpactProgrammesProps;
  ImpactResearch: ImpactResearchProps;
  ContactRoutes: ContactRoutesProps;
  ContactMessageForm: ContactMessageFormProps;
  ContactOffices: ContactOfficesProps;
  NumberedCardsGrid: NumberedCardsGridProps;
  CareersCtaCard: CareersCtaCardProps;
  HeroCarousel: HeroCarouselProps;
  StatsStrip: StatsStripProps;
  WhoBand: WhoBandProps;
  VisionMission: VisionMissionProps;
  HomePressGrid: HomePressGridProps;
  PressFeatDynamic: PressFeatDynamicProps;
  PressListDynamic: PressListDynamicProps;
  PressMediaBand: PressMediaBandProps;
  JourneyChapters: JourneyChaptersProps;
  PartnersMarquee: PartnersMarqueeProps;
  Hero: HeroProps;
  TextBlock: TextBlockProps;
  CTA: CTAProps;
};

// ---------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------
export const puckConfig: Config<PuckComponents> = {
  components: {
    // -----------------------------------------------------------------
    AboutHero: {
      label: 'Hero · About/interior pattern',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        titleWords: {
          type: 'array',
          label: 'Title words (one per token; toggle italic on any)',
          arrayFields: {
            word: { type: 'text', label: 'Word' },
            italic: {
              type: 'radio',
              label: 'Italic?',
              options: [
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ],
            },
          },
          defaultItemProps: { word: 'word', italic: false },
        },
        ariaLabel: { type: 'text', label: 'ARIA label (whole title)' },
        image: imageField('Background image URL'),
        scrollHref: { type: 'text', label: 'Scroll-cue anchor href' },
      },
      defaultProps: {
        eyebrow: 'About SFH',
        titleWords: [
          { word: 'Public', italic: false },
          { word: 'health,', italic: false },
          { word: 'for', italic: false },
          { word: 'millions', italic: true },
          { word: 'of', italic: false },
          { word: 'families', italic: false },
        ],
        ariaLabel: 'Public health, for millions of families',
        image: '/assets/clinic-checkup.jpg',
        scrollHref: '#about-feature',
      },
      render: ({ eyebrow, titleWords, ariaLabel, image, scrollHref }) => (
        <section className="aboutHero">
          <div className="aboutHero__media" aria-hidden="true">
            <img src={image} alt="" />
          </div>
          <div className="aboutHero__overlay" aria-hidden="true" />
          <div className="container aboutHero__panel">
            <span className="aboutHero__eyebrow">{eyebrow}</span>
            <h1 className="aboutHero__title" aria-label={ariaLabel}>
              {titleWords.map((w, i) => (
                <span key={i}>
                  {i > 0 && ' '}
                  <span className="word-mask" aria-hidden="true">
                    <span className="word">{w.italic ? <em>{w.word}</em> : w.word}</span>
                  </span>
                </span>
              ))}
            </h1>
          </div>
          <a href={scrollHref} className="aboutHero__scroll" aria-label="Scroll down">
            <span className="aboutHero__scroll-text">Scroll</span>
            <span className="aboutHero__scroll-line" aria-hidden="true" />
          </a>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    AboutFacts: {
      label: 'Facts strip (navy)',
      fields: {
        facts: {
          type: 'array',
          label: 'Facts',
          arrayFields: {
            number: { type: 'text', label: 'Number' },
            label: { type: 'text', label: 'Label' },
          },
          defaultItemProps: { number: '10+', label: 'Years' },
        },
      },
      defaultProps: {
        facts: [
          { number: '1985', label: 'Founded' },
          { number: '5', label: 'Countries' },
          { number: '5', label: 'Entities' },
          { number: '50M+', label: 'Reach / yr' },
        ],
      },
      render: ({ facts }) => (
        <section className="aboutFacts">
          <div className="container">
            <dl className="aboutFacts__grid">
              {facts.map((f, i) => (
                <div key={i}>
                  <dt>{f.label}</dt>
                  <dd>{f.number}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    AboutFeature: {
      label: 'Feature intro + numbered pillars',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        lede: { type: 'textarea', label: 'Lede paragraph' },
        signatureTitle: { type: 'text', label: 'Signature title' },
        signatureSub: { type: 'text', label: 'Signature subtitle' },
        pillars: {
          type: 'array',
          label: 'Pillars',
          arrayFields: {
            title: { type: 'text', label: 'Pillar title' },
            body: { type: 'textarea', label: 'Pillar body' },
          },
          defaultItemProps: { title: 'Pillar', body: 'Short description.' },
        },
      },
      defaultProps: {
        eyebrow: 'Who we are',
        title: 'One of West Africa’s largest public-health groups',
        lede: 'Founded in Nigeria in 1985, SFH operates today as a network of five country offices and four specialised programme entities — working alongside communities, governments, donors, and the private sector to bring quality, affordable health care to the families who need it most.',
        signatureTitle: 'Society for Family Health',
        signatureSub: 'Forty years of family-centred public health.',
        pillars: [
          { title: 'Vision', body: 'Healthy lives and wellbeing for all.' },
          { title: 'Mission', body: 'Improve health outcomes by ensuring communities — particularly the poor and vulnerable — have access to affordable quality health services to lead healthier lives.' },
          { title: 'Approach', body: 'Health system strengthening and total market approaches that unify the private and public sectors to scale an Essential Package of Health Services.' },
          { title: 'Reach', body: 'Four country offices — Nigeria, Ghana, Sierra Leone, and Liberia — reaching more than fifty million people across West Africa each year.' },
          { title: 'Partnership', body: 'Working hand-in-hand with communities, government ministries, donors, and the private sector — from frontline clinics to national policy.' },
        ],
      },
      render: ({ eyebrow, title, lede, signatureTitle, signatureSub, pillars }) => (
        <section className="aboutFeature" id="about-feature" data-reveal>
          <div className="container aboutFeature__intro">
            <span className="aboutFeature__eyebrow">{eyebrow}</span>
            <h2 className="aboutFeature__title">{title}</h2>
            <p className="aboutFeature__lede">{lede}</p>
            <span className="aboutFeature__accent" aria-hidden="true" />
            <p className="aboutFeature__signature">
              <strong>{signatureTitle}</strong>
              <span>{signatureSub}</span>
            </p>
          </div>
          <div className="container">
            <ol className="aboutFeature__pillars" aria-label="What defines">
              {pillars.map((p, i) => (
                <li key={i} className="afp">
                  <span className="afp__num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="afp__title">{p.title}</h3>
                  <p className="afp__body">{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    PeopleBand: {
      label: 'People band (Founders / Trustees / Leadership pattern)',
      fields: {
        variant: {
          type: 'radio',
          label: 'Band background',
          options: [
            { label: 'Surface (tinted)', value: 'surface' },
            { label: 'Default (white)', value: 'default' },
          ],
        },
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        lede: { type: 'textarea', label: 'Lede' },
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        people: {
          type: 'array',
          label: 'People',
          arrayFields: {
            name: { type: 'text', label: 'Name' },
            role: { type: 'text', label: 'Role' },
            photo: imageField('Photo URL'),
            personKey: { type: 'text', label: 'Bio key (optional)' },
          },
          defaultItemProps: { name: 'Name', role: 'Role', photo: '/assets/founders/placeholder.jpg' },
        },
      },
      defaultProps: {
        variant: 'default',
        eyebrow: 'People',
        title: 'A team',
        lede: 'Short intro line.',
        anchor: '',
        people: [],
      },
      render: ({ variant, eyebrow, title, lede, anchor, people }) => (
        <section
          className={variant === 'surface' ? 'band band--surface' : 'band'}
          id={anchor || undefined}
          data-reveal
        >
          <div className="container">
            <header className="band__head">
              <span className="band__eyebrow">{eyebrow}</span>
              <h2 className="band__title">{title}</h2>
              <p className="band__lede">{lede}</p>
            </header>
            <ul className="people">
              {people.map((p, i) => (
                <li
                  key={i}
                  className="person"
                  {...(p.personKey ? { 'data-person': p.personKey, tabIndex: 0, role: 'button', 'aria-haspopup': 'dialog' } : {})}
                >
                  <div className="person__photo">
                    <img className="person__photo-front" src={p.photo} alt={`Portrait of ${p.name}`} />
                    <img className="person__photo-back" src={p.photo} alt="" aria-hidden="true" />
                  </div>
                  <div className="person__body">
                    <h3 className="person__name">{p.name}</h3>
                    <p className="person__role">{p.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    Gallery: {
      label: 'Photo marquee (About gallery pattern)',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        lede: { type: 'textarea', label: 'Lede' },
        images: {
          type: 'array',
          label: 'Images',
          arrayFields: { src: imageField('Image URL') },
          defaultItemProps: { src: '/assets/about-carousel/c01.jpg' },
        },
      },
      defaultProps: {
        eyebrow: 'In the field',
        title: 'A look inside our work',
        lede: 'From clinics and field offices to community health drives across the region.',
        images: [
          { src: '/assets/about-carousel/c01.jpg' },
          { src: '/assets/about-carousel/c02.jpg' },
          { src: '/assets/about-carousel/c03.jpg' },
          { src: '/assets/about-carousel/c04.jpg' },
        ],
      },
      render: ({ eyebrow, title, lede, images }) => (
        <section className="aboutGallery" aria-label={title}>
          <div className="container">
            <header className="band__head aboutGallery__head">
              <span className="band__eyebrow">{eyebrow}</span>
              <h2 className="band__title">{title}</h2>
              <p className="band__lede">{lede}</p>
            </header>
          </div>
          <div className="aboutGallery__strip">
            <div className="aboutGallery__track">
              {images.map((img, i) => (
                <figure key={`orig-${i}`} className="aboutGallery__item">
                  <img src={img.src} alt="" />
                </figure>
              ))}
              {images.map((img, i) => (
                <figure key={`dup-${i}`} className="aboutGallery__item" aria-hidden="true">
                  <img src={img.src} alt="" />
                </figure>
              ))}
            </div>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    CountriesGrid: {
      label: 'Countries section (feature + grid)',
      fields: {
        headEyebrow: { type: 'text', label: 'Head eyebrow' },
        headTitle: { type: 'text', label: 'Head title' },
        headLede: { type: 'textarea', label: 'Head lede' },
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        feature: {
          type: 'object',
          label: 'Featured country (optional)',
          objectFields: {
            href: { type: 'text', label: 'Href' },
            ariaLabel: { type: 'text', label: 'ARIA label' },
            image: imageField('Image URL'),
            imageAlt: { type: 'text', label: 'Image alt' },
            flag: imageField('Flag URL'),
            eyebrow: { type: 'text', label: 'Eyebrow' },
            title: { type: 'text', label: 'Title' },
            desc: { type: 'textarea', label: 'Description' },
            ctaLabel: { type: 'text', label: 'CTA label' },
            stats: {
              type: 'array',
              label: 'Feature stats',
              arrayFields: {
                label: { type: 'text', label: 'Label' },
                value: { type: 'text', label: 'Value' },
              },
              defaultItemProps: { label: 'Label', value: 'Value' },
            },
          },
        },
        cards: {
          type: 'array',
          label: 'Country cards',
          arrayFields: {
            href: { type: 'text', label: 'Href' },
            flag: imageField('Flag URL'),
            eyebrow: { type: 'text', label: 'Eyebrow' },
            title: { type: 'text', label: 'Title' },
            desc: { type: 'textarea', label: 'Description' },
          },
          defaultItemProps: {
            href: '/countries/ghana',
            flag: '/v1/assets/flags/Flag_of_Ghana.png',
            eyebrow: 'Country office',
            title: 'SFH Country',
            desc: 'Short description.',
          },
        },
      },
      defaultProps: {
        headEyebrow: 'Our Countries',
        headTitle: 'Closer to home, in five countries',
        headLede: '',
        anchor: 'countries',
        feature: undefined,
        cards: [],
      },
      render: ({ headEyebrow, headTitle, headLede, anchor, feature, cards }) => (
        <section className="countries" id={anchor || undefined} data-reveal>
          <header className="container countries__head">
            <span className="countries__eyebrow">{headEyebrow}</span>
            <h2 className="countries__title">{headTitle}</h2>
            {headLede && <p className="countries__lede">{headLede}</p>}
          </header>
          <div className="container">
            {feature && feature.title && (
              <article className="countryFeature">
                <a
                  className="countryFeature__link"
                  href={feature.href}
                  target={feature.href.startsWith('http') ? '_blank' : undefined}
                  rel={feature.href.startsWith('http') ? 'noopener' : undefined}
                  aria-label={feature.ariaLabel}
                >
                  <figure className="countryFeature__media">
                    <img src={feature.image} alt={feature.imageAlt} />
                    {feature.flag && (
                      <span className="countryFeature__flag" aria-hidden="true">
                        <img src={feature.flag} alt="" />
                      </span>
                    )}
                  </figure>
                  <div className="countryFeature__body">
                    <span className="countryFeature__eyebrow">{feature.eyebrow}</span>
                    <h3 className="countryFeature__title">{feature.title}</h3>
                    <p className="countryFeature__desc">{feature.desc}</p>
                    {feature.stats && feature.stats.length > 0 && (
                      <dl className="countryFeature__stats">
                        {feature.stats.map((s, i) => (
                          <div key={i}>
                            <dt>{s.label}</dt>
                            <dd>{s.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {feature.ctaLabel && (
                      <span className="btn btn--cta countryFeature__cta">
                        {feature.ctaLabel}
                        <span className="countryFeature__cta-arrow" aria-hidden="true">↗</span>
                      </span>
                    )}
                  </div>
                </a>
              </article>
            )}

            {cards.length > 0 && (
              <ul
                className="countries__grid countries__grid--secondary"
                aria-label="Other country offices"
              >
                {cards.map((c, i) => (
                  <li key={i}>
                    <a href={c.href} className="ccard__link">
                      <div className="ccard__media">
                        <img className="ccard__flag" src={c.flag} alt="" />
                      </div>
                      <div className="ccard__body">
                        <span className="ccard__eyebrow">{c.eyebrow}</span>
                        <h3 className="ccard__title">{c.title}</h3>
                        <p className="ccard__desc">{c.desc}</p>
                        <span className="ccard__cta">
                          Learn more <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    CpageFeature: {
      label: 'Country feature (image + copy)',
      fields: {
        mediaSide: {
          type: 'radio',
          label: 'Image side',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        },
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        image: imageField('Image URL'),
        imageAlt: { type: 'text', label: 'Image alt' },
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        body: { type: 'textarea', label: 'Body (blank line = new paragraph)' },
      },
      defaultProps: {
        mediaSide: 'right',
        anchor: 'country-detail',
        image: '/assets/mother-twins.jpg',
        imageAlt: '',
        eyebrow: 'What we do',
        title: 'A proven model',
        body: 'Short paragraph.\n\nAnother paragraph.',
      },
      render: ({ mediaSide, anchor, image, imageAlt, eyebrow, title, body }) => (
        <section
          className={`cpageFeature cpageFeature--media-${mediaSide}`}
          id={anchor || undefined}
          data-reveal
        >
          <div className="container cpageFeature__grid">
            <div className="cpageFeature__media">
              <img src={image} alt={imageAlt} />
            </div>
            <div className="cpageFeature__body">
              <span className="cpageFeature__eyebrow">{eyebrow}</span>
              <h2 className="cpageFeature__title">{title}</h2>
              {body.split(/\n\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    CpageOffice: {
      label: 'Head-office card',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        city: { type: 'text', label: 'City / Country' },
        addressHtml: {
          type: 'textarea',
          label: 'Address HTML (raw · use <br /> and <a>)',
        },
        ctaLabel: { type: 'text', label: 'CTA label' },
        ctaHref: { type: 'text', label: 'CTA href' },
      },
      defaultProps: {
        eyebrow: 'Head office',
        city: 'City, Country',
        addressHtml: 'SFH Country<br />Street address<br />City',
        ctaLabel: 'Get in touch',
        ctaHref: '/contact',
      },
      render: ({ eyebrow, city, addressHtml, ctaLabel, ctaHref }) => (
        <section className="cpageOffice" data-reveal>
          <div className="container cpageOffice__inner">
            <span className="cpageOffice__eyebrow">{eyebrow}</span>
            <h2 className="cpageOffice__city">{city}</h2>
            <address
              className="cpageOffice__address"
              dangerouslySetInnerHTML={{ __html: addressHtml }}
            />
            <a className="cpageOffice__cta" href={ctaHref}>
              {ctaLabel}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    CountriesEditorial: {
      label: 'Countries editorial (alternating rows)',
      fields: {
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        lede: { type: 'textarea', label: 'Head lede' },
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        rows: {
          type: 'array',
          label: 'Country rows',
          arrayFields: {
            index: { type: 'text', label: 'Index (01, 02, …)' },
            flag: imageField('Flag URL'),
            name: { type: 'text', label: 'Country name' },
            meta: { type: 'text', label: 'Meta line' },
            lede: { type: 'textarea', label: 'Lede paragraph' },
            image: imageField('Image URL'),
            imageAlt: { type: 'text', label: 'Image alt' },
            ctaLabel: { type: 'text', label: 'CTA label' },
            ctaHref: { type: 'text', label: 'CTA href' },
            ctaExternal: {
              type: 'radio',
              label: 'External link?',
              options: [
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ],
            },
            stats: {
              type: 'array',
              label: 'Stats',
              arrayFields: {
                label: { type: 'text', label: 'Label' },
                value: { type: 'text', label: 'Value' },
              },
              defaultItemProps: { label: 'Label', value: 'Value' },
            },
          },
          defaultItemProps: {
            index: '01',
            flag: '',
            name: 'Country',
            meta: '',
            lede: '',
            image: '',
            imageAlt: '',
            ctaLabel: 'Learn more',
            ctaHref: '/',
            ctaExternal: false,
            stats: [],
          },
        },
      },
      defaultProps: {
        eyebrow: 'By country',
        title: 'Local to the work',
        lede: '',
        anchor: 'country-list',
        rows: [],
      },
      render: ({ eyebrow, title, lede, anchor, rows }) => (
        <section
          className="countriesEditorial"
          id={anchor || undefined}
          data-reveal
        >
          <div className="container countriesEditorial__head">
            <span className="countriesEditorial__eyebrow">{eyebrow}</span>
            <h2 className="countriesEditorial__title">{title}</h2>
            {lede && <p className="countriesEditorial__lede">{lede}</p>}
          </div>
          <div className="container">
            <ol className="countriesEditorial__list" role="list">
              {rows.map((r, i) => {
                const imgLeft = i % 2 === 0;
                return (
                  <li
                    key={i}
                    className={`countryRow ${imgLeft ? 'countryRow--imgLeft' : 'countryRow--imgRight'}`}
                    data-reveal
                  >
                    <div className="countryRow__media">
                      <img src={r.image} alt={r.imageAlt} />
                    </div>
                    <div className="countryRow__body">
                      <span className="countryRow__index" aria-hidden="true">{r.index}</span>
                      <div className="countryRow__head">
                        {r.flag && <img className="countryRow__flag" src={r.flag} alt="" />}
                        <h3 className="countryRow__name">{r.name}</h3>
                      </div>
                      {r.meta && <p className="countryRow__meta">{r.meta}</p>}
                      <p className="countryRow__lede">{r.lede}</p>
                      {r.stats && r.stats.length > 0 && (
                        <dl className="countryRow__stats">
                          {r.stats.map((s, j) => (
                            <div key={j}>
                              <dt>{s.label}</dt>
                              <dd>{s.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <a
                        className="btn btn--cta"
                        href={r.ctaHref}
                        target={r.ctaExternal ? '_blank' : undefined}
                        rel={r.ctaExternal ? 'noopener' : undefined}
                      >
                        {r.ctaLabel}
                        <span aria-hidden="true">{r.ctaExternal ? '↗' : '→'}</span>
                      </a>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    CpageIntro: {
      label: 'Interior page intro band',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        lede: { type: 'textarea', label: 'Lede paragraph' },
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
      },
      defaultProps: {
        eyebrow: '',
        title: 'Section title',
        lede: 'Short intro paragraph.',
        anchor: '',
      },
      render: ({ eyebrow, title, lede, anchor }) => (
        <section className="cpage__body" id={anchor || undefined}>
          <div className="container prod__intro">
            {eyebrow && <span className="prod__eyebrow">{eyebrow}</span>}
            <h2 className="prod__intro-title">{title}</h2>
            {lede && <p className="prod__intro-lede">{lede}</p>}
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    EntitiesEditorial: {
      label: 'Entities editorial (alternating rows)',
      fields: {
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        lede: { type: 'textarea', label: 'Head lede' },
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        rows: {
          type: 'array',
          label: 'Entities',
          arrayFields: {
            index: { type: 'text', label: 'Index (or empty to hide)' },
            name: { type: 'text', label: 'Entity name' },
            meta: { type: 'text', label: 'Meta line' },
            lede: { type: 'textarea', label: 'Lede' },
            image: imageField('Image URL'),
            imageAlt: { type: 'text', label: 'Image alt' },
            anchor: { type: 'text', label: 'Row anchor id (optional)' },
            ctaLabel: { type: 'text', label: 'CTA label (optional)' },
            ctaHref: { type: 'text', label: 'CTA href (optional)' },
            ctaExternal: {
              type: 'radio',
              label: 'External link?',
              options: [
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ],
            },
            stats: {
              type: 'array',
              label: 'Stats',
              arrayFields: {
                label: { type: 'text', label: 'Label' },
                value: { type: 'text', label: 'Value' },
              },
              defaultItemProps: { label: 'Label', value: 'Value' },
            },
          },
          defaultItemProps: {
            index: '01',
            name: 'Entity',
            meta: '',
            lede: '',
            image: '',
            imageAlt: '',
            anchor: '',
            ctaLabel: '',
            ctaHref: '',
            ctaExternal: false,
            stats: [],
          },
        },
      },
      defaultProps: {
        eyebrow: 'By entity',
        title: 'Specialised, but never separate',
        lede: '',
        anchor: 'entity-list',
        rows: [],
      },
      render: ({ eyebrow, title, lede, anchor, rows }) => (
        <section
          className="entitiesEditorial"
          id={anchor || undefined}
          data-reveal
        >
          <div className="container entitiesEditorial__head">
            <span className="entitiesEditorial__eyebrow">{eyebrow}</span>
            <h2 className="entitiesEditorial__title">{title}</h2>
            {lede && <p className="entitiesEditorial__lede">{lede}</p>}
          </div>
          <div className="container">
            <ol className="entitiesEditorial__list" role="list">
              {rows.map((r, i) => {
                const imgLeft = i % 2 === 0;
                return (
                  <li
                    key={i}
                    id={r.anchor || undefined}
                    className={`entityRow ${imgLeft ? 'entityRow--imgLeft' : 'entityRow--imgRight'}`}
                    data-reveal
                  >
                    <div className="entityRow__media">
                      <img src={r.image} alt={r.imageAlt} />
                    </div>
                    <div className="entityRow__body">
                      {r.index && (
                        <span className="entityRow__index" aria-hidden="true">
                          {r.index}
                        </span>
                      )}
                      <div className="entityRow__head">
                        <h3 className="entityRow__name">{r.name}</h3>
                      </div>
                      {r.meta && <p className="entityRow__meta">{r.meta}</p>}
                      <p className="entityRow__lede">{r.lede}</p>
                      {r.stats && r.stats.length > 0 && (
                        <dl className="entityRow__stats">
                          {r.stats.map((s, j) => (
                            <div key={j}>
                              <dt>{s.label}</dt>
                              <dd>{s.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {r.ctaLabel && r.ctaHref && (
                        <a
                          className="btn btn--cta"
                          href={r.ctaHref}
                          target={r.ctaExternal ? '_blank' : undefined}
                          rel={r.ctaExternal ? 'noopener' : undefined}
                        >
                          {r.ctaLabel}
                          <span aria-hidden="true">{r.ctaExternal ? '↗' : '→'}</span>
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    RawHtmlSection: {
      label: 'Raw HTML section (escape hatch)',
      fields: {
        html: { type: 'textarea', label: 'HTML body' },
        containerClass: { type: 'text', label: 'Wrapper class (default: legalDoc)' },
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
      },
      defaultProps: {
        html: '<div class="container"><p>Raw HTML goes here.</p></div>',
        containerClass: 'legalDoc',
        anchor: '',
      },
      render: ({ html, containerClass, anchor }) => (
        <section
          className={containerClass || 'legalDoc'}
          id={anchor || undefined}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ),
    },

    // -----------------------------------------------------------------
    ReportsFeat: {
      label: 'Reports · featured report card',
      fields: {
        coverYearVariant: {
          type: 'text',
          label: 'Cover year variant class (e.g. y2025)',
        },
        coverTitle: { type: 'text', label: 'Cover title' },
        badge: { type: 'text', label: 'Cover badge' },
        eyebrow: { type: 'text', label: 'Body eyebrow' },
        title: { type: 'text', label: 'Body title' },
        lede: { type: 'textarea', label: 'Body lede' },
        pdfLabel: { type: 'text', label: 'PDF download label' },
        pdfHref: { type: 'text', label: 'PDF download URL' },
        stats: {
          type: 'array',
          label: 'Stats',
          arrayFields: {
            label: { type: 'text', label: 'Label' },
            value: { type: 'text', label: 'Value' },
          },
          defaultItemProps: { label: 'Pages', value: '24' },
        },
      },
      defaultProps: {
        coverYearVariant: 'y2025',
        coverTitle: 'Cover title',
        badge: 'Latest',
        eyebrow: 'Latest annual report',
        title: '2025 Annual Report',
        lede: '',
        stats: [],
        pdfLabel: 'Download PDF',
        pdfHref: '#',
      },
      render: ({ coverYearVariant, coverTitle, badge, eyebrow, title, lede, stats, pdfLabel, pdfHref }) => (
        <section className="reportsFeat" aria-labelledby="reportsFeat-title">
          <div className="container">
            <div className="reportsFeat__card">
              <div className={`reportsFeat__cover reportsFeat__cover--${coverYearVariant}`}>
                <h3 className="reportsFeat__coverTitle">{coverTitle}</h3>
                {badge && <span className="reportsFeat__coverBadge">{badge}</span>}
              </div>
              <div className="reportsFeat__body">
                <span className="reportsFeat__eyebrow">{eyebrow}</span>
                <h2 id="reportsFeat-title" className="reportsFeat__title">{title}</h2>
                <p className="reportsFeat__lede">{lede}</p>
                {stats.length > 0 && (
                  <dl className="reportsFeat__stats">
                    {stats.map((s, i) => (
                      <div key={i}>
                        <dt>{s.label}</dt>
                        <dd>{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="reportsFeat__actions">
                  <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="btn btn--cta">
                    {pdfLabel} <span aria-hidden="true">↓</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ReportsList: {
      label: 'Reports · past reports grid',
      fields: {
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        lede: { type: 'textarea', label: 'Head lede' },
        reports: {
          type: 'array',
          label: 'Past reports',
          arrayFields: {
            yearVariant: { type: 'text', label: 'Year variant class (e.g. y2024)' },
            year: { type: 'text', label: 'Year' },
            coverTitle: { type: 'text', label: 'Cover title' },
            bodyTitle: { type: 'text', label: 'Body title' },
            summary: { type: 'textarea', label: 'Summary' },
            href: { type: 'text', label: 'PDF URL' },
          },
          defaultItemProps: {
            yearVariant: 'y2024',
            year: '2024',
            coverTitle: '',
            bodyTitle: '2024 Annual Report',
            summary: '',
            href: '#',
          },
        },
      },
      defaultProps: {
        eyebrow: 'Past reports',
        title: 'Every year on the record',
        lede: '',
        reports: [],
      },
      render: ({ eyebrow, title, lede, reports }) => (
        <section className="reportsList" aria-labelledby="reportsList-title">
          <div className="container">
            <header className="impact__sectionhead reportsList__head">
              <span className="impact__sectioneyebrow">{eyebrow}</span>
              <h2 id="reportsList-title" className="impact__sectiontitle">{title}</h2>
              {lede && <p className="impact__sectionlede">{lede}</p>}
            </header>
            <ul className="reports">
              {reports.map((r, i) => (
                <li key={i} className="rcard">
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rcard__link"
                    aria-label={`Download ${r.bodyTitle}`}
                  >
                    <div className={`rcard__cover rcard__cover--${r.yearVariant}`}>
                      <span className="rcard__year">{r.year}</span>
                      <h3 className="rcard__cover-title">{r.coverTitle}</h3>
                    </div>
                    <div className="rcard__body">
                      <h4 className="rcard__title">{r.bodyTitle}</h4>
                      <p className="rcard__summary">{r.summary}</p>
                      <span className="rcard__cta">Download PDF <span aria-hidden="true">↓</span></span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ReportsArchive: {
      label: 'Reports · archive note',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        lede: { type: 'textarea', label: 'Lede' },
        ctaLabel: { type: 'text', label: 'CTA label' },
        ctaHref: { type: 'text', label: 'CTA href' },
      },
      defaultProps: {
        eyebrow: 'Earlier reports',
        title: '1985 – 2019 archive',
        lede: '',
        ctaLabel: 'Request the archive',
        ctaHref: 'mailto:governance@sfhgroup.org',
      },
      render: ({ eyebrow, title, lede, ctaLabel, ctaHref }) => (
        <section className="reportsArchive">
          <div className="container reportsArchive__inner">
            <div>
              <span className="reportsArchive__eyebrow">{eyebrow}</span>
              <h3 className="reportsArchive__title">{title}</h3>
              <p className="reportsArchive__lede">{lede}</p>
            </div>
            <a href={ctaHref} className="btn btn--cta reportsArchive__cta">
              {ctaLabel} <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ProductPlatforms: {
      label: 'Products · platforms (feature cards)',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        platforms: {
          type: 'array',
          label: 'Platforms',
          arrayFields: {
            reverse: {
              type: 'radio',
              label: 'Reverse layout?',
              options: [
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ],
            },
            href: { type: 'text', label: 'Link URL' },
            ariaLabel: { type: 'text', label: 'ARIA label' },
            image: imageField('Image URL'),
            imageAlt: { type: 'text', label: 'Image alt' },
            eyebrow: { type: 'text', label: 'Eyebrow' },
            title: { type: 'text', label: 'Title' },
            desc: { type: 'textarea', label: 'Description' },
            ctaLabel: { type: 'text', label: 'CTA label' },
          },
          defaultItemProps: {
            reverse: false,
            href: '#',
            ariaLabel: '',
            image: '',
            imageAlt: '',
            eyebrow: '',
            title: 'Platform',
            desc: '',
            ctaLabel: 'Visit',
          },
        },
      },
      defaultProps: {
        anchor: '',
        platforms: [],
      },
      render: ({ anchor, platforms }) => (
        <section className="productPlatforms" id={anchor || undefined} data-reveal>
          <div className="container">
            {platforms.map((p, i) => (
              <article
                key={i}
                className={`countryFeature productPlatform${p.reverse ? ' productPlatform--reverse' : ''}`}
              >
                <a
                  className="countryFeature__link"
                  href={p.href}
                  target={p.href.startsWith('http') ? '_blank' : undefined}
                  rel={p.href.startsWith('http') ? 'noopener' : undefined}
                  aria-label={p.ariaLabel}
                >
                  <figure className="countryFeature__media">
                    <img src={p.image} alt={p.imageAlt} />
                  </figure>
                  <div className="countryFeature__body">
                    <span className="countryFeature__eyebrow">{p.eyebrow}</span>
                    <h3 className="countryFeature__title">{p.title}</h3>
                    <p className="countryFeature__desc">{p.desc}</p>
                    <span className="btn btn--cta countryFeature__cta">
                      {p.ctaLabel}
                      <span className="countryFeature__cta-arrow" aria-hidden="true">↗</span>
                    </span>
                  </div>
                </a>
              </article>
            ))}
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ProductsSpotlight: {
      label: 'Products · spotlight grid',
      fields: {
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        lede: { type: 'textarea', label: 'Head lede' },
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        ctaLabel: { type: 'text', label: 'Footer CTA label' },
        ctaHref: { type: 'text', label: 'Footer CTA href' },
        products: {
          type: 'array',
          label: 'Products',
          arrayFields: {
            href: { type: 'text', label: 'Link URL' },
            image: imageField('Image URL'),
            imageAlt: { type: 'text', label: 'Image alt' },
            categoryLabel: { type: 'text', label: 'Category label' },
            categoryKey: { type: 'text', label: 'Category key (data-cat)' },
            title: { type: 'text', label: 'Product title' },
            desc: { type: 'textarea', label: 'Description' },
          },
          defaultItemProps: {
            href: '#',
            image: '',
            imageAlt: '',
            categoryLabel: 'Sexual health',
            categoryKey: 'sexual',
            title: 'Product',
            desc: '',
          },
        },
      },
      defaultProps: {
        eyebrow: 'SFH Brands',
        title: 'Flagship health brands',
        lede: '',
        anchor: 'brands',
        ctaLabel: 'Visit SFH Access',
        ctaHref: 'https://shop.sfhaccess.com',
        products: [],
      },
      render: ({ eyebrow, title, lede, anchor, ctaLabel, ctaHref, products }) => (
        <section className="productsSpotlight" id={anchor || undefined} data-reveal>
          <header className="container productsSpotlight__head">
            <span className="productsSpotlight__eyebrow">{eyebrow}</span>
            <h2 className="productsSpotlight__title">{title}</h2>
            {lede && <p className="productsSpotlight__lede">{lede}</p>}
          </header>
          <div className="container">
            <ul className="productsSpotlight__grid" aria-label="Featured SFH product brands">
              {products.map((p, i) => (
                <li key={i} className="pcard">
                  <a
                    className="pcard__link"
                    href={p.href}
                    target={p.href.startsWith('http') ? '_blank' : undefined}
                    rel={p.href.startsWith('http') ? 'noopener' : undefined}
                    aria-label={p.title}
                  >
                    <div className="pcard__media">
                      <img src={p.image} alt={p.imageAlt} loading="lazy" />
                    </div>
                    <div className="pcard__content">
                      <span className="pcard__category" data-cat={p.categoryKey}>
                        {p.categoryLabel}
                      </span>
                      <h3 className="pcard__title">{p.title}</h3>
                      <p className="pcard__desc">{p.desc}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
            {ctaLabel && ctaHref && (
              <div className="productsSpotlight__ctaWrap">
                <a
                  href={ctaHref}
                  target={ctaHref.startsWith('http') ? '_blank' : undefined}
                  rel={ctaHref.startsWith('http') ? 'noopener' : undefined}
                  className="btn btn--cta"
                >
                  {ctaLabel}
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            )}
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ImpactDeliver: {
      label: 'Impact · delivery pillars (rows)',
      fields: {
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        lede: { type: 'textarea', label: 'Head lede' },
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        rows: {
          type: 'array',
          label: 'Pillars',
          arrayFields: {
            index: { type: 'text', label: 'Index (e.g. 01)' },
            name: { type: 'text', label: 'Pillar name' },
            meta: { type: 'text', label: 'Meta line' },
            lede: { type: 'textarea', label: 'Lede' },
            image: imageField('Image URL'),
            imageAlt: { type: 'text', label: 'Image alt' },
            ctaLabel: { type: 'text', label: 'CTA label (optional)' },
            ctaHref: { type: 'text', label: 'CTA href (optional)' },
            ctaExternal: {
              type: 'radio',
              label: 'External link?',
              options: [
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ],
            },
          },
          defaultItemProps: {
            index: '01',
            name: 'Pillar',
            meta: '',
            lede: '',
            image: '',
            imageAlt: '',
            ctaLabel: '',
            ctaHref: '',
            ctaExternal: false,
          },
        },
      },
      defaultProps: {
        eyebrow: 'What we deliver',
        title: 'Four decades, four pillars',
        lede: '',
        anchor: 'impact-intro',
        rows: [],
      },
      render: ({ eyebrow, title, lede, anchor, rows }) => (
        <section className="impactDeliver" id={anchor || undefined}>
          <div className="container">
            <header className="impact__sectionhead impactDeliver__head">
              <span className="impact__sectioneyebrow">{eyebrow}</span>
              <h2 className="impact__sectiontitle">{title}</h2>
              {lede && <p className="impact__sectionlede">{lede}</p>}
            </header>
            <ol className="impactDeliver__rows" aria-label="Delivery pillars">
              {rows.map((r, i) => {
                const imgLeft = i % 2 === 0;
                return (
                  <li
                    key={i}
                    className={`impactDeliver__row ${imgLeft ? 'impactDeliver__row--imgLeft' : 'impactDeliver__row--imgRight'}`}
                    data-reveal
                  >
                    <div className="impactDeliver__media">
                      <img src={r.image} alt={r.imageAlt} loading="lazy" />
                    </div>
                    <div className="impactDeliver__body">
                      <span className="impactDeliver__index" aria-hidden="true">
                        {r.index}
                      </span>
                      <h3 className="impactDeliver__name">{r.name}</h3>
                      {r.meta && <p className="impactDeliver__meta">{r.meta}</p>}
                      <p className="impactDeliver__lede">{r.lede}</p>
                      {r.ctaLabel && r.ctaHref && (
                        <a
                          href={r.ctaHref}
                          target={r.ctaExternal ? '_blank' : undefined}
                          rel={r.ctaExternal ? 'noopener' : undefined}
                          className="btn btn--cta"
                        >
                          {r.ctaLabel}
                          <span aria-hidden="true">{r.ctaExternal ? '↗' : '→'}</span>
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ImpactKeyResults: {
      label: 'Impact · key results (hero stat + cards)',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        lede: { type: 'textarea', label: 'Head lede' },
        heroImage: imageField('Hero background image URL'),
        heroEyebrow: { type: 'text', label: 'Hero eyebrow' },
        heroNum: { type: 'text', label: 'Hero number' },
        heroLabel: { type: 'text', label: 'Hero label' },
        heroDesc: { type: 'textarea', label: 'Hero description' },
        cards: {
          type: 'array',
          label: 'Supporting cards',
          arrayFields: {
            sub: { type: 'text', label: 'Sub label' },
            num: { type: 'text', label: 'Number' },
            label: { type: 'text', label: 'Label' },
          },
          defaultItemProps: { sub: 'Each year', num: '10K+', label: 'Label' },
        },
        footHtml: {
          type: 'textarea',
          label: 'Footer text (HTML allowed)',
        },
      },
      defaultProps: {
        anchor: 'key-results',
        eyebrow: 'Key results',
        title: 'Outcomes that compound',
        lede: '',
        heroImage: '',
        heroEyebrow: 'Each year',
        heroNum: '50M+',
        heroLabel: 'Lives reached.',
        heroDesc: '',
        cards: [],
        footHtml: '',
      },
      render: ({ anchor, eyebrow, title, lede, heroImage, heroEyebrow, heroNum, heroLabel, heroDesc, cards, footHtml }) => (
        <section className="aboutFacts impactKR" id={anchor || undefined} aria-label={title}>
          <div className="container">
            <header className="impact__sectionhead impactKR__head">
              <span className="impact__sectioneyebrow">{eyebrow}</span>
              <h2 className="impact__sectiontitle">{title}</h2>
              {lede && <p className="impact__sectionlede">{lede}</p>}
            </header>
            <div className="impactKR__mosaic">
              <article className="impactKR__hero">
                {heroImage && (
                  <img className="impactKR__heroBg" src={heroImage} alt="" loading="lazy" />
                )}
                <div className="impactKR__heroOverlay" aria-hidden="true" />
                <div className="impactKR__heroContent">
                  {heroEyebrow && <span className="impactKR__heroEyebrow">{heroEyebrow}</span>}
                  <span className="impactKR__heroNum">{heroNum}</span>
                  <span className="impactKR__heroLabel">{heroLabel}</span>
                  {heroDesc && <p className="impactKR__heroDesc">{heroDesc}</p>}
                </div>
              </article>
              <ul className="impactKR__cards" aria-label="Supporting results">
                {cards.map((c, i) => (
                  <li key={i} className="impactKR__card">
                    {c.sub && <span className="impactKR__cardSub">{c.sub}</span>}
                    <span className="impactKR__cardNum">{c.num}</span>
                    <span className="impactKR__cardLabel">{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            {footHtml && (
              <p
                className="impactKR__foot"
                dangerouslySetInnerHTML={{ __html: footHtml }}
              />
            )}
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ImpactProgrammes: {
      label: 'Impact · programmes (featured + supporting)',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        lede: { type: 'textarea', label: 'Head lede' },
        supportingHeadEyebrow: {
          type: 'text',
          label: 'Supporting-section eyebrow',
        },
        featured: {
          type: 'array',
          label: 'Featured programmes',
          arrayFields: {
            index: { type: 'text', label: 'Index' },
            title: { type: 'text', label: 'Title' },
            lede: { type: 'textarea', label: 'Lede' },
            image: imageField('Image URL'),
            imageAlt: { type: 'text', label: 'Image alt' },
            href: { type: 'text', label: 'Link URL' },
          },
          defaultItemProps: {
            index: '01',
            title: 'Programme',
            lede: '',
            image: '',
            imageAlt: '',
            href: '#',
          },
        },
        supporting: {
          type: 'array',
          label: 'Supporting programmes',
          arrayFields: {
            index: { type: 'text', label: 'Index' },
            title: { type: 'text', label: 'Title' },
            lede: { type: 'textarea', label: 'Lede' },
            image: imageField('Image URL'),
            imageAlt: { type: 'text', label: 'Image alt' },
          },
          defaultItemProps: {
            index: '05',
            title: 'Programme',
            lede: '',
            image: '',
            imageAlt: '',
          },
        },
      },
      defaultProps: {
        anchor: 'programmes',
        eyebrow: 'Programmes',
        title: 'Eight thematic areas. One operating model',
        lede: '',
        supportingHeadEyebrow: 'Supporting programmes',
        featured: [],
        supporting: [],
      },
      render: ({ anchor, eyebrow, title, lede, supportingHeadEyebrow, featured, supporting }) => (
        <section className="impact__programmes" id={anchor || undefined}>
          <div className="container">
            <header className="impact__sectionhead">
              <span className="impact__sectioneyebrow">{eyebrow}</span>
              <h2 className="impact__sectiontitle">{title}</h2>
              {lede && <p className="impact__sectionlede">{lede}</p>}
            </header>

            {featured.length > 0 && (
              <ul className="impactProg__featured" aria-label="Flagship programmes">
                {featured.map((f, i) => (
                  <li key={i} className="impactProg__fcard">
                    <a
                      href={f.href}
                      className="impactProg__fcard-link"
                      aria-label={f.title}
                    >
                      <div className="impactProg__fcard-media">
                        <img src={f.image} alt={f.imageAlt} loading="lazy" />
                        <span className="impactProg__fcard-num">{f.index}</span>
                      </div>
                      <div className="impactProg__fcard-body">
                        <h3 className="impactProg__fcard-title">{f.title}</h3>
                        <p className="impactProg__fcard-lede">{f.lede}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {supporting.length > 0 && (
              <>
                <div className="impactProg__supportHead">
                  <span className="impact__sectioneyebrow">{supportingHeadEyebrow}</span>
                </div>
                <ul className="impactProg__support" aria-label="Supporting programmes">
                  {supporting.map((s, i) => (
                    <li key={i} className="impactProg__scard">
                      <div className="impactProg__scard-media">
                        <img src={s.image} alt={s.imageAlt} loading="lazy" />
                        <span className="impactProg__scard-num" aria-hidden="true">
                          {s.index}
                        </span>
                      </div>
                      <div className="impactProg__scard-body">
                        <h3 className="impactProg__scard-title">{s.title}</h3>
                        <p className="impactProg__scard-lede">{s.lede}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ImpactResearch: {
      label: 'Impact · research + library card',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        eyebrow: { type: 'text', label: 'Copy eyebrow' },
        title: { type: 'text', label: 'Copy title' },
        body: { type: 'textarea', label: 'Copy body (blank line = new paragraph)' },
        types: {
          type: 'array',
          label: 'Content-type bullets',
          arrayFields: {
            value: { type: 'text', label: 'Bullet' },
          },
          defaultItemProps: { value: 'Type' },
        },
        cardEyebrow: { type: 'text', label: 'Card eyebrow' },
        cardTitle: { type: 'text', label: 'Card title' },
        cardBody: { type: 'textarea', label: 'Card body' },
        cardCtaLabel: { type: 'text', label: 'Card primary CTA label' },
        cardCtaHref: { type: 'text', label: 'Card primary CTA href' },
        cardSubLinkLabel: { type: 'text', label: 'Card sub-link label' },
        cardSubLinkHref: { type: 'text', label: 'Card sub-link href' },
      },
      defaultProps: {
        anchor: 'research',
        eyebrow: 'Research & publications',
        title: 'Evidence from the field, published openly',
        body: '',
        types: [],
        cardEyebrow: 'Library',
        cardTitle: 'Browse the SFH library',
        cardBody: '',
        cardCtaLabel: 'Annual reports',
        cardCtaHref: '/reports',
        cardSubLinkLabel: 'Press releases',
        cardSubLinkHref: '/press',
      },
      render: ({ anchor, eyebrow, title, body, types, cardEyebrow, cardTitle, cardBody, cardCtaLabel, cardCtaHref, cardSubLinkLabel, cardSubLinkHref }) => (
        <section className="impact__research" id={anchor || undefined}>
          <div className="container impact__researchGrid">
            <div className="impact__researchCopy">
              <span className="prod__eyebrow">{eyebrow}</span>
              <h2 className="impact__sectiontitle">{title}</h2>
              {body.split(/\n\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {types.length > 0 && (
                <ul className="impact__researchTypes">
                  {types.map((t, i) => (
                    <li key={i}>{t.value}</li>
                  ))}
                </ul>
              )}
            </div>
            <aside className="impact__researchCard">
              <span className="impact__researchEyebrow">{cardEyebrow}</span>
              <h3>{cardTitle}</h3>
              <p>{cardBody}</p>
              <a href={cardCtaHref} className="btn btn--cta">
                {cardCtaLabel} <span aria-hidden="true">→</span>
              </a>
              {cardSubLinkLabel && cardSubLinkHref && (
                <a href={cardSubLinkHref} className="impact__researchLink">
                  {cardSubLinkLabel} <span aria-hidden="true">→</span>
                </a>
              )}
            </aside>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    HeroCarousel: {
      label: 'Homepage · hero carousel',
      fields: {
        scrollHref: { type: 'text', label: 'Scroll cue anchor href' },
        slides: {
          type: 'array',
          label: 'Slides',
          arrayFields: {
            image: imageField('Image URL'),
            tag: { type: 'text', label: 'Tag pill' },
            titleLine1: { type: 'text', label: 'Title line 1 (before <br />)' },
            titleLine2Em: { type: 'text', label: 'Title line 2 (italic)' },
            lede: { type: 'textarea', label: 'Lede' },
            ctaLabel: { type: 'text', label: 'CTA label' },
            ctaHref: { type: 'text', label: 'CTA href' },
          },
          defaultItemProps: {
            image: '',
            tag: 'SFH',
            titleLine1: 'Public health,',
            titleLine2Em: 'multiplied',
            lede: '',
            ctaLabel: 'Explore',
            ctaHref: '#',
          },
        },
      },
      defaultProps: {
        scrollHref: '#about',
        slides: [],
      },
      render: ({ scrollHref, slides }) => (
        <section className="hero" data-reveal data-hero-carousel>
          <div className="hero__media" aria-hidden="true">
            {slides.map((s, i) => (
              <img
                key={i}
                className="hero__slide"
                data-index={i}
                data-active={i === 0 ? 'true' : undefined}
                src={s.image}
                alt=""
              />
            ))}
          </div>
          <div className="hero__overlay" aria-hidden="true" />
          <div className="hero__panel-stack">
            <div className="container hero__panel-container">
              {slides.map((s, i) => (
                <div
                  key={i}
                  className="hero__slide-panel"
                  data-index={i}
                  data-active={i === 0 ? 'true' : undefined}
                >
                  <span className="hero__tag">
                    <span className="hero__tag-dot" aria-hidden="true" />
                    {s.tag}
                  </span>
                  <h1 className="hero__title">
                    {s.titleLine1}
                    <br />
                    <em>{s.titleLine2Em}</em>
                  </h1>
                  <p className="hero__lede">{s.lede}</p>
                  {s.ctaLabel && s.ctaHref && (
                    <div className="hero__cta-row">
                      <a href={s.ctaHref} className="hero__cta">
                        {s.ctaLabel}
                        <span className="hero__cta-arrow" aria-hidden="true">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            width="14"
                            height="14"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="13 6 19 12 13 18" />
                          </svg>
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="hero__dots" role="tablist" aria-label="Hero slides">
            {slides.map((_, i) => (
              <button
                key={i}
                className="hero__dot"
                type="button"
                data-index={i}
                data-active={i === 0 ? 'true' : undefined}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === 0 ? 'true' : undefined}
              />
            ))}
          </div>
          <a href={scrollHref} className="hero__scroll" aria-label="Scroll down">
            <span className="hero__scroll-text">Scroll</span>
            <span className="hero__scroll-line" aria-hidden="true" />
          </a>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    StatsStrip: {
      label: 'Homepage · stats strip',
      fields: {
        ariaLabel: { type: 'text', label: 'ARIA label' },
        stats: {
          type: 'array',
          label: 'Stats',
          arrayFields: {
            num: { type: 'text', label: 'Number' },
            label: { type: 'text', label: 'Label' },
          },
          defaultItemProps: { num: '40+', label: 'Years' },
        },
      },
      defaultProps: {
        ariaLabel: 'SFH at a glance',
        stats: [],
      },
      render: ({ ariaLabel, stats }) => (
        <section className="stats" aria-label={ariaLabel}>
          <div className="container">
            <ul className="stats__grid">
              {stats.map((s, i) => (
                <li key={i} className="stat">
                  <strong className="stat__num">{s.num}</strong>
                  <span className="stat__label">{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    WhoBand: {
      label: 'Homepage · who / about band',
      fields: {
        centered: {
          type: 'radio',
          label: 'Centered variant?',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        anchor: { type: 'text', label: 'Section anchor id' },
        title: { type: 'text', label: 'Title' },
        lede: { type: 'textarea', label: 'Lede' },
        ctaLabel: { type: 'text', label: 'CTA label' },
        ctaHref: { type: 'text', label: 'CTA href' },
      },
      defaultProps: {
        centered: true,
        anchor: 'about',
        title: 'Section title',
        lede: '',
        ctaLabel: 'Read our story',
        ctaHref: '/about',
      },
      render: ({ centered, anchor, title, lede, ctaLabel, ctaHref }) => (
        <section
          className={`who${centered ? ' who--centered' : ''}`}
          id={anchor || undefined}
          data-reveal
        >
          <div className="container who__inner">
            <div className="who__copy">
              <h2 className="who__title">{title}</h2>
              <p className="who__lede">{lede}</p>
              {ctaLabel && ctaHref && (
                <a href={ctaHref} className="btn btn--cta who__cta">
                  {ctaLabel}
                  <span aria-hidden="true">→</span>
                </a>
              )}
            </div>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    VisionMission: {
      label: 'Homepage · vision + mission split',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        visionLabel: { type: 'text', label: 'Vision label' },
        visionStatementHtml: {
          type: 'textarea',
          label: 'Vision statement (HTML allowed for <em>)',
        },
        missionLabel: { type: 'text', label: 'Mission label' },
        missionStatementHtml: {
          type: 'textarea',
          label: 'Mission statement (HTML allowed for <em>)',
        },
        ctaLabel: { type: 'text', label: 'CTA label' },
        ctaHref: { type: 'text', label: 'CTA href' },
        primaryImage: imageField('Primary image URL'),
        primaryImageAlt: { type: 'text', label: 'Primary image alt' },
        accentImage: imageField('Accent image URL'),
        accentImageAlt: { type: 'text', label: 'Accent image alt' },
        peekImage: imageField('Peek image URL (decorative)'),
      },
      defaultProps: {
        anchor: '',
        visionLabel: 'Vision',
        visionStatementHtml: 'Healthy Lives <em>for All.</em>',
        missionLabel: 'Mission',
        missionStatementHtml: '',
        ctaLabel: 'See our impact',
        ctaHref: '/impact',
        primaryImage: '',
        primaryImageAlt: '',
        accentImage: '',
        accentImageAlt: '',
        peekImage: '',
      },
      render: ({ anchor, visionLabel, visionStatementHtml, missionLabel, missionStatementHtml, ctaLabel, ctaHref, primaryImage, primaryImageAlt, accentImage, accentImageAlt, peekImage }) => (
        <section
          className="visionMission"
          id={anchor || undefined}
          data-reveal
        >
          <div className="container visionMission__inner">
            <div className="visionMission__split">
              <div className="visionMission__copy">
                <article className="visionMission__entry">
                  <span className="visionMission__label">{visionLabel}</span>
                  <p
                    className="visionMission__statement visionMission__statement--lg"
                    dangerouslySetInnerHTML={{ __html: visionStatementHtml }}
                  />
                </article>
                <article className="visionMission__entry">
                  <span className="visionMission__label">{missionLabel}</span>
                  <p
                    className="visionMission__statement"
                    dangerouslySetInnerHTML={{ __html: missionStatementHtml }}
                  />
                </article>
                {ctaLabel && ctaHref && (
                  <a href={ctaHref} className="btn btn--cta visionMission__cta">
                    {ctaLabel}
                    <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
              <figure className="visionMission__media">
                {primaryImage && (
                  <img
                    className="visionMission__media-img visionMission__media-img--primary"
                    src={primaryImage}
                    alt={primaryImageAlt}
                  />
                )}
                {accentImage && (
                  <img
                    className="visionMission__media-img visionMission__media-img--accent"
                    src={accentImage}
                    alt={accentImageAlt}
                  />
                )}
                {peekImage && (
                  <img
                    className="visionMission__media-img visionMission__media-img--peek"
                    src={peekImage}
                    alt=""
                    aria-hidden="true"
                  />
                )}
              </figure>
            </div>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    HomePressGrid: {
      label: 'Homepage · press grid (3 cards)',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        items: {
          type: 'array',
          label: 'Cards',
          arrayFields: {
            href: { type: 'text', label: 'Card URL' },
            image: imageField('Image URL'),
            imageAlt: { type: 'text', label: 'Image alt' },
            meta: { type: 'text', label: 'Meta line' },
            title: { type: 'text', label: 'Card title' },
          },
          defaultItemProps: {
            href: '#',
            image: '',
            imageAlt: '',
            meta: '',
            title: '',
          },
        },
      },
      defaultProps: {
        anchor: 'press',
        eyebrow: 'From the newsroom',
        title: 'Latest from SFH',
        items: [],
      },
      render: ({ anchor, eyebrow, title, items }) => (
        <section
          className="press"
          id={anchor || undefined}
          data-reveal
        >
          <header className="container press__head">
            <span className="press__eyebrow">{eyebrow}</span>
            <h2 className="press__title">{title}</h2>
          </header>
          <div className="container press__grid">
            {items.map((c, i) => (
              <article key={i}>
                <a
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel={c.href.startsWith('http') ? 'noopener' : undefined}
                  className="pscard__link"
                >
                  <div className="pscard__media">
                    <img src={c.image} alt={c.imageAlt} loading="lazy" />
                  </div>
                  <div className="pscard__body">
                    <span className="pscard__meta">{c.meta}</span>
                    <h3 className="pscard__title">{c.title}</h3>
                  </div>
                </a>
              </article>
            ))}
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    PressFeatDynamic: {
      label: 'Press · featured story (auto: latest or flagged)',
      fields: {
        eyebrow: { type: 'text', label: 'Meta eyebrow' },
        badge: { type: 'text', label: 'Corner badge' },
        ctaLabel: { type: 'text', label: 'CTA label (external posts)' },
      },
      defaultProps: {
        eyebrow: 'Story',
        badge: 'Featured story',
        ctaLabel: 'Read on LinkedIn',
      },
      render: () => <PressBlockPlaceholder label="Featured story (dynamic)" />,
    },

    // -----------------------------------------------------------------
    PressListDynamic: {
      label: 'Press · filterable list (auto: all posts)',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        lede: { type: 'textarea', label: 'Head lede' },
        showFilter: {
          type: 'radio',
          label: 'Show filter pills?',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        ctaLabel: { type: 'text', label: 'CTA label (internal posts)' },
        externalCtaLabel: {
          type: 'text',
          label: 'CTA label (external posts)',
        },
      },
      defaultProps: {
        anchor: '',
        eyebrow: 'Latest from the newsroom',
        title: 'Recent stories',
        lede:
          'Releases, field stories, and reports — filter by type to find what you need.',
        showFilter: true,
        ctaLabel: 'Read more',
        externalCtaLabel: 'Read on LinkedIn',
      },
      render: () => <PressBlockPlaceholder label="Press list (dynamic)" />,
    },

    // -----------------------------------------------------------------
    PressMediaBand: {
      label: 'Press · media contact band',
      fields: {
        eyebrow: { type: 'text', label: 'Copy eyebrow' },
        title: { type: 'text', label: 'Copy title' },
        lede: { type: 'textarea', label: 'Copy lede' },
        email: { type: 'text', label: 'Email address' },
        primaryCtaLabel: { type: 'text', label: 'Primary CTA label' },
        primaryCtaHref: { type: 'text', label: 'Primary CTA href' },
        kitEyebrow: { type: 'text', label: 'Kit eyebrow' },
        kitLinks: {
          type: 'array',
          label: 'Quick-link items',
          arrayFields: {
            label: { type: 'text', label: 'Label' },
            href: { type: 'text', label: 'Href' },
            arrow: { type: 'text', label: 'Arrow symbol (→ ↗ ↓)' },
          },
          defaultItemProps: { label: 'Link', href: '#', arrow: '→' },
        },
      },
      defaultProps: {
        eyebrow: 'For media inquiries',
        title: 'Talk to the SFH media team',
        lede: '',
        email: 'media@sfhgroup.org',
        primaryCtaLabel: 'Contact SFH',
        primaryCtaHref: '/contact',
        kitEyebrow: 'Quick links for journalists',
        kitLinks: [],
      },
      render: ({ eyebrow, title, lede, email, primaryCtaLabel, primaryCtaHref, kitEyebrow, kitLinks }) => (
        <section className="pressMedia">
          <div className="container pressMedia__inner">
            <div className="pressMedia__copy">
              <span className="pressMedia__eyebrow">{eyebrow}</span>
              <h2 className="pressMedia__title">{title}</h2>
              <p className="pressMedia__lede">{lede}</p>
              {email && (
                <a href={`mailto:${email}`} className="pressMedia__email">
                  {email}
                </a>
              )}
              <div className="pressMedia__actions">
                <a href={primaryCtaHref} className="btn btn--cta">
                  {primaryCtaLabel} <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <aside className="pressMedia__kit">
              <span className="pressMedia__kitEyebrow">{kitEyebrow}</span>
              <ul className="pressMedia__kitList">
                {kitLinks.map((l, i) => (
                  <li key={i}>
                    <a href={l.href}>
                      {l.label} <span aria-hidden="true">{l.arrow || '→'}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ContactRoutes: {
      label: 'Contact · routes grid',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        routes: {
          type: 'array',
          label: 'Routes',
          arrayFields: {
            index: { type: 'text', label: 'Index' },
            title: { type: 'text', label: 'Title' },
            lede: { type: 'textarea', label: 'Lede' },
            linkLabel: { type: 'text', label: 'Link label' },
            linkHref: { type: 'text', label: 'Link href' },
            accent: {
              type: 'radio',
              label: 'Accent variant?',
              options: [
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ],
            },
          },
          defaultItemProps: {
            index: '01',
            title: 'Route',
            lede: '',
            linkLabel: '',
            linkHref: '#',
            accent: false,
          },
        },
      },
      defaultProps: {
        anchor: '',
        routes: [],
      },
      render: ({ anchor, routes }) => (
        <section className="contactRoutes" id={anchor || undefined}>
          <div className="container">
            <ul
              className="contactRoutes__grid"
              aria-label="Contact options by category"
            >
              {routes.map((r, i) => (
                <li
                  key={i}
                  className={`contactRoutes__card${r.accent ? ' contactRoutes__card--accent' : ''}`}
                >
                  <span className="contactRoutes__num" aria-hidden="true">
                    {r.index}
                  </span>
                  <h3 className="contactRoutes__title">{r.title}</h3>
                  <p className="contactRoutes__lede">{r.lede}</p>
                  <a href={r.linkHref} className="contactRoutes__email">
                    {r.linkLabel} <span aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ContactMessageForm: {
      label: 'Contact · message form (2-col)',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        copyEyebrow: { type: 'text', label: 'Copy eyebrow' },
        copyTitle: { type: 'text', label: 'Copy title' },
        copyLede: { type: 'textarea', label: 'Copy lede' },
        facts: {
          type: 'array',
          label: 'Fact rows',
          arrayFields: {
            label: { type: 'text', label: 'Label' },
            value: { type: 'text', label: 'Value' },
          },
          defaultItemProps: { label: 'Reply window', value: '2 working days' },
        },
        noteHtml: { type: 'textarea', label: 'Note (HTML allowed)' },
        submitLabel: { type: 'text', label: 'Submit button label' },
        consentHtml: { type: 'textarea', label: 'Consent line (HTML allowed)' },
        topics: {
          type: 'array',
          label: 'Topic options',
          arrayFields: { label: { type: 'text', label: 'Label' } },
          defaultItemProps: { label: 'General inquiry' },
        },
      },
      defaultProps: {
        anchor: 'contact-form',
        copyEyebrow: 'Send a message',
        copyTitle: 'Don’t see the right route?',
        copyLede: '',
        facts: [],
        noteHtml: '',
        submitLabel: 'Send message',
        consentHtml: '',
        topics: [],
      },
      render: ({ anchor, copyEyebrow, copyTitle, copyLede, facts, noteHtml, submitLabel, consentHtml, topics }) => (
        <section className="contactForm" id={anchor || undefined}>
          <div className="container contactForm__grid">
            <div className="contactForm__copy">
              <span className="contactForm__eyebrow">{copyEyebrow}</span>
              <h2 className="contactForm__title">{copyTitle}</h2>
              <p className="contactForm__lede">{copyLede}</p>
              {facts.length > 0 && (
                <dl className="contactForm__facts">
                  {facts.map((f, i) => (
                    <div key={i}>
                      <dt>{f.label}</dt>
                      <dd>{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {noteHtml && (
                <p
                  className="contactForm__note"
                  dangerouslySetInnerHTML={{ __html: noteHtml }}
                />
              )}
            </div>
            <form
              className="contactForm__form"
              action="#"
              method="post"
              aria-label="Contact form"
            >
              <div className="contactForm__row">
                <div>
                  <label htmlFor="cf-name">Your name</label>
                  <input id="cf-name" name="name" type="text" required />
                </div>
                <div>
                  <label htmlFor="cf-email">Email address</label>
                  <input id="cf-email" name="email" type="email" required />
                </div>
              </div>
              <div className="contactForm__row">
                <div>
                  <label htmlFor="cf-org">Organisation</label>
                  <input id="cf-org" name="organisation" type="text" />
                </div>
                <div>
                  <label htmlFor="cf-topic">What’s this about?</label>
                  <select id="cf-topic" name="topic" required>
                    <option value="">Choose a topic</option>
                    {topics.map((t, i) => (
                      <option key={i}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="cf-message">Message</label>
                <textarea id="cf-message" name="message" required />
              </div>
              <button
                type="submit"
                className="btn btn--cta contactForm__submit"
              >
                {submitLabel} <span aria-hidden="true">→</span>
              </button>
              {consentHtml && (
                <p
                  className="contactForm__consent"
                  dangerouslySetInnerHTML={{ __html: consentHtml }}
                />
              )}
            </form>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    ContactOffices: {
      label: 'Contact · offices grid',
      fields: {
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        lede: { type: 'textarea', label: 'Head lede' },
        offices: {
          type: 'array',
          label: 'Offices',
          arrayFields: {
            label: { type: 'text', label: 'Label (e.g. Headquarters)' },
            name: { type: 'text', label: 'Office name' },
            flag: imageField('Flag URL'),
            addressHtml: {
              type: 'textarea',
              label: 'Address (HTML · use <br />)',
            },
            email: { type: 'text', label: 'Email' },
            linkLabel: { type: 'text', label: 'Link label' },
            linkHref: { type: 'text', label: 'Link href' },
            linkExternal: {
              type: 'radio',
              label: 'External link?',
              options: [
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ],
            },
          },
          defaultItemProps: {
            label: 'Country office',
            name: 'SFH',
            flag: '',
            addressHtml: '',
            email: '',
            linkLabel: 'Visit',
            linkHref: '#',
            linkExternal: false,
          },
        },
      },
      defaultProps: {
        eyebrow: 'Our offices',
        title: 'Five countries, locally led',
        lede: '',
        offices: [],
      },
      render: ({ eyebrow, title, lede, offices }) => (
        <section className="contactOffices">
          <div className="container">
            <header className="impact__sectionhead">
              <span className="impact__sectioneyebrow">{eyebrow}</span>
              <h2 className="impact__sectiontitle">{title}</h2>
              {lede && <p className="impact__sectionlede">{lede}</p>}
            </header>
            <ul className="contactOffices__grid" aria-label="Office addresses">
              {offices.map((o, i) => (
                <li key={i} className="contactOffice">
                  <header className="contactOffice__head">
                    {o.flag && (
                      <img
                        className="contactOffice__flag"
                        src={o.flag}
                        alt=""
                      />
                    )}
                    <div>
                      <span className="contactOffice__label">{o.label}</span>
                      <h3 className="contactOffice__name">{o.name}</h3>
                    </div>
                  </header>
                  <address
                    className="contactOffice__address"
                    dangerouslySetInnerHTML={{ __html: o.addressHtml }}
                  />
                  {o.email && (
                    <a
                      href={`mailto:${o.email}`}
                      className="contactOffice__email"
                    >
                      {o.email}
                    </a>
                  )}
                  {o.linkLabel && o.linkHref && (
                    <a
                      href={o.linkHref}
                      target={o.linkExternal ? '_blank' : undefined}
                      rel={o.linkExternal ? 'noopener' : undefined}
                      className="contactOffice__link"
                    >
                      {o.linkLabel}{' '}
                      <span aria-hidden="true">
                        {o.linkExternal ? '↗' : '→'}
                      </span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    NumberedCardsGrid: {
      label: 'Numbered cards grid (impact__grid pattern)',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        variantClass: {
          type: 'text',
          label: 'Wrapper extra class (e.g. careers__why)',
        },
        gridExtraClass: {
          type: 'text',
          label: 'Grid extra class (e.g. careers__whyGrid)',
        },
        eyebrow: { type: 'text', label: 'Head eyebrow' },
        title: { type: 'text', label: 'Head title' },
        lede: { type: 'textarea', label: 'Head lede' },
        cards: {
          type: 'array',
          label: 'Cards',
          arrayFields: {
            index: { type: 'text', label: 'Index' },
            title: { type: 'text', label: 'Title' },
            body: { type: 'textarea', label: 'Body' },
            meta: { type: 'text', label: 'Meta line (optional)' },
          },
          defaultItemProps: { index: '01', title: 'Card', body: '', meta: '' },
        },
      },
      defaultProps: {
        anchor: '',
        variantClass: '',
        gridExtraClass: '',
        eyebrow: '',
        title: 'Title',
        lede: '',
        cards: [],
      },
      render: ({ anchor, variantClass, gridExtraClass, eyebrow, title, lede, cards }) => (
        <section
          className={`impact__programmes${variantClass ? ' ' + variantClass : ''}`}
          id={anchor || undefined}
        >
          <div className="container">
            <header className="impact__sectionhead">
              <span className="impact__sectioneyebrow">{eyebrow}</span>
              <h2 className="impact__sectiontitle">{title}</h2>
              {lede && <p className="impact__sectionlede">{lede}</p>}
            </header>
            <ul
              className={`impact__grid${gridExtraClass ? ' ' + gridExtraClass : ''}`}
              aria-label={title}
            >
              {cards.map((c, i) => (
                <li key={i} className="impact__card">
                  <span className="impact__num" aria-hidden="true">
                    {c.index}
                  </span>
                  <h3 className="impact__cardtitle">{c.title}</h3>
                  <p className="impact__cardlede">{c.body}</p>
                  {c.meta && <span className="careersIntern__meta">{c.meta}</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    CareersCtaCard: {
      label: 'Careers · framed CTA card',
      fields: {
        anchor: { type: 'text', label: 'Section anchor id (optional)' },
        image: imageField('Frame image URL'),
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        lede: { type: 'textarea', label: 'Lede' },
        ctaLabel: { type: 'text', label: 'CTA label' },
        ctaHref: { type: 'text', label: 'CTA href' },
        ctaExternal: {
          type: 'radio',
          label: 'External link?',
          options: [
            { label: 'No', value: false },
            { label: 'Yes', value: true },
          ],
        },
      },
      defaultProps: {
        anchor: 'roles',
        image: '',
        eyebrow: 'Open roles',
        title: 'Currently hiring across SFH',
        lede: '',
        ctaLabel: 'View open roles',
        ctaHref: '#',
        ctaExternal: false,
      },
      render: ({ anchor, image, eyebrow, title, lede, ctaLabel, ctaHref, ctaExternal }) => (
        <section
          className="careers__cta"
          id={anchor || undefined}
          aria-label="Open roles"
        >
          <div className="container">
            <div className="careers__ctaFrame">
              {image && (
                <img
                  className="careers__ctaImage"
                  src={image}
                  alt=""
                  aria-hidden="true"
                />
              )}
              <div className="careers__ctaCard">
                <span className="careers__ctaEyebrow">{eyebrow}</span>
                <h2 className="careers__ctaTitle">{title}</h2>
                <p className="careers__ctaLede">{lede}</p>
                <a
                  href={ctaHref}
                  target={ctaExternal ? '_blank' : undefined}
                  rel={ctaExternal ? 'noopener noreferrer' : undefined}
                  className="btn btn--cta"
                >
                  {ctaLabel}{' '}
                  <span aria-hidden="true">{ctaExternal ? '↗' : '→'}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    JourneyChapters: {
      label: 'Journey timeline',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        lede: { type: 'textarea', label: 'Lede' },
        chapters: {
          type: 'array',
          label: 'Chapters',
          arrayFields: {
            years: { type: 'text', label: 'Year range' },
            title: { type: 'text', label: 'Chapter title' },
            body: { type: 'textarea', label: 'Body' },
          },
          defaultItemProps: {
            years: '2020 — 2025',
            title: 'Chapter title',
            body: 'Short description.',
          },
        },
      },
      defaultProps: {
        eyebrow: 'Our journey',
        title: 'Chapters',
        lede: '',
        chapters: [],
      },
      render: ({ eyebrow, title, lede, chapters }) => (
        <section className="journey" data-reveal>
          <div className="container">
            <header className="journey__head">
              <span className="journey__eyebrow">{eyebrow}</span>
              <h2 className="journey__title">{title}</h2>
              {lede && <p className="journey__lede">{lede}</p>}
            </header>
            <ol className="journey__pillars" aria-label={title}>
              {chapters.map((c, i) => (
                <li key={i} className="chap">
                  <span className="chap__num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="chap__years">{c.years}</span>
                  <h3 className="chap__title">{c.title}</h3>
                  <p className="chap__body">{c.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    PartnersMarquee: {
      label: 'Partners marquee (logo strip)',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        logos: {
          type: 'array',
          label: 'Logos',
          arrayFields: {
            src: imageField('Logo URL'),
            alt: { type: 'text', label: 'Alt text' },
            href: { type: 'text', label: 'Link URL (optional)' },
          },
          defaultItemProps: { src: '', alt: '', href: '#' },
        },
      },
      defaultProps: {
        eyebrow: 'Selected partners & donors',
        logos: [],
      },
      render: ({ eyebrow, logos }) => (
        <section
          className="partners"
          aria-label={eyebrow}
          data-reveal
        >
          <div className="container partners__head">
            <p className="partners__eyebrow">{eyebrow}</p>
          </div>
          <div className="partners__strip">
            <div className="partners__track">
              {logos.map((l, i) => (
                <a key={`orig-${i}`} className="partners__logo" href={l.href || '#'}>
                  <img src={l.src} alt={l.alt} />
                </a>
              ))}
              {/* duplicate set for seamless keyframed loop */}
              {logos.map((l, i) => (
                <a
                  key={`dup-${i}`}
                  className="partners__logo"
                  href={l.href || '#'}
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <img src={l.src} alt="" />
                </a>
              ))}
            </div>
          </div>
        </section>
      ),
    },

    // -----------------------------------------------------------------
    // Generic blocks (still useful when adding non-About pages)
    // -----------------------------------------------------------------
    Hero: {
      label: 'Hero · generic',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        emphasise: { type: 'text', label: 'Italic tail (optional)' },
        lede: { type: 'textarea', label: 'Lede paragraph' },
        image: imageField('Background image URL'),
        ctaLabel: { type: 'text', label: 'CTA label' },
        ctaHref: { type: 'text', label: 'CTA href' },
      },
      defaultProps: {
        eyebrow: 'SFH',
        title: 'A headline',
        emphasise: '',
        lede: '',
        image: '/assets/village-portrait.jpg',
        ctaLabel: '',
        ctaHref: '',
      },
      render: ({ eyebrow, title, emphasise, lede, image, ctaLabel, ctaHref }) => (
        <section className="aboutHero">
          <div className="aboutHero__media" aria-hidden="true">
            <img src={image} alt="" />
          </div>
          <div className="aboutHero__overlay" aria-hidden="true" />
          <div className="container aboutHero__panel">
            {eyebrow && <span className="aboutHero__eyebrow">{eyebrow}</span>}
            <h1 className="aboutHero__title">
              {title}
              {emphasise && (
                <>
                  {' '}<em>{emphasise}</em>
                </>
              )}
            </h1>
            {lede && (
              <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 560, marginTop: 16 }}>
                {lede}
              </p>
            )}
            {ctaLabel && ctaHref && (
              <a
                href={ctaHref}
                className="btn btn--cta"
                style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {ctaLabel}
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </section>
      ),
    },

    TextBlock: {
      label: 'Text block',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        body: { type: 'textarea', label: 'Body' },
        align: {
          type: 'select',
          label: 'Align',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
          ],
        },
      },
      defaultProps: {
        eyebrow: '',
        title: 'Section title',
        body: 'Paragraph copy.',
        align: 'left',
      },
      render: ({ eyebrow, title, body, align }) => (
        <section className="cpage__body" style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}>
          <div className="container prod__intro" style={{ textAlign: align === 'center' ? 'center' : 'left' }}>
            {eyebrow && <span className="prod__eyebrow">{eyebrow}</span>}
            {title && <h2 className="prod__intro-title">{title}</h2>}
            {body.split(/\n\n+/).map((para, i) => (
              <p className="prod__intro-lede" key={i}>{para}</p>
            ))}
          </div>
        </section>
      ),
    },

    CTA: {
      label: 'Call to action',
      fields: {
        title: { type: 'text', label: 'Title' },
        body: { type: 'textarea', label: 'Body' },
        ctaLabel: { type: 'text', label: 'Button label' },
        ctaHref: { type: 'text', label: 'Button href' },
      },
      defaultProps: {
        title: 'Ready to work with us?',
        body: '',
        ctaLabel: 'Contact SFH',
        ctaHref: '/contact',
      },
      render: ({ title, body, ctaLabel, ctaHref }) => (
        <section
          style={{
            padding: 'clamp(48px, 6vw, 96px) 0',
            background: 'var(--accent)',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <div className="container">
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', margin: 0 }}>{title}</h2>
            {body && (
              <p style={{ maxWidth: 560, margin: '14px auto 24px', opacity: 0.85 }}>{body}</p>
            )}
            <a
              href={ctaHref}
              className="btn btn--cta"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {ctaLabel}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      ),
    },
  },
};
