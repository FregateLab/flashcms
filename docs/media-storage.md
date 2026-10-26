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

`uploadMedia` returns `{ ok, urls }` — the public URLs of the stored
files, in upload order.

## Client-side compression (1.1.0)

Before anything is sent, `MediaUploader`, `MediaPicker` and
`ImageCropModal` pass each file through `components/compressImage.ts`:

- JPEG/PNG/WebP over **1.5 MB** are drawn onto a canvas, downscaled to
  at most **2400 px** on the long edge and re-encoded as JPEG (q 0.85).
  The original is kept if re-encoding doesn't make it smaller.
- GIF, SVG, PDFs and other non-images pass through untouched.
- Anything still above `MAX_CLIENT_UPLOAD_BYTES` after compression is
  rejected client-side with a friendly message (suggesting TinyJPG /
  TinyPNG) instead of a raw 413.

`MAX_CLIENT_UPLOAD_BYTES` defaults to 15 MB (matching `lib/media.ts`).
On hosts with a smaller body cap set `NEXT_PUBLIC_MAX_UPLOAD_MB`
(e.g. `2`) and lower `bodySizeLimit` / `MAX_UPLOAD_BYTES` to match.

## Image cropping (1.1.0)

`components/ImageCropModal.tsx` (built on `react-easy-crop`) crops a
**copy** of an image — the original is never modified. It's available
from the post cover image, gallery photos, and a "Crop" badge on every
image in the media picker. Presets: 21:9, 16:9, 1:1, 4:5, free (edit
`RATIOS` in the component to match your templates).

On save the crop is canvas-encoded, compressed, uploaded through
`uploadMedia` as a new media-library file, and the new URL is handed
back to the caller.

**CORS requirement:** the source image is loaded with
`crossOrigin="anonymous"` so the canvas can read its pixels. Your bucket
must answer image GETs with `Access-Control-Allow-Origin` covering the
admin origin (or `*` for public-read buckets), otherwise saving fails
with a tainted-canvas error. Images under `/public` are same-origin and
always work.

## Compressing bundled `/public` images

`scripts/compress-public-images.ts` (needs the `sharp` devDependency)
shrinks images under `./public` in place — same URLs, smaller files:

```bash
npx tsx scripts/compress-public-images.ts            # dry run, prints savings
npx tsx scripts/compress-public-images.ts --apply    # write changes
npx tsx scripts/compress-public-images.ts --apply --min-bytes 100000
```

Resizes to 2400 px max width, re-encodes JPEG/WebP at q82, palette-
optimises PNGs with alpha and converts opaque PNGs to JPEG bytes while
keeping the `.png` filename (browsers sniff the content). Files that
wouldn't shrink by at least 10% are skipped. Commit first so you can
diff/revert.

## Media picker

`MediaPicker.tsx` is the reusable modal. Every Puck image field goes
through `MediaField.tsx` which shows a thumbnail preview + a Browse
button that opens the picker. TipTap's Image toolbar button opens the
same picker inside `PostEditor.tsx`.

The URL input in `MediaField` is `type="text"` (not `url`) so it
accepts both absolute URLs and site-relative `/public` paths such as
`/assets/hero.jpg`.

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
