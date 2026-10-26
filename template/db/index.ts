import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Read lazily — throwing at module load blocks `next build`'s route-
// collection phase (any route that imports @/db fails to load) when
// DATABASE_URI isn't set in the build env. Pool creation with an
// undefined connection string is a no-op until an actual query fires;
// missing-env failures then surface at runtime at the real call site
// rather than during a build phase where the var is legitimately absent.
const connectionString = process.env.DATABASE_URI;
if (!connectionString && process.env.NODE_ENV !== 'production') {
  console.warn('[db] DATABASE_URI is not set. Add it to .env.local.');
}

// Reuse the pool across hot-reloads in dev so we don't leak connections.
const globalForPg = globalThis as unknown as { pool?: Pool };
const pool =
  globalForPg.pool ??
  new Pool({
    connectionString,
    max: 10,
  });
if (process.env.NODE_ENV !== 'production') globalForPg.pool = pool;

export const db = drizzle(pool, { schema });
export * from './schema';
