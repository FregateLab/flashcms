CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"path" varchar(512) NOT NULL,
	"referrer" varchar(512),
	"session_id" varchar(64) NOT NULL,
	"user_agent" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_site_created_idx" ON "analytics_events" USING btree ("site_id","created_at");--> statement-breakpoint
CREATE INDEX "analytics_site_path_idx" ON "analytics_events" USING btree ("site_id","path");