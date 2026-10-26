CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"status" varchar(16) DEFAULT 'subscribed' NOT NULL,
	"ack_consent" boolean DEFAULT false NOT NULL,
	"unsubscribe_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(32) DEFAULT 'footer',
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_site_email_idx" ON "newsletter_subscribers" USING btree ("site_id","email");--> statement-breakpoint
CREATE INDEX "newsletter_site_status_idx" ON "newsletter_subscribers" USING btree ("site_id","status");