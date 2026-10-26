-- accounts.expires_at was created as text in 0000; Auth.js expects an
-- integer (OAuth token expiry, seconds). The originally generated
-- `ALTER COLUMN … SET DATA TYPE integer` fails on every database —
-- Postgres has no automatic text → integer cast, even on an empty
-- table — so fresh installs could never get past this migration.
-- Drop + re-add instead (fixed in flashcms 1.1.0). The column only holds
-- OAuth token expiry, which the credentials provider never writes; any
-- OAuth sessions would simply re-authenticate. Databases that already
-- applied the old statement skip this file (the migrator tracks applied
-- migrations by timestamp), so editing it is safe.
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "expires_at";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "expires_at" integer;
