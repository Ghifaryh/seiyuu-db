CREATE TABLE "game_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seiyuu_id" uuid NOT NULL,
	"game_title" text NOT NULL,
	"character_name" text NOT NULL,
	"role_type" text,
	"source" text,
	CONSTRAINT "game_role_source_unique" UNIQUE("source")
);
--> statement-breakpoint
ALTER TABLE "game_role" ADD CONSTRAINT "game_role_seiyuu_id_seiyuu_id_fk" FOREIGN KEY ("seiyuu_id") REFERENCES "public"."seiyuu"("id") ON DELETE cascade ON UPDATE no action;