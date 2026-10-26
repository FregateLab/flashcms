/**
 * Compresses images in ./public/ in place. Same URLs, smaller files.
 * Requires the `sharp` devDependency (see snippets/package.json.merge.json).
 * Commit before running --apply so you can diff / revert.
 *
 * Runs against .jpg/.jpeg/.png/.webp files. Skips SVG (already tiny),
 * GIF (rare + fragile), and PDF (not an image).
 *
 * Two-pass logic per file:
 *   1. Resize down to MAX_WIDTH_PX if the image is wider than that.
 *   2. Re-encode:
 *      - JPEG:   quality 82, mozjpeg-style progressive.
 *      - PNG w/ alpha:      stay PNG, palette-optimize.
 *      - PNG w/o alpha:     convert to JPEG (visually lossless, much
 *                           smaller for photos). Slug reused; the
 *                           .png filename stays for URL-stability.
 *      - WebP:   quality 82.
 *
 * Modes:
 *   dry (default) — walk the tree, print projected savings, write
 *                    nothing.
 *   apply         — compress in place. Files under MIN_BYTES are
 *                    skipped. Files where the compressed result isn't
 *                    at least 10% smaller than the original are also
 *                    skipped (compression not worth the quality trade).
 *
 * Usage:
 *   npx tsx scripts/compress-public-images.ts             # dry-run
 *   npx tsx scripts/compress-public-images.ts --apply     # apply
 *   npx tsx scripts/compress-public-images.ts --apply --min-bytes 100000
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const MIN_BYTES = (() => {
  const idx = args.indexOf('--min-bytes');
  if (idx >= 0 && args[idx + 1]) return Number(args[idx + 1]);
  return 200_000; // 200 KB
})();
const MAX_WIDTH_PX = 2400;
const MIN_SAVINGS_RATIO = 0.10; // require ≥10% saving to bother writing

const KIND_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function main() {
  const sharp = (await import('sharp')).default;

  const root = path.resolve('./public');
  console.log(
    `${APPLY ? 'APPLYING' : 'DRY-RUN'} · scanning ${root} · min-bytes ${MIN_BYTES}`,
  );

  const targets = await walk(root);
  targets.sort((a, b) => b.size - a.size);

  let totalBefore = 0;
  let totalAfter = 0;
  let files = 0;
  let skipped = 0;

  for (const t of targets) {
    if (t.size < MIN_BYTES) {
      skipped++;
      continue;
    }
    files++;
    totalBefore += t.size;

    const buf = await fs.readFile(t.abs);
    let img = sharp(buf, { failOn: 'none' });
    const meta = await img.metadata();

    // Resize if needed.
    if (meta.width && meta.width > MAX_WIDTH_PX) {
      img = img.resize({ width: MAX_WIDTH_PX, withoutEnlargement: true });
    }

    // Pick output encoder based on input format + alpha channel.
    const ext = path.extname(t.abs).toLowerCase();
    let outBuf: Buffer;
    let outNote: string;
    if (ext === '.jpg' || ext === '.jpeg') {
      outBuf = await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      outNote = 'jpeg q82';
    } else if (ext === '.webp') {
      outBuf = await img.webp({ quality: 82 }).toBuffer();
      outNote = 'webp q82';
    } else if (ext === '.png') {
      const hasAlpha = !!meta.hasAlpha;
      if (hasAlpha) {
        // Keep PNG, palette-optimize.
        outBuf = await img
          .png({ compressionLevel: 9, palette: true, quality: 90 })
          .toBuffer();
        outNote = 'png+alpha';
      } else {
        // Re-encode as JPEG (keep .png extension for URL stability; the
        // magic bytes tell browsers it's actually JPEG).
        outBuf = await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
        outNote = 'png→jpeg';
      }
    } else {
      continue; // shouldn't happen; walk filters extensions.
    }

    const saved = t.size - outBuf.length;
    const savedRatio = saved / t.size;
    if (savedRatio < MIN_SAVINGS_RATIO) {
      console.log(
        `  SKIP ${rel(t.abs, root)} · ${kb(t.size)} → ${kb(outBuf.length)} (${pct(savedRatio)}, ${outNote})`,
      );
      totalAfter += t.size;
      continue;
    }

    console.log(
      `  ${APPLY ? 'WRITE' : 'PLAN'} ${rel(t.abs, root)} · ${kb(t.size)} → ${kb(outBuf.length)} (-${pct(savedRatio)}, ${outNote})`,
    );

    if (APPLY) {
      await fs.writeFile(t.abs, outBuf);
      totalAfter += outBuf.length;
    } else {
      totalAfter += outBuf.length;
    }
  }

  const savedBytes = totalBefore - totalAfter;
  console.log('');
  console.log(`Files processed: ${files} (skipped ${skipped} under ${MIN_BYTES} bytes)`);
  console.log(
    `Before: ${mb(totalBefore)} · After: ${mb(totalAfter)} · Saved: ${mb(savedBytes)} (${pct(savedBytes / (totalBefore || 1))})`,
  );
  if (!APPLY) console.log(`Re-run with --apply to write changes.`);
}

// ---- walker + formatters ----------------------------------------------
async function walk(dir: string): Promise<{ abs: string; size: number }[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: { abs: string; size: number }[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(full)));
      continue;
    }
    const ext = path.extname(e.name).toLowerCase();
    if (!KIND_EXTS.has(ext)) continue;
    const st = await fs.stat(full);
    out.push({ abs: full, size: st.size });
  }
  return out;
}

function rel(abs: string, root: string) {
  return path.relative(root, abs);
}
function kb(n: number) {
  return `${(n / 1024).toFixed(0)} KB`;
}
function mb(n: number) {
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
function pct(r: number) {
  return `${(r * 100).toFixed(1)}%`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
