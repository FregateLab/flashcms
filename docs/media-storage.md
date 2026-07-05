# Media + storage

## Bucket layout

Object keys look like:

```
<site-slug>/<yyyy>/<mm>/<uuid>-<filename-slug>.<ext>
```

e.g. `sfhgroup/2026/07/9f8a1e3c-hero-photo.jpg`. Objects are stored
with `ACL: public-read` so the URL is directly consumable.

## S3 client

`lib/storage.ts` configures an `@aws-sdk/client-s3` `S3Client`:

```ts
new S3Client({
  endpoint: `https://${slug}-s3.dokwe.com`,
  region: 'us-east-1',                // SigV4 requires a region string
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,               // Dokwe uses path-style
});
```

### Using a different S3 provider

- **AWS S3**: change endpoint to `undefined` (default) and
  `forcePathStyle: false`. Bucket becomes independent of DOKWE_SLUG.
- **Cloudflare R2**: `endpoint = https://<account_id>.r2.cloudflarestorage.com`,
  `forcePathStyle: true`.
- **MinIO / Backblaze / any S3**: set `endpoint`, `region`,
  `credentials`, `forcePathStyle` as their docs recommend.

The `publicUrl(key)` helper builds the public URL — override it if your
CDN is at a different host than the storage endpoint.

## Upload flow

```
MediaUploader (client)
  → uploadMedia server action
    → uploadToStorage (server, Node runtime, buffers file into RAM)
      → PutObjectCommand
    → insert into `media` table
  ← revalidatePath('/admin/media')
```

Uploads are bounded by `MAX_UPLOAD_BYTES` in `lib/media.ts`
(15 MB default) and by `next.config.mjs::experimental.serverActions.bodySizeLimit`
(20 MB — always set higher than the media cap so the server action
processes the file rather than 413'ing).

## Media picker

`MediaPicker.tsx` is the reusable modal. Every Puck image field goes
through `MediaField.tsx` which shows a thumbnail preview + a Browse
button that opens the picker. TipTap's Image toolbar button opens the
same picker inside `PostEditor.tsx`.

Fetches media list via `listMedia()` server action on open.

## Deletion

`deleteMedia`:
1. Deletes the S3 object (`DeleteObjectCommand`).
2. Removes the `media` row.

Failures on the S3 side are swallowed so the DB stays consistent.
Orphan objects can be reconciled with a periodic S3-listing → DB-diff
script (not shipped).

## What's not included

- **Image resizing / responsive srcset** — every `<img>` renders at
  its natural size. Add `next/image` or a resizer at the block render
  level if needed.
- **Server-side dimension extraction** — `media.width` / `media.height`
  columns exist but stay `null`. Add on the client with a `<canvas>`
  before upload or on the server with `sharp` / `probe-image-size`.
- **Signed pre-uploads** — currently the file uploads through the Node
  server. Switch to presigned PUTs (via `@aws-sdk/s3-request-presigner`)
  if you're pushing very large files or want to unload bandwidth from
  the app server.

## Backup

Nothing built-in. To back up:

```bash
# Media (via aws CLI, works against any S3 endpoint)
aws --endpoint-url=https://<slug>-s3.dokwe.com \
    s3 sync s3://<slug>/ ./media-backup/

# Postgres
pg_dump $DATABASE_URI --format=custom --file=./sfh.dump
```

Restore by putting the media back into the bucket at the same keys and
`pg_restore`ing the DB.
