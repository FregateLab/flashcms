import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// ---- Auth.js core tables (shape mandated by @auth/drizzle-adapter) ----
// users carries our own password_hash + role columns in addition to the
// baseline Auth.js columns.
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 32 }).notNull().default('editor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---- CMS tables ---------------------------------------------------------
// Every content row is scoped to a site, so a single Postgres serves many
// SFH properties.
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 64 }).unique().notNull(),
  name: text('name').notNull(),
  domain: text('domain'),
  // Editable site chrome — see lib/site-settings.ts for the shape.
  header: jsonb('header'),
  footer: jsonb('footer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 255 }).notNull(),
  title: text('title').notNull(),
  // Currently-published Puck document; null before first publish.
  published: jsonb('published'),
  publishedAt: timestamp('published_at'),
  // Editor-controlled SEO metadata — { title?, description?, image?,
  // noindex?, canonical? }. Empty fields fall back to the block-level
  // page title and no OG image.
  seo: jsonb('seo'),
  // Optional taxonomy link — shares the post_categories table so a
  // custom landing page can be grouped with the posts it introduces.
  categoryId: uuid('category_id').references(() => postCategories.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Draft snapshots + version history live here.
export const pageVersions = pgTable('page_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: uuid('page_id')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 255 }).notNull(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  coverImage: text('cover_image'),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  // Published TipTap JSON body; null before first publish.
  published: jsonb('published'),
  publishedAt: timestamp('published_at'),
  isPublished: boolean('is_published').default(false).notNull(),
  // Press-room fields. externalUrl overrides the internal /blog/<slug>
  // link when present (e.g. LinkedIn press mentions). pressType drives
  // the filter pills on /press: release | story | report.
  externalUrl: text('external_url'),
  pressType: varchar('press_type', { length: 16 }).default('story').notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  // Admin-defined taxonomy (see postCategories). Deleting a category
  // leaves its posts uncategorised rather than deleting them.
  categoryId: uuid('category_id').references(() => postCategories.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postVersions = pgTable('post_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Analytics events — one row per pageview. Site-scoped, cheap to
// aggregate on. sessionId is a hashed short id from the sfh_sid cookie
// so we can count "unique visitors" without storing PII. userAgent
// is truncated on ingest.
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    path: varchar('path', { length: 512 }).notNull(),
    referrer: varchar('referrer', { length: 512 }),
    sessionId: varchar('session_id', { length: 64 }).notNull(),
    userAgent: varchar('user_agent', { length: 200 }),
    // 2-letter ISO country code from an upstream header if present.
    country: varchar('country', { length: 2 }),
    // 2-letter continent code (AF, AN, AS, EU, NA, OC, SA).
    continent: varchar('continent', { length: 2 }),
    // Primary Accept-Language locale (2-letter language code).
    language: varchar('language', { length: 8 }),
    // mobile | tablet | desktop — parsed from the UA.
    deviceType: varchar('device_type', { length: 12 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('analytics_site_created_idx').on(t.siteId, t.createdAt),
    index('analytics_site_path_idx').on(t.siteId, t.path),
  ],
);

// Web Vitals — one row per metric per page. name is LCP | CLS | INP |
// FCP | TTFB. value is the raw metric value (ms for time-based, unitless
// for CLS). We aggregate as p75s in the dashboard.
export const analyticsVitals = pgTable(
  'analytics_vitals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    path: varchar('path', { length: 512 }).notNull(),
    name: varchar('name', { length: 8 }).notNull(),
    value: integer('value').notNull(),
    sessionId: varchar('session_id', { length: 64 }),
    deviceType: varchar('device_type', { length: 12 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('vitals_site_created_idx').on(t.siteId, t.createdAt),
    index('vitals_site_name_idx').on(t.siteId, t.name),
  ],
);

// Media metadata; the object itself lives in Dokwe S3-compatible storage.
export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  contentType: text('content_type'),
  size: text('size'),
  width: text('width'),
  height: text('height'),
  alt: text('alt'),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Newsletter subscribers — public visitors who submitted the footer
// form. status flips to 'unsubscribed' when they follow the token link
// in the welcome email (or an admin toggles it). We keep the row after
// unsubscribe rather than deleting it, so re-subscribes don't lose
// history and the export CSV can still filter cleanly.
export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 320 }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('subscribed'),
    ackConsent: boolean('ack_consent').notNull().default(false),
    unsubscribeToken: uuid('unsubscribe_token').defaultRandom().notNull().unique(),
    source: varchar('source', { length: 32 }).default('footer'),
    subscribedAt: timestamp('subscribed_at').defaultNow().notNull(),
    unsubscribedAt: timestamp('unsubscribed_at'),
  },
  (t) => [
    uniqueIndex('newsletter_site_email_idx').on(t.siteId, t.email),
    index('newsletter_site_status_idx').on(t.siteId, t.status),
  ],
);

// Post categories — admin-defined taxonomy per site. Managed at
// /admin/categories; posts (and optionally pages) point at a row via
// category_id. Public filters use the slug (/blog?category=<slug>).
export const postCategories = pgTable(
  'post_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 64 }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('post_categories_site_slug_idx').on(t.siteId, t.slug),
  ],
);

// Photo gallery — per-site collection of images with captions, managed
// at /admin/gallery and rendered by the site's own /gallery route (see
// snippets/gallery-page.tsx). Sort is entirely admin-controlled via
// sortOrder; ties break newest-first.
export const galleryPhotos = pgTable(
  'gallery_photos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    image: text('image').notNull(),
    caption: text('caption').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('gallery_photos_site_published_idx').on(t.siteId, t.isPublished),
  ],
);
