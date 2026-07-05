import { NextResponse } from 'next/server';
import { analyticsVitals, db } from '@/db';
import { getCurrentSite } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE = 'sfh_sid';
const BOT_RE = /bot|crawl|spider|slurp|preview|linkcheck|monitor|pingdom|uptime|lighthouse|headlesschrome|puppeteer|playwright|nagios/i;
const ALLOWED = new Set(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']);

function deviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
  const s = ua.toLowerCase();
  if (/ipad|tablet|kindle|silk|playbook/.test(s)) return 'tablet';
  if (/mobile|iphone|ipod|android.+mobi|blackberry|opera mini|windows phone/.test(s)) {
    return 'mobile';
  }
  if (/android/.test(s)) return 'tablet';
  return 'desktop';
}

export async function POST(req: Request) {
  try {
    const ua = req.headers.get('user-agent') ?? '';
    if (ua && BOT_RE.test(ua)) {
      return NextResponse.json({ ok: true, skipped: 'bot' });
    }

    const body = (await req.json().catch(() => ({}))) as {
      name?: unknown;
      value?: unknown;
      path?: unknown;
    };
    const name = typeof body.name === 'string' ? body.name.toUpperCase() : '';
    if (!ALLOWED.has(name)) {
      return NextResponse.json({ ok: false, error: 'bad name' }, { status: 400 });
    }
    const rawValue = Number(body.value);
    if (!Number.isFinite(rawValue) || rawValue < 0) {
      return NextResponse.json({ ok: false, error: 'bad value' }, { status: 400 });
    }
    // CLS is a small float; store as value*1000 to keep integer storage.
    const value =
      name === 'CLS'
        ? Math.round(rawValue * 1000)
        : Math.round(rawValue);

    const rawPath = typeof body.path === 'string' ? body.path : '';
    if (!rawPath.startsWith('/')) {
      return NextResponse.json({ ok: false, error: 'bad path' }, { status: 400 });
    }
    const path = rawPath.split('?')[0].split('#')[0].slice(0, 512);

    const cookieHeader = req.headers.get('cookie') ?? '';
    const cookieMatch = cookieHeader.match(
      new RegExp(`${COOKIE}=([A-Za-z0-9_-]{8,64})`),
    );

    const site = await getCurrentSite();
    await db.insert(analyticsVitals).values({
      siteId: site.id,
      path,
      name,
      value,
      sessionId: cookieMatch?.[1] ?? null,
      deviceType: ua ? deviceType(ua) : null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('analytics/vitals', err);
    return NextResponse.json({ ok: false, error: 'ingest failed' }, { status: 500 });
  }
}
