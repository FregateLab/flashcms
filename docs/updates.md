# Updating the CMS in a live project

The `/admin/cms` page checks a remote `version.json` and, when a newer
version is available, fires a webhook that tells your deploy platform
to pull + rebuild.

## Why it's a webhook and not "download files here"

Managed hosts (Dokwe, Vercel, Fly, Railway, etc.) run Node in
containers whose filesystem is either read-only or wiped on each
restart. Even when the filesystem *is* writable, a running Node
process won't re-import already-imported ES modules — so overwriting a
`.tsx` file at runtime does nothing until the next build. The honest
architecture is:

```
[ admin clicks "Update" ]
        │
        ▼
POST → CMS_UPDATE_WEBHOOK_URL   ← platform-owned URL that starts a build
        │
        ▼
[ your host pulls the latest git ]
        │
        ▼
[ your CI: git pull cms → rsync template/* → npm ci → db:migrate → build → deploy ]
```

The webhook is the trigger; your host does the actual work.

## Environment

Add to `.env.local` (and to your host's env):

```
CMS_MANIFEST_URL=https://raw.githubusercontent.com/FregateLab/flashcms/main/version.json
CMS_UPDATE_WEBHOOK_URL=<see below>
CMS_UPDATE_WEBHOOK_SECRET=<optional, generates x-cms-signature>
```

`CMS_MANIFEST_URL` should point at the raw `version.json` of your CMS
repo — the same file this dashboard compares its local
`cms-version.json` against.

## Webhook payload

The CMS `POST`s JSON:

```json
{
  "id": "26b8f81d-…",
  "triggeredAt": "2026-07-05T14:22:11.000Z",
  "targetVersion": "1.4.0",
  "triggeredBy": "editor@you.org",
  "source": "cms-admin"
}
```

Headers:

```
content-type: application/json
user-agent: sfh-cms-updater/1.0
x-cms-signature: sha256=<hex>          ← only when CMS_UPDATE_WEBHOOK_SECRET is set
```

Verify the HMAC on your receiver:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(body: string, header: string, secret: string) {
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}
```

## Platform recipes

### Dokwe

Dokwe supports **deploy hooks** — long-lived URLs that trigger a
rebuild.

1. Dashboard → your app → **Settings** → **Deploy hooks** → **Create**.
2. Copy the URL. Set `CMS_UPDATE_WEBHOOK_URL=<url>` in the app's env.
3. Add a **release step** to run after each build to keep the CMS files
   fresh:

   ```bash
   # Example release step (adjust for your repo layout)
   git clone --depth 1 git@github.com:FregateLab/flashcms.git /tmp/cms
   rsync -a --delete /tmp/cms/template/ ./
   cp /tmp/cms/version.json cms-version.json
   npm ci
   npm run db:migrate
   ```

4. Deploy once so the release step is in place.
5. Test: `/admin/cms` → Trigger update.

### Vercel

1. **Settings → Git → Deploy Hooks → Create Hook** — name it
   `sfh-cms-update`, branch `main`. Copy the URL.
2. Set `CMS_UPDATE_WEBHOOK_URL=<url>`.
3. For the actual sync, add a script to your build:

   ```json
   // package.json
   {
     "scripts": {
       "prebuild": "node scripts/sync-cms.mjs",
       "build": "next build && npm run db:migrate"
     }
   }
   ```

4. `scripts/sync-cms.mjs` clones the CMS repo and rsyncs. (See the
   `scripts/sync-cms.mjs` example below.)

### GitHub Actions (workflow_dispatch)

If you prefer a fully-git-mediated flow:

1. In your app repo, add a workflow with `on: workflow_dispatch`:

   ```yaml
   # .github/workflows/sync-cms.yml
   name: Sync CMS
   on: { workflow_dispatch: {} }
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Pull latest CMS
           run: |
             git clone --depth 1 git@github.com:FregateLab/flashcms.git /tmp/cms
             rsync -a --delete /tmp/cms/template/ ./
             cp /tmp/cms/version.json cms-version.json
         - uses: peter-evans/create-pull-request@v6
           with:
             commit-message: 'chore(cms): sync to v${{ github.event.inputs.version }}'
             branch: cms/sync
             title: 'CMS sync'
   ```

2. `CMS_UPDATE_WEBHOOK_URL=https://api.github.com/repos/OWNER/REPO/actions/workflows/sync-cms.yml/dispatches`
3. Because GitHub requires bearer auth, extend `lib/cms-actions.ts` to
   include an `Authorization: token …` header from a token stored in
   env.

## `scripts/sync-cms.mjs` example

```js
// scripts/sync-cms.mjs
import { execSync } from 'node:child_process';

const CMS_GIT = process.env.CMS_GIT ?? 'git@github.com:FregateLab/flashcms.git';
const TARGET = '/tmp/cms';

execSync(`rm -rf ${TARGET}`);
execSync(`git clone --depth 1 ${CMS_GIT} ${TARGET}`);
execSync(`rsync -a --delete ${TARGET}/template/ ./`);
execSync(`cp ${TARGET}/version.json cms-version.json`);
console.log('CMS synced.');
```

Wire it into `prebuild` so every build picks up the latest.

## Fallback: no webhook, manual update

The dashboard shows a copy-pasteable command block whenever
`CMS_UPDATE_WEBHOOK_URL` is unset and an update is available. It's the
same commands you'd put in a build/release step, but you run them on
your dev box and push the result.

## Bumping the version

When you ship CMS changes:

1. Update `cms/version.json` in the CMS repo — bump `version`, add a
   `changelog` entry with `changes: []`.
2. Commit + push to `main` (the branch `CMS_MANIFEST_URL` points at).
3. Every consuming project's `/admin/cms` now shows "Update available"
   with your changelog.

Semver hint:
- **major**: schema migrations that aren't backward compatible.
- **minor**: new blocks / features / routes.
- **patch**: bug fixes and copy tweaks.
