CREATE TABLE "news_seiyuu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"news_id" uuid NOT NULL,
	"seiyuu_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news_seiyuu" ADD CONSTRAINT "news_seiyuu_news_id_news_post_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_seiyuu" ADD CONSTRAINT "news_seiyuu_seiyuu_id_seiyuu_id_fk" FOREIGN KEY ("seiyuu_id") REFERENCES "public"."seiyuu"("id") ON DELETE cascade ON UPDATE no action;