import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Next.js reads .env.local automatically; drizzle-kit doesn't, so load it here.
config({ path: '.env.local' });

const url = process.env.DATABASE_URI;
if (!url) {
  throw new Error('DATABASE_URI missing. Add it to .env.local before running drizzle-kit.');
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
