import { eq, sql, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db, pages, pageVersions, posts, postVersions } from '@/db';
import { getCurrentSite } from '@/lib/site';
import { KNOWN_EDITABLE_PAGES } from '@/lib/known-routes';

// Extra public routes that are hand-coded (not CMS-editable via
// /admin/pages) but should still turn up in search. Add hand-coded
// sub-pages here so their labels are discoverable before they get a
// CMS entry. Empty by default — populate per project.
const STATIC_NAV_TARGETS: {
  label: string;
  path: string;
  section: string;
}[] = [];

// Node runtime — this route uses `pg`.
export const runtime = 'nodejs';

type Hit = {
  type: 'page' | 'post';
  title: string;
  excerpt: string;
  url: string;
  category?: string;
};

const SKIP_KEYS = new Set([
  'id',
  'type',
  'slug',
  'image',
  'src',
  'href',
  'url',
  'ctaHref',
  'primaryHref',
  'secondaryHref',
  'photo',
  'coverImage',
  'flag',
  'flagUrl',
  'icon',
  'poster',
  'thumbnail',
  'background',
  'bg',
]);

function looksLikePathOrUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return /^(\/|https?:|mailto:|tel:)/.test(t) || /\.(png|jpe?g|webp|avif|svg|gif|pdf)$/i.test(t);
}

function extractText(node: unknown, out: string[] = []): string[] {
  if (node == null) return out;
  if (typeof node === 'string') {
    if (node.trim() && !looksLikePathOrUrl(node)) out.push(node);
    return out;
  }
  if (Array.isArray(node)) {
    for (const item of node) extractText(item, out);
    return out;
  }
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (SKIP_KEYS.has(k)) continue;
      extractText(v, out);
    }
  }
  return out;
}

