ALTER TABLE "posts" ADD COLUMN "external_url" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "press_type" varchar(16) DEFAULT 'story' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;