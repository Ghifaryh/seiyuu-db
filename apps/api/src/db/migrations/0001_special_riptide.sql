ALTER TABLE "news_post" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "seiyuu" ADD CONSTRAINT "seiyuu_source_unique" UNIQUE("source");--> statement-breakpoint
ALTER TABLE "anime" ADD CONSTRAINT "anime_source_unique" UNIQUE("source");