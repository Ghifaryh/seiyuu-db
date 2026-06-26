ALTER TABLE "character" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "voice_role" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "character" ADD CONSTRAINT "character_source_unique" UNIQUE("source");--> statement-breakpoint
ALTER TABLE "voice_role" ADD CONSTRAINT "voice_role_source_unique" UNIQUE("source");