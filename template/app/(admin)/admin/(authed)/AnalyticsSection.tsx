import Link from 'next/link';
import {
  getAnalyticsTotals,
  getContinentBreakdown,
  getCountryBreakdown,
  getDailyBuckets,
  getDeviceBreakdown,
  getOldestEventDate,
  getTopPaths,
  getTopReferrers,
  getVitalsP75,
  opportunisticCleanup,
  type Range,
} from '@/lib/analytics';
import CleanupCard from './CleanupCard';

function formatShort(day: string) {
  const d = new Date(day);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

/** Tiny inline sparkline (visits + uniques). No chart lib. */
function Sparkline({
  data,
  height = 84,
  width = 720,
}: {
  data: { day: string; visits: number; uniques: number }[];
  height?: number;
  width?: number;
}) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.visits));
  const stepX = width / Math.max(1, data.length - 1);
  const toY = (v: number) => height - (v / max) * (height - 8) - 4;
  const points = (k: 'visits' | 'uniques') =>
    data.map((d, i) => `${i * stepX},${toY(d[k])}`).join(' ');
  const areaPath = (k: 'visits' | 'uniques') => {
    const pts = data.map((d, i) => `${i * stepX},${toY(d[k])}`);
    return `M0,${height} L${pts.join(' L')} L${width},${height} Z`;
  };
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label="Daily visits sparkline"
    >
      <defs>
        <linearGradient id="spark-visits" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--sfh-red)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--sfh-red)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath('visits')} fill="url(#spark-visits)" />
      <polyline
        points={points('visits')}
        fill="none"
        stroke="var(--sfh-red)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={points('uniques')}
        fill="none"
        stroke="var(--sfh-navy)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray="4 3"
        opacity={0.7}
      />
    </svg>
  );
}

// ---- Web Vitals rating thresholds (Google-recommended) ---------------
type VitalName = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB';
const THRESHOLDS: Record<VitalName, { good: number; needs: number; unit: string }> = {
  LCP: { good: 2500, needs: 4000, unit: 'ms' },
  INP: { good: 200, needs: 500, unit: 'ms' },
  CLS: { good: 0.1, needs: 0.25, unit: '' },
  FCP: { good: 1800, needs: 3000, unit: 'ms' },
  TTFB: { good: 800, needs: 1800, unit: 'ms' },
};
function rateVital(name: VitalName, value: number): 'good' | 'needs' | 'poor' {
  const t = THRESHOLDS[name];
  if (value <= t.good) return 'good';
  if (value <= t.needs) return 'needs';
  return 'poor';
}
function fmtVital(name: VitalName, value: number) {
  if (name === 'CLS') return value.toFixed(2);
  return `${Math.round(value).toLocaleString()} ms`;
}

function countryName(cc: string) {
  try {
    // Names in English; falls back to code if unsupported.
    const n = new Intl.DisplayNames(['en'], { type: 'region' });
    return n.of(cc) ?? cc;
  } catch {
    return cc;
  }
}
function flagEmoji(cc: string) {
  if (!/^[A-Z]{2}$/.test(cc)) return '';
  const A = 0x1f1e6 - 65;
  return String.fromCodePoint(cc.charCodeAt(0) + A) + String.fromCodePoint(cc.charCodeAt(1) + A);
}

