import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';

// ---------------------------------------------------------------------
// CMS version tracking. The consuming project keeps a copy of the
// CMS's canonical version.json at project root as `cms-version.json`.
// We compare that to a remote manifest (default: raw GitHub URL of the
// CMS repo's version.json) to figure out whether an update is available.
// ---------------------------------------------------------------------

export type ChangelogEntry = {
  version: string;
  date?: string;
  changes?: string[];
};

export type CmsVersionManifest = {
  name?: string;
  version: string;
  releasedAt?: string;
  summary?: string;
  notes?: string[];
  changelog?: ChangelogEntry[];
  tarballUrl?: string;
};

export type UpdateStatus =
  | 'up-to-date'
  | 'update-available'
  | 'ahead'
  | 'unknown';

/**
 * Very small semver compare — good enough for x.y.z with no
 * prereleases. Returns positive if `a > b`, negative if a < b, 0 for
 * equal.
 */
export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Read the version pinned in this deployment's cms-version.json. */
export const getInstalledVersion = cache(async (): Promise<CmsVersionManifest | null> => {
  try {
    const filePath = path.join(process.cwd(), 'cms-version.json');
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as CmsVersionManifest;
  } catch {
    return null;
  }
});

/** Fetch the remote manifest from CMS_MANIFEST_URL. */
export async function getRemoteVersion(): Promise<CmsVersionManifest | null> {
  const url = process.env.CMS_MANIFEST_URL;
  if (!url) return null;
  try {
    const res = await fetch(url, {
      // Never cache — we always want a fresh comparison.
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as CmsVersionManifest;
  } catch {
    return null;
  }
}

export function statusFrom(
  installed: CmsVersionManifest | null,
  remote: CmsVersionManifest | null,
): UpdateStatus {
  if (!installed || !remote) return 'unknown';
  const diff = compareSemver(remote.version, installed.version);
  if (diff > 0) return 'update-available';
  if (diff < 0) return 'ahead';
  return 'up-to-date';
}

/** Return the changelog entries strictly newer than `fromVersion`. */
export function changesSince(
  changelog: ChangelogEntry[] | undefined,
  fromVersion: string,
): ChangelogEntry[] {
  if (!changelog) return [];
  return changelog
    .filter((c) => compareSemver(c.version, fromVersion) > 0)
    .sort((a, b) => compareSemver(b.version, a.version));
}
