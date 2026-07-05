CREATE TABLE "analytics_vitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"path" varchar(512) NOT NULL,
	"name" varchar(8) NOT NULL,
	"value" integer NOT NULL,
	"session_id" varchar(64),
	"device_type" varchar(12),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "country" varchar(2);--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "language" varchar(8);--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "device_type" varchar(12);--> statement-breakpoint
ALTER TABLE "analytics_vitals" ADD CONSTRAINT "analytics_vitals_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vitals_site_created_idx" ON "analytics_vitals" USING btree ("site_id","created_at");--> statement-breakpoint
CREATE INDEX "vitals_site_name_idx" ON "analytics_vitals" USING btree ("site_id","name");