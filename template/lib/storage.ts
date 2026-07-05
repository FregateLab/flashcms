import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

// ---------------------------------------------------------------------
// Dokwe S3-compatible storage client.
//
// Per docs at https://dokwe.com/docs/storage:
//   - endpoint:      https://<slug>-s3.dokwe.com
//   - bucket:        the same <slug>
//   - path-style addressing is mandatory (no virtual-host)
//   - SigV4 with region us-east-1
//
// Public URL layout: https://<slug>-s3.dokwe.com/<slug>/<key>
// ---------------------------------------------------------------------

const slug = process.env.DOKWE_SLUG;
const accessKeyId = process.env.DOKWE_STORAGE_KEY;
const secretAccessKey = process.env.DOKWE_SECRET;

if (!slug) throw new Error('DOKWE_SLUG is not set.');
if (!accessKeyId) throw new Error('DOKWE_STORAGE_KEY is not set.');
if (!secretAccessKey) throw new Error('DOKWE_SECRET is not set.');

const ENDPOINT = `https://${slug}-s3.dokwe.com`;
const BUCKET = slug;

const globalForS3 = globalThis as unknown as { s3?: S3Client };
export const s3 =
  globalForS3.s3 ??
  new S3Client({
    endpoint: ENDPOINT,
    region: 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
if (process.env.NODE_ENV !== 'production') globalForS3.s3 = s3;

/** Public URL for an object key. */
export function publicUrl(key: string): string {
  return `${ENDPOINT}/${BUCKET}/${key}`;
}

/** Upload a byte buffer to storage. Returns the public URL. */
export async function uploadToStorage(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  );
  return publicUrl(key);
}

export async function deleteFromStorage(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
