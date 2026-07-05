ALTER TABLE "analytics_events" ADD COLUMN "continent" varchar(2);--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "seo" jsonb;