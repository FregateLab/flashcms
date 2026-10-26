import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCurrentSite } from '@/lib/site';
import { db, newsletterSubscribers } from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// RFC 4180-safe CSV cell escape. Wrap in quotes and double up any
// internal quotes if the value contains a comma, quote, or newline.
function csvCell(v: string | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toIsoDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? '' : date.toISOString();
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const site = await getCurrentSite();

  // Active only — matches what the admin UI's "Export" button implies.
  const rows = await db
    .select({
      email: newsletterSubscribers.email,
      source: newsletterSubscribers.source,
      subscribedAt: newsletterSubscribers.subscribedAt,
    })
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.siteId, site.id),
        eq(newsletterSubscribers.status, 'subscribed'),
      ),
    )
    .orderBy(asc(newsletterSubscribers.subscribedAt));

  const header = 'email,source,subscribed_at\n';
  const body = rows
    .map(
      (r) =>
        `${csvCell(r.email)},${csvCell(r.source)},${csvCell(toIsoDate(r.subscribedAt))}`,
    )
    .join('\n');

  const today = new Date().toISOString().slice(0, 10);
  const filename = `${site.slug}-newsletter-${today}.csv`;

  return new NextResponse(header + body + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
