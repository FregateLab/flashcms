import { config } from 'dotenv';
config({ path: '.env.local' });

// db/index.ts throws at module-load time if DATABASE_URI is missing, so
// import it dynamically AFTER dotenv has populated process.env.
async function main() {
  const bcrypt = (await import('bcryptjs')).default;
  const { eq } = await import('drizzle-orm');
  const { db, sites, users } = await import('../db');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? 'SFH Admin';

  if (!adminEmail || !adminPassword) {
    console.error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD env vars, e.g.:\n' +
        '  ADMIN_EMAIL=you@sfhgroup.org ADMIN_PASSWORD=changeme npm run db:seed',
    );
    process.exit(1);
  }

  // ---- site ---------------------------------------------------------
  const siteSlug = 'sfhgroup';
  const [existingSite] = await db.select().from(sites).where(eq(sites.slug, siteSlug));
  const site =
    existingSite ??
    (
      await db
        .insert(sites)
        .values({
          slug: siteSlug,
          name: 'Society for Family Health',
          domain: 'sfhgroup.org',
        })
        .returning()
    )[0];
  console.log(existingSite ? `Site exists: ${site.slug}` : `Site created: ${site.slug}`);

  // ---- admin user ---------------------------------------------------
  const [existingUser] = await db.select().from(users).where(eq(users.email, adminEmail));
  if (existingUser) {
    console.log(`Admin user already exists: ${existingUser.email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const [newUser] = await db
    .insert(users)
    .values({
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: 'admin',
    })
    .returning();
  console.log(`Admin user created: ${newUser.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
