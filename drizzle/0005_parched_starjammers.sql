CREATE TYPE "public"."ad_placement" AS ENUM('below_hero', 'sidebar_top', 'sidebar_bottom', 'in_article', 'after_content', 'between_posts', 'footer');--> statement-breakpoint
CREATE TYPE "public"."ad_status" AS ENUM('active', 'paused', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."ad_type" AS ENUM('image', 'code', 'adsense');--> statement-breakpoint
CREATE TABLE "ads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "ad_type" DEFAULT 'image' NOT NULL,
	"placement" "ad_placement" DEFAULT 'sidebar_top' NOT NULL,
	"media_id" integer,
	"link_url" text,
	"alt_text" text,
	"code" text,
	"label" text,
	"target_categories" jsonb DEFAULT '[]'::jsonb,
	"status" "ad_status" DEFAULT 'active' NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ads_placement_idx" ON "ads" USING btree ("placement");--> statement-breakpoint
CREATE INDEX "ads_status_idx" ON "ads" USING btree ("status");