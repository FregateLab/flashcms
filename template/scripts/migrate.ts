import { config } from 'dotenv';
config({ path: '.env.local' });

// Runs the drizzle migrations in db/migrations/ against DATABASE_URI.
//
// We use drizzle-orm's programmatic migrator instead of `drizzle-kit
// migrate` because the CLI has a bug in the 0.31.x line where it exits
// with a non-zero code after successfully applying migrations (the
// connection pool isn't drained cleanly). That silently short-circuits
// any `db:migrate && ...` chain (e.g. a release step running
// `npm run db:migrate && npm run build`).
//
// Wired as `"db:migrate": "tsx scripts/migrate.ts"` in
// snippets/package.json.merge.json. Same migrations folder and
// __drizzle_migrations bookkeeping as drizzle-kit, so the two are
// interchangeable.
async function main() {
  const { Pool } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');

  const connectionString = process.env.DATABASE_URI;
  if (!connectionString) {
    throw new Error('DATABASE_URI is not set. Add it to .env.local.');
  }

  const pool = new Pool({ connectionString, max: 1 });
  const db = drizzle(pool);

  console.log('Applying migrations from ./db/migrations …');
  await migrate(db, { migrationsFolder: './db/migrations' });
  console.log('Migrations applied.');

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