export default async function AnalyticsSection({
  searchRange,
}: {
  searchRange?: string;
}) {
  const range: Range = searchRange === '30' ? 30 : 7;

  // Fire-and-forget purge of rows older than 90 days, at most once/hour
  // per process. Non-blocking wrt the dashboard render.
  void opportunisticCleanup(90);

  const [
    totals,
    buckets,
    topPaths,
    topReferrers,
    devices,
    countries,
    continents,
    vitals,
    oldest,
  ] = await Promise.all([
    getAnalyticsTotals(range),
    getDailyBuckets(range),
    getTopPaths(range),
    getTopReferrers(range),
    getDeviceBreakdown(range),
    getCountryBreakdown(range),
    getContinentBreakdown(range),
    getVitalsP75(range),
    getOldestEventDate(),
  ]);
  const continentTotal = continents.reduce((sum, c) => sum + c.visits, 0);
  const continentName = (code: string) => {
    switch (code) {
      case 'AF': return 'Africa';
      case 'AN': return 'Antarctica';
      case 'AS': return 'Asia';
      case 'EU': return 'Europe';
      case 'NA': return 'North America';
      case 'OC': return 'Oceania';
      case 'SA': return 'South America';
      default: return code;
    }
  };

  const avgPerDay = Math.round(totals.visits / range);
  const deviceTotal = devices.reduce((sum, d) => sum + d.visits, 0);

  return (
    <section className="admin-analytics">
      <header className="admin-analytics__head">
        <div>
          <span className="admin-card__eyebrow">Analytics</span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '4px 0 0',
            }}
          >
            Visits, last {range} days
          </h2>
        </div>
        <div className="admin-analytics__toggle">
          <Link
            href="?range=7"
            className="admin-filterPill"
            data-active={range === 7 ? 'true' : undefined}
            scroll={false}
          >
            7 days
          </Link>
          <Link
            href="?range=30"
            className="admin-filterPill"
            data-active={range === 30 ? 'true' : undefined}
            scroll={false}
          >
            30 days
          </Link>
        </div>
      </header>

      <div className="admin-analytics__kpis">
        <div className="admin-card admin-analytics__kpi">
          <span className="admin-card__eyebrow">Total visits</span>
          <span className="admin-card__count">{totals.visits.toLocaleString()}</span>
          <span className="admin-card__cta" style={{ color: 'var(--admin-ink-3)' }}>
            Pageviews on the public site
          </span>
        </div>
        <div className="admin-card admin-analytics__kpi">
          <span className="admin-card__eyebrow">Unique visitors</span>
          <span className="admin-card__count">{totals.uniques.toLocaleString()}</span>
          <span className="admin-card__cta" style={{ color: 'var(--admin-ink-3)' }}>
            Distinct sessions (cookie-based)
          </span>
        </div>
        <div className="admin-card admin-analytics__kpi">
          <span className="admin-card__eyebrow">Avg / day</span>
          <span className="admin-card__count">{avgPerDay.toLocaleString()}</span>
          <span className="admin-card__cta" style={{ color: 'var(--admin-ink-3)' }}>
            Across the last {range} days
          </span>
        </div>
      </div>

      <div className="admin-card admin-analytics__chart">
        <div className="admin-analytics__chartHead">
          <div>
            <span className="admin-card__eyebrow">Daily visits</span>
            <div
              style={{
                display: 'flex',
                gap: 14,
                marginTop: 4,
                fontSize: 12,
                color: 'var(--admin-ink-3)',
              }}
            >
              <span>
                <span className="admin-analytics__legend admin-analytics__legend--visits" /> Visits
              </span>
              <span>
                <span className="admin-analytics__legend admin-analytics__legend--uniques" /> Uniques
              </span>
            </div>
          </div>
        </div>
        <Sparkline data={buckets} />
        <div className="admin-analytics__xaxis">
          <span>{formatShort(buckets[0]?.day ?? '')}</span>
          <span>{formatShort(buckets[buckets.length - 1]?.day ?? '')}</span>
        </div>
      </div>

      {/* Web Vitals card */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="admin-card__eyebrow">Performance</span>
            <div
              style={{
                fontSize: 12,
                color: 'var(--admin-ink-3)',
                marginTop: 2,
              }}
            >
              Web Vitals · p75 across the last {range} days
            </div>
          </div>
        </div>
        <div className="admin-vitals">
          {(['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as VitalName[]).map((name) => {
            const v = vitals[name];
            const rating = v ? rateVital(name, v.p75) : null;
            return (
              <div key={name} className={`admin-vital admin-vital--${rating ?? 'empty'}`}>
                <span className="admin-vital__label">{name}</span>
                <span className="admin-vital__value">
                  {v ? fmtVital(name, v.p75) : '—'}
                </span>
                <span className="admin-vital__samples">
                  {v ? `${v.samples.toLocaleString()} samples` : 'no data'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-analytics__grid">
        <div className="admin-card">
          <span className="admin-card__eyebrow">Top pages</span>
          {topPaths.length === 0 ? (
            <p className="admin-lede" style={{ marginTop: 10 }}>
              No pageviews yet.
            </p>
          ) : (
            <ul className="admin-analytics__list">
              {topPaths.map((row) => (
                <li key={row.path}>
                  <a
                    href={row.path}
                    target="_blank"
                    rel="noopener"
                    className="admin-analytics__listLink"
                  >
                    <code>{row.path}</code>
                  </a>
                  <span className="admin-analytics__listCount">
                    {row.visits.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-card">
          <span className="admin-card__eyebrow">Top referrers</span>
          {topReferrers.length === 0 ? (
            <p className="admin-lede" style={{ marginTop: 10 }}>
              No external referrers yet.
            </p>
          ) : (
            <ul className="admin-analytics__list">
              {topReferrers.map((row) => (
                <li key={row.referrer ?? ''}>
                  <a
                    href={row.referrer ?? '#'}
                    target="_blank"
                    rel="noopener"
                    className="admin-analytics__listLink"
                  >
                    {new URL(row.referrer ?? '').host}
                  </a>
                  <span className="admin-analytics__listCount">
                    {row.visits.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="admin-analytics__grid">
        <div className="admin-card">
          <span className="admin-card__eyebrow">Devices</span>
          {deviceTotal === 0 ? (
            <p className="admin-lede" style={{ marginTop: 10 }}>
              No device data yet.
            </p>
          ) : (
            <ul className="admin-analytics__bars">
              {devices.map((d) => {
                const pct = Math.round((d.visits / deviceTotal) * 100);
                return (
                  <li key={d.device ?? 'unknown'}>
                    <div className="admin-analytics__barHead">
                      <span style={{ textTransform: 'capitalize' }}>
                        {d.device ?? 'unknown'}
                      </span>
                      <span
                        style={{ color: 'var(--admin-ink-3)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {pct}% · {d.visits.toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-analytics__barTrack">
                      <div
                        className="admin-analytics__barFill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="admin-card">
          <span className="admin-card__eyebrow">Continents</span>
          {continentTotal === 0 ? (
            <p className="admin-lede" style={{ marginTop: 10 }}>
              No continent data yet. Requires the upstream
              <code>x-continent-code</code> header.
            </p>
          ) : (
            <ul className="admin-analytics__bars">
              {continents.map((c) => {
                const pct = Math.round((c.visits / continentTotal) * 100);
                return (
                  <li key={c.continent ?? 'unknown'}>
                    <div className="admin-analytics__barHead">
                      <span>{continentName(c.continent ?? 'unknown')}</span>
                      <span
                        style={{
                          color: 'var(--admin-ink-3)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {pct}% · {c.visits.toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-analytics__barTrack">
                      <div
                        className="admin-analytics__barFill"
                        style={{
                          width: `${pct}%`,
                          background:
                            'linear-gradient(90deg, var(--sfh-navy), var(--sfh-navy-deep))',
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="admin-card">
          <span className="admin-card__eyebrow">Top countries</span>
          {countries.length === 0 ? (
            <p className="admin-lede" style={{ marginTop: 10 }}>
              No country data yet. Waiting for the first visit with an
              upstream <code>x-country-code</code> header.
            </p>
          ) : (
            <ul className="admin-analytics__list">
              {countries.map((row) => (
                <li key={row.country ?? ''}>
                  <span className="admin-analytics__listLink">
                    <span style={{ marginRight: 8 }} aria-hidden="true">
                      {flagEmoji(row.country ?? '')}
                    </span>
                    {countryName(row.country ?? '')}
                  </span>
                  <span className="admin-analytics__listCount">
                    {row.visits.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <CleanupCard oldest={oldest ? oldest.toString() : null} />
    </section>
  );
}
