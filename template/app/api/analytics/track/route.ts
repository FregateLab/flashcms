import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { analyticsEvents, db } from '@/db';
import { getCurrentSite } from '@/lib/site';

// Runs on the Node runtime because we hit the DB.
export const runtime = 'nodejs';
// Never cached — always process each pageview.
export const dynamic = 'force-dynamic';

const COOKIE = 'sfh_sid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

// Rough bot filter — anything that self-identifies as a bot is skipped
// so the numbers stay honest.
const BOT_RE = /bot|crawl|spider|slurp|preview|linkcheck|monitor|pingdom|uptime|lighthouse|headlesschrome|puppeteer|playwright|nagios/i;

function short(v: string | null, max: number) {
  if (!v) return null;
  return v.length > max ? v.slice(0, max) : v;
}

/**
 * Very lightweight UA → device-type classification. Good enough for
 * marketing-site dashboards; not trying to reproduce full ua-parser.
 */
function deviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
  const s = ua.toLowerCase();
  if (/ipad|tablet|kindle|silk|playbook/.test(s)) return 'tablet';
  // Some Android tablets say "Mobile" too; check tablet cues first.
  if (/mobile|iphone|ipod|android.+mobi|blackberry|opera mini|windows phone/.test(s)) {
    return 'mobile';
  }
  if (/android/.test(s)) return 'tablet';
  return 'desktop';
}

/**
 * Trust upstream-provided country headers only. Recognises Dokwe
 * (`X-Country-Code`), Cloudflare (`CF-IPCountry`), Vercel
 * (`X-Vercel-IP-Country`), and a generic `X-Country` fallback.
 */
function countryFromHeaders(req: Request): string | null {
  const headers = req.headers;
  const raw =
    headers.get('x-country-code') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-vercel-ip-country') ||
    headers.get('x-country') ||
    null;
  if (!raw) return null;
  const cc = raw.trim().toUpperCase();
  if (cc === 'XX' || cc === 'T1') return null;
  return /^[A-Z]{2}$/.test(cc) ? cc : null;
}

function continentFromHeaders(req: Request): string | null {
  const raw = req.headers.get('x-continent-code');
  if (!raw) return null;
  const cc = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(cc) ? cc : null;
}

function primaryLanguage(al: string | null): string | null {
  if (!al) return null;
  const first = al.split(',')[0]?.trim() ?? '';
  const lang = first.split(';')[0]?.trim().toLowerCase() ?? '';
  const base = lang.split('-')[0];
  return /^[a-z]{2,3}$/.test(base) ? base : null;
}

export async function POST(req: Request) {
  try {
    const ua = req.headers.get('user-agent') ?? '';
    if (ua && BOT_RE.test(ua)) {
      return NextResponse.json({ ok: true, skipped: 'bot' });
    }

    const body = (await req.json().catch(() => ({}))) as {
      path?: unknown;
      referrer?: unknown;
    };
    const rawPath = typeof body.path === 'string' ? body.path : '';
    if (!rawPath.startsWith('/')) {
      return NextResponse.json(
        { ok: false, error: 'invalid path' },
        { status: 400 },
      );
    }
    // Strip query + trim.
    const path = short(rawPath.split('?')[0].split('#')[0], 512)!;

    // External referrer only; internal navigations aren't referrers here.
    const rawReferrer = typeof body.referrer === 'string' ? body.referrer : '';
    let referrer: string | null = null;
    if (rawReferrer) {
      try {
        const u = new URL(rawReferrer);
        const host = req.headers.get('host') ?? '';
        if (u.host && u.host !== host) {
          referrer = short(u.origin + u.pathname, 512);
        }
      } catch {
        /* ignore malformed URLs */
      }
    }

    // Session cookie — mint on first request.
    const cookieHeader = req.headers.get('cookie') ?? '';
    const cookieMatch = cookieHeader.match(
      new RegExp(`${COOKIE}=([A-Za-z0-9_-]{8,64})`),
    );
    const sid = cookieMatch?.[1] ?? randomBytes(16).toString('hex');

    const site = await getCurrentSite();
    await db.insert(analyticsEvents).values({
      siteId: site.id,
      path,
      referrer,
      sessionId: sid,
      userAgent: short(ua, 200),
      country: countryFromHeaders(req),
      continent: continentFromHeaders(req),
      language: primaryLanguage(req.headers.get('accept-language')),
      deviceType: ua ? deviceType(ua) : null,
    });

    const res = NextResponse.json({ ok: true });
    if (!cookieMatch) {
      res.cookies.set({
        name: COOKIE,
        value: sid,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
    }
    return res;
  } catch (err) {
    console.error('analytics/track', err);
    return NextResponse.json(
      { ok: false, error: 'ingest failed' },
      { status: 500 },
    );
  }
}
