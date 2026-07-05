/**
 * If you already have a next.config.mjs, MERGE the `experimental` block
 * into yours. The `bodySizeLimit` must be at least the max upload size
 * you enforce in lib/media.ts (default 15 MB).
 */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '20mb' },
  },
};

export default nextConfig;
