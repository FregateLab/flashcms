CREATE TABLE IF NOT EXISTS "gallery_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"image" text NOT NULL,
	"caption" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gallery_photos_site_published_idx" ON "gallery_photos" USING btree ("site_id","is_published");
