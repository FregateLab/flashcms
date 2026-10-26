import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listSubscribers, subscriberCounts, type SubscriberFilter } from '@/lib/newsletter';
import SubscriberActions from './SubscriberActions';

function formatDate(d: Date | string | null | undefined) {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const FILTERS: { key: SubscriberFilter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'unsubscribed', label: 'Unsubscribed' },
  { key: 'all', label: 'All' },
];

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  // Subscriber data is admin-only. Middleware already redirects editors
  // (lib/auth.config.ts); this is the belt to that pair of braces so a
  // misconfigured matcher renders a message instead of a 500.
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== 'admin') {
    return (
      <div className="admin-card admin-empty">
        <p>The newsletter list is visible to admins only.</p>
      </div>
    );
  }

  const params = await searchParams;
  const filter: SubscriberFilter =
    params.filter === 'unsubscribed' || params.filter === 'all'
      ? params.filter
      : 'active';
  const query = (params.q ?? '').trim();

  const [rows, counts] = await Promise.all([
    listSubscribers(filter, query),
    subscriberCounts(),
  ]);

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">Newsletter</h1>
          <p className="admin-lede">
            Footer sign-ups. <strong>{counts.active}</strong> active,{' '}
            {counts.unsubscribed} unsubscribed.
          </p>
        </div>
        <a
          href="/api/newsletter/export"
          className="admin-btn"
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          Export CSV
        </a>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          const qsuffix = query ? `&q=${encodeURIComponent(query)}` : '';
          return (
            <Link
              key={f.key}
              href={`/admin/newsletter?filter=${f.key}${qsuffix}`}
              className={
                active
                  ? 'admin-pill admin-pill--accent'
                  : 'admin-pill admin-pill--neutral'
              }
              style={{ textDecoration: 'none' }}
            >
              {f.label}
              {f.key === 'active' && ` (${counts.active})`}
              {f.key === 'unsubscribed' && ` (${counts.unsubscribed})`}
              {f.key === 'all' && ` (${counts.total})`}
            </Link>
          );
        })}
        <form
          method="get"
          action="/admin/newsletter"
          style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}
        >
          <input type="hidden" name="filter" value={filter} />
          <input
            className="admin-input"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search email…"
            style={{ minWidth: 220, padding: '6px 10px', fontSize: 13 }}
          />
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="admin-lede" style={{ marginTop: 24 }}>
          No subscribers match this view yet.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th className="narrow">Source</th>
              <th className="narrow">Subscribed</th>
              <th className="narrow">Unsubscribed</th>
              <th className="narrow">Status</th>
              <th className="narrow right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.email}</td>
                <td className="narrow">{row.source ?? '-'}</td>
                <td className="narrow tcell-date">
                  {formatDate(row.subscribedAt)}
                </td>
                <td className="narrow tcell-date">
                  {formatDate(row.unsubscribedAt)}
                </td>
                <td className="narrow">
                  <span
                    className={
                      row.status === 'subscribed'
                        ? 'admin-pill admin-pill--published'
                        : 'admin-pill admin-pill--neutral'
                    }
                  >
                    {row.status}
                  </span>
                </td>
                <td className="narrow right">
                  <SubscriberActions id={row.id} status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
