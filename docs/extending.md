# Extending the CMS

Common extension recipes. Every one is scoped small — the CMS is a set
of files, not a framework, so you edit what's there and add adjacent.

## Add a new content type (table + list + editor)

Suppose you want an **Events** section.

### 1. Schema

Edit `db/schema.ts`:

```ts
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 255 }).notNull(),
  title: text('title').notNull(),
  startsAt: timestamp('starts_at').notNull(),
  location: text('location'),
  body: jsonb('body'),                 // TipTap doc, same shape as posts
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

Generate + apply:

```bash
npm run db:generate
npm run db:migrate
```

### 2. Server actions

Create `lib/events.ts` modeled on `lib/posts.ts`:

```ts
'use server';
import { and, desc, eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, events } from '@/db';
import { getCurrentSite } from '@/lib/site';

export type EventFormState = { error?: string; ok?: boolean };

const input = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  startsAt: z.coerce.date(),
  location: z.string().max(500).optional().nullable(),
  body: z.object({ type: z.literal('doc') }).passthrough(),
  action: z.enum(['draft', 'publish']),
});

export async function listEvents() { … }
export async function getEventById(id: string) { … }
export async function saveEvent(_prev, formData) { … }   // same shape as savePost
```

### 3. Admin routes

Copy the shape of `app/(admin)/admin/(authed)/posts/` to a new
`events/` folder. Rename `PostEditor.tsx` to `EventEditor.tsx`, add
the new fields (startsAt, location).

### 4. Sidebar link

Edit `app/(admin)/admin/(authed)/layout.tsx`:

```tsx
<span className="admin-nav__section">Content</span>
<Link href="/admin/pages">Pages</Link>
<Link href="/admin/posts">Posts</Link>
<Link href="/admin/events">Events</Link>       {/* new */}
<Link href="/admin/media">Media</Link>
```

### 5. Public route

```tsx
// app/(frontend)/events/page.tsx
import { getPublishedEvents } from '@/lib/events-public';
export default async function EventsPage() {
  const events = await getPublishedEvents();
  return <ul>{events.map(e => <li key={e.id}>{e.title}</li>)}</ul>;
}
```

`lib/events-public.ts` mirrors `lib/blog.ts` — separate from
`lib/events.ts` so the public reader doesn't sit behind `'use server'`.

## Add a new Puck block

See `docs/blocks.md`. TL;DR — add to `PuckComponents` and `components`
in `lib/puck-config.tsx`.

## Add a new field to an existing table

Example: add a `featured` boolean to `pages`.

1. Add the column to `db/schema.ts`.
2. `npm run db:generate && npm run db:migrate`.
3. Update the Zod schema in `lib/pages.ts::upsertInput` if editors
   should be able to set it.
4. Add a control to `PageEditor.tsx` (or wherever).
5. Read the column wherever you want to use it.

## Add a webhook on publish

Modify the `savePage` server action in `lib/pages.ts`:

```ts
if (publishing) {
  revalidateTag('pages');
  revalidateTag(`page:${input.slug}`);
  fetch('https://your-webhook/hook', {
    method: 'POST',
    body: JSON.stringify({ slug: input.slug, pageId }),
  }).catch(() => undefined);
}
```

## Add a scheduled purge

Create `app/api/cron/purge/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { cleanupOldAnalytics } from '@/lib/analytics-actions';

export async function POST(req: Request) {
  if (req.headers.get('x-cron-key') !== process.env.CRON_KEY) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const fd = new FormData();
  fd.set('days', '90');
  // Cannot call the auth-guarded cleanupOldAnalytics from a cron;
  // instead extract the SQL into a plain function and call it here.
  return NextResponse.json({ ok: true });
}
```

Then have your platform's cron POST to that endpoint hourly.

## Add rate limiting to /api/analytics/track

If botspam becomes an issue, wrap the handler with a per-IP token
bucket:

```ts
const bucket = new Map<string, { tokens: number; last: number }>();
function allow(ip: string) {
  const now = Date.now();
  const b = bucket.get(ip) ?? { tokens: 60, last: now };
  const elapsed = (now - b.last) / 1000;
  b.tokens = Math.min(60, b.tokens + elapsed);           // refill
  b.last = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  bucket.set(ip, b);
  return true;
}
```

For multi-instance, use Redis instead of a Map.

## Switch to email + magic link auth

Auth.js supports email providers. In `lib/auth.ts`:

```tsx
import EmailProvider from 'next-auth/providers/email';

providers: [
  Credentials({ … }),                       // keep for admins
  EmailProvider({
    server: process.env.EMAIL_SERVER,
    from: 'noreply@yoursite.com',
  }),
],
```

Editors receive a sign-in link and stop typing passwords. The
`verification_tokens` table already exists — no schema change needed.

## Add sitemap.ts

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/blog';
import { KNOWN_EDITABLE_PAGES } from '@/lib/known-routes';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const now = new Date();
  return [
    ...KNOWN_EDITABLE_PAGES.filter(p => p.ready).map(p => ({
      url: `https://yoursite.com${p.path}`,
      lastModified: now,
    })),
    ...posts.map(p => ({
      url: `https://yoursite.com/blog/${p.slug}`,
      lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
    })),
  ];
}
```

## Add robots.ts

```ts
// app/robots.ts
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin/' },
    sitemap: 'https://yoursite.com/sitemap.xml',
  };
}
```
