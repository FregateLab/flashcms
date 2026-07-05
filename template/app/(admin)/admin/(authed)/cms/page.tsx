import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  changesSince,
  getInstalledVersion,
  getRemoteVersion,
  statusFrom,
} from '@/lib/cms-version';
import UpdateButton from './UpdateButton';

function fmtDate(d: string | undefined) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function AdminCmsUpdatesPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') redirect('/admin');

  const [installed, remote] = await Promise.all([
    getInstalledVersion(),
    getRemoteVersion(),
  ]);
  const status = statusFrom(installed, remote);
  const newer = installed
    ? changesSince(remote?.changelog, installed.version)
    : [];

  const manifestUrl = process.env.CMS_MANIFEST_URL;
  const webhookConfigured = !!process.env.CMS_UPDATE_WEBHOOK_URL;

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-h1">CMS updates</h1>
          <p className="admin-lede">
            Check for updates to the SFH CMS package and trigger a
            redeploy when your host is ready to pull them in.
          </p>
        </div>
      </div>

      <div className="cmsUpd">
        {/* Version summary card */}
        <div className={`admin-card cmsUpd__hero cmsUpd__hero--${status}`}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 220 }}>
              <span className="admin-card__eyebrow">Installed</span>
              <div className="cmsUpd__version">
                {installed?.version ?? '—'}
              </div>
              {installed?.releasedAt && (
                <div className="cmsUpd__meta">
                  Released {fmtDate(installed.releasedAt)}
                </div>
              )}
            </div>
            <div style={{ fontSize: 22, color: 'var(--admin-ink-3)', alignSelf: 'center' }}>
              →
            </div>
            <div style={{ minWidth: 220, flex: 1 }}>
              <span className="admin-card__eyebrow">Latest</span>
              <div className="cmsUpd__version">
                {remote?.version ?? '—'}
              </div>
              {remote?.releasedAt && (
                <div className="cmsUpd__meta">
                  Released {fmtDate(remote.releasedAt)}
                </div>
              )}
              {remote?.summary && (
                <p className="cmsUpd__summary">{remote.summary}</p>
              )}
            </div>
            <div style={{ alignSelf: 'center', minWidth: 200, textAlign: 'right', flex: '1 0 auto' }}>
              <StatusPill status={status} />
              <div style={{ marginTop: 12 }}>
                <UpdateButton
                  disabled={status !== 'update-available' || !webhookConfigured}
                  status={status}
                  webhookConfigured={webhookConfigured}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Changelog */}
        {newer.length > 0 && (
          <div className="admin-card">
            <span className="admin-card__eyebrow">What&rsquo;s new</span>
            <div className="cmsUpd__changelog">
              {newer.map((entry) => (
                <div key={entry.version} className="cmsUpd__release">
                  <div className="cmsUpd__releaseHead">
                    <span className="cmsUpd__releaseVer">
                      v{entry.version}
                    </span>
                    {entry.date && (
                      <span className="cmsUpd__releaseDate">
                        {fmtDate(entry.date)}
                      </span>
                    )}
                  </div>
                  {entry.changes && (
                    <ul>
                      {entry.changes.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes from the latest release */}
        {remote?.notes && remote.notes.length > 0 && (
          <div className="admin-card">
            <span className="admin-card__eyebrow">Release notes</span>
            <ul className="cmsUpd__notes">
              {remote.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Setup card */}
        <div className="admin-card">
          <span className="admin-card__eyebrow">Setup</span>
          <p className="admin-lede" style={{ marginTop: 6, marginBottom: 12 }}>
            The updater checks the URL in <code>CMS_MANIFEST_URL</code> and
            fires the webhook in <code>CMS_UPDATE_WEBHOOK_URL</code>. See{' '}
            <code>cms/docs/updates.md</code> for platform-specific setup
            (Dokwe, Vercel, GitHub Actions).
          </p>
          <div className="cmsUpd__envGrid">
            <EnvRow
              name="CMS_MANIFEST_URL"
              value={manifestUrl}
              hint="Raw URL to the CMS repo's version.json"
            />
            <EnvRow
              name="CMS_UPDATE_WEBHOOK_URL"
              value={
                process.env.CMS_UPDATE_WEBHOOK_URL
                  ? '••• configured •••'
                  : undefined
              }
              hint="POST target that triggers your redeploy"
            />
            <EnvRow
              name="CMS_UPDATE_WEBHOOK_SECRET"
              value={
                process.env.CMS_UPDATE_WEBHOOK_SECRET
                  ? '••• configured •••'
                  : undefined
              }
              hint="Optional HMAC secret (signs the POST body as x-cms-signature)"
            />
          </div>
        </div>

        {/* No-webhook fallback */}
        {!webhookConfigured && status === 'update-available' && (
          <div
            className="admin-card"
            style={{ borderColor: 'var(--admin-warn-soft)' }}
          >
            <span
              className="admin-card__eyebrow"
              style={{ color: 'var(--admin-warn)' }}
            >
              Manual update
            </span>
            <p className="admin-lede" style={{ marginTop: 6 }}>
              No webhook is configured. To update, run these on the
              machine where your project lives:
            </p>
            <pre
              style={{
                background: 'var(--admin-surface-2)',
                border: '1px solid var(--admin-border)',
                borderRadius: 8,
                padding: 12,
                fontSize: 12.5,
                overflow: 'auto',
              }}
            >
{`# From the CMS repo:
cd ~/cms
git pull

# From your Next.js project:
cd ~/my-site
rsync -a --delete ~/cms/template/ ./
cp ~/cms/version.json cms-version.json
npm install
npm run db:migrate
# Commit, push, and let your CI/CD deploy.
`}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === 'update-available') {
    return (
      <span className="admin-pill admin-pill--accent" style={{ fontSize: 12 }}>
        Update available
      </span>
    );
  }
  if (status === 'up-to-date') {
    return (
      <span className="admin-pill admin-pill--published" style={{ fontSize: 12 }}>
        Up to date
      </span>
    );
  }
  if (status === 'ahead') {
    return (
      <span className="admin-pill admin-pill--info" style={{ fontSize: 12 }}>
        Ahead of remote
      </span>
    );
  }
  return (
    <span className="admin-pill admin-pill--neutral" style={{ fontSize: 12 }}>
      Unknown
    </span>
  );
}

function EnvRow({
  name,
  value,
  hint,
}: {
  name: string;
  value?: string;
  hint: string;
}) {
  const set = !!value;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        border: '1px solid var(--admin-border)',
        borderRadius: 8,
        background: 'var(--admin-surface-2)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--admin-ink-3)' }}>{hint}</div>
      </div>
      <span
        className={`admin-pill ${set ? 'admin-pill--published' : 'admin-pill--neutral'}`}
        style={{ fontSize: 11 }}
      >
        {set ? 'Set' : 'Missing'}
      </span>
    </div>
  );
}
