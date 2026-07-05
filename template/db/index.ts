import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URI;
if (!connectionString) {
  throw new Error('DATABASE_URI is not set. Add it to .env.local.');
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