function makeSnippet(text: string, term: string, width = 140): string {
  const lc = text.toLowerCase();
  const idx = lc.indexOf(term.toLowerCase());
  if (idx < 0) return text.slice(0, width).trim();
  const start = Math.max(0, idx - Math.floor(width / 2));
  const end = Math.min(text.length, start + width);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

async function search(q: string): Promise<Hit[]> {
  const term = q.trim();
  if (!term) return [];
  const site = await getCurrentSite();
  const lc = term.toLowerCase();
  type KnownPage = (typeof KNOWN_EDITABLE_PAGES)[number];
  const knownBySlug = new Map<string, KnownPage>(
    KNOWN_EDITABLE_PAGES.map((p) => [p.slug as string, p]),
  );

  // ---- 1. structural (label / slug / section / path) --------------------
  const structuralHits: Hit[] = [];
  const seenPaths = new Set<string>();
  for (const p of KNOWN_EDITABLE_PAGES) {
    const hay = `${p.label} ${p.slug} ${p.section} ${p.path}`.toLowerCase();
    if (!hay.includes(lc)) continue;
    if (seenPaths.has(p.path)) continue;
    seenPaths.add(p.path);
    structuralHits.push({
      type: 'page',
      title: p.label,
      excerpt: p.section,
      url: p.path,
      category: p.section,
    });
  }
  for (const s of STATIC_NAV_TARGETS) {
    if (seenPaths.has(s.path)) continue;
    const hay = `${s.label} ${s.path} ${s.section}`.toLowerCase();
    if (!hay.includes(lc)) continue;
    seenPaths.add(s.path);
    structuralHits.push({
      type: 'page',
      title: s.label,
      excerpt: s.section,
      url: s.path,
      category: s.section,
    });
  }

  // ---- 2. CMS pages — search published AND latest draft ----------------
  const allPages = await db
    .select({
      id: pages.id,
      slug: pages.slug,
      title: pages.title,
      published: pages.published,
    })
    .from(pages)
    .where(eq(pages.siteId, site.id));

  const latestVersions = allPages.length
    ? await db
        .select({
          pageId: pageVersions.pageId,
          data: pageVersions.data,
          createdAt: pageVersions.createdAt,
        })
        .from(pageVersions)
        .where(
          sql`${pageVersions.pageId} IN (${sql.join(
            allPages.map((p) => sql`${p.id}::uuid`),
            sql`, `,
          )})`,
        )
        .orderBy(desc(pageVersions.createdAt))
    : [];
  const latestByPage = new Map<string, unknown>();
  for (const v of latestVersions) {
    if (!latestByPage.has(v.pageId)) latestByPage.set(v.pageId, v.data);
  }

  const cmsPageHits: Hit[] = [];
  for (const p of allPages) {
    const src = p.published ?? latestByPage.get(p.id);
    if (!src) continue;
    const strings = extractText(src);
    if (!strings.some((s) => s.toLowerCase().includes(lc))) continue;
    const firstMatch =
      strings.find((s) => s.toLowerCase().includes(lc)) ?? strings.join(' ');
    const known = knownBySlug.get(p.slug);
    const url = known?.path ?? `/${p.slug}`;
    cmsPageHits.push({
      type: 'page',
      title: known?.label ?? p.title,
      excerpt: makeSnippet(firstMatch, term),
      url,
      category: known?.section ?? 'Page',
    });
    seenPaths.add(url);
  }

  const byUrl = new Map(structuralHits.map((h) => [h.url, h]));
  for (const h of cmsPageHits) byUrl.set(h.url, h);
  const mergedPageHits = Array.from(byUrl.values());

  // ---- 3. posts — search published bodies + drafts ---------------------
  const allPosts = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      externalUrl: posts.externalUrl,
      pressType: posts.pressType,
      published: posts.published,
      isPublished: posts.isPublished,
    })
    .from(posts)
    .where(eq(posts.siteId, site.id));

  const latestPostVersions = allPosts.length
    ? await db
        .select({
          postId: postVersions.postId,
          data: postVersions.data,
          createdAt: postVersions.createdAt,
        })
        .from(postVersions)
        .where(
          sql`${postVersions.postId} IN (${sql.join(
            allPosts.map((p) => sql`${p.id}::uuid`),
            sql`, `,
          )})`,
        )
        .orderBy(desc(postVersions.createdAt))
    : [];
  const latestByPost = new Map<string, unknown>();
  for (const v of latestPostVersions) {
    if (!latestByPost.has(v.postId)) latestByPost.set(v.postId, v.data);
  }

  const postHits: Hit[] = [];
  for (const p of allPosts) {
    if (!p.isPublished) continue;
    const src = p.published ?? latestByPost.get(p.id);
    const bodyStrings = src ? extractText(src) : [];
    const allText = [p.title, p.excerpt ?? '', ...bodyStrings].join('  ');
    if (!allText.toLowerCase().includes(lc)) continue;

    const snippetSource =
      (p.title.toLowerCase().includes(lc) && p.title) ||
      (p.excerpt && p.excerpt.toLowerCase().includes(lc) && p.excerpt) ||
      bodyStrings.find((s) => s.toLowerCase().includes(lc)) ||
      p.excerpt ||
      '';

    postHits.push({
      type: 'post',
      title: p.title,
      excerpt: makeSnippet(snippetSource, term),
      url: p.externalUrl?.trim() || `/blog/${p.slug}`,
      category:
        p.pressType === 'release'
          ? 'Press release'
          : p.pressType === 'report'
            ? 'Report'
            : p.pressType === 'factsheet'
              ? 'Factsheet'
              : 'Story',
    });
  }

  const hits = [...mergedPageHits, ...postHits];
  hits.sort((a, b) => rank(b, lc) - rank(a, lc));
  return hits.slice(0, 25);
}

function rank(h: Hit, lc: string): number {
  const t = h.title.toLowerCase();
  if (t === lc) return 100;
  if (t.startsWith(lc)) return 80;
  if (t.includes(lc)) return 60;
  if (h.excerpt.toLowerCase().includes(lc)) return 40;
  return 10;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  if (q.trim().length < 2) return NextResponse.json({ hits: [] });
  try {
    const hits = await search(q);
    return NextResponse.json({ hits });
  } catch (err) {
    console.error('search error', err);
    return NextResponse.json(
      { hits: [], error: 'search-failed' },
      { status: 500 },
    );
  }
}
