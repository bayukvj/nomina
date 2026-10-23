ALTER TABLE "members" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "google_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "members_google_id_idx" ON "members" USING btree ("google_id");