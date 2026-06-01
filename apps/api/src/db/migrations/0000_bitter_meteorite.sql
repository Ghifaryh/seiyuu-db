CREATE TABLE "seiyuu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_romaji" text NOT NULL,
	"name_kanji" text,
	"name_aliases" text[],
	"birthdate" date,
	"birthplace" text,
	"agency" text,
	"is_singer" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"image_url" text,
	"source" text,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seiyuu_enrichment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seiyuu_id" uuid NOT NULL,
	"biography" text,
	"music_singles" text[],
	"music_albums" text[],
	"admin_notes" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "anime" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_romaji" text NOT NULL,
	"title_native" text,
	"season_year" integer,
	"season_quarter" text,
	"studio" text,
	"status" text,
	"cover_url" text,
	"source" text,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "character" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anime_id" uuid NOT NULL,
	"name_romaji" text NOT NULL,
	"name_kanji" text,
	"role_type" text
);
--> statement-breakpoint
CREATE TABLE "voice_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seiyuu_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"anime_id" uuid NOT NULL,
	"role_type" text,
	"language" text DEFAULT 'Japanese'
);
--> statement-breakpoint
CREATE TABLE "pairing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seiyuu_a_id" uuid NOT NULL,
	"seiyuu_b_id" uuid NOT NULL,
	"pair_name" text,
	"description" text,
	"is_auto_detected" boolean DEFAULT true,
	"shared_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pairing_anime" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pairing_id" uuid NOT NULL,
	"anime_id" uuid NOT NULL,
	"char_a_id" uuid,
	"char_b_id" uuid
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "news_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" text,
	"seiyuu_id" uuid,
	"created_by" uuid,
	"published_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "seiyuu_enrichment" ADD CONSTRAINT "seiyuu_enrichment_seiyuu_id_seiyuu_id_fk" FOREIGN KEY ("seiyuu_id") REFERENCES "public"."seiyuu"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character" ADD CONSTRAINT "character_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_role" ADD CONSTRAINT "voice_role_seiyuu_id_seiyuu_id_fk" FOREIGN KEY ("seiyuu_id") REFERENCES "public"."seiyuu"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_role" ADD CONSTRAINT "voice_role_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_role" ADD CONSTRAINT "voice_role_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing" ADD CONSTRAINT "pairing_seiyuu_a_id_seiyuu_id_fk" FOREIGN KEY ("seiyuu_a_id") REFERENCES "public"."seiyuu"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing" ADD CONSTRAINT "pairing_seiyuu_b_id_seiyuu_id_fk" FOREIGN KEY ("seiyuu_b_id") REFERENCES "public"."seiyuu"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_anime" ADD CONSTRAINT "pairing_anime_pairing_id_pairing_id_fk" FOREIGN KEY ("pairing_id") REFERENCES "public"."pairing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_anime" ADD CONSTRAINT "pairing_anime_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_anime" ADD CONSTRAINT "pairing_anime_char_a_id_character_id_fk" FOREIGN KEY ("char_a_id") REFERENCES "public"."character"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_anime" ADD CONSTRAINT "pairing_anime_char_b_id_character_id_fk" FOREIGN KEY ("char_b_id") REFERENCES "public"."character"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_post" ADD CONSTRAINT "news_post_seiyuu_id_seiyuu_id_fk" FOREIGN KEY ("seiyuu_id") REFERENCES "public"."seiyuu"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_post" ADD CONSTRAINT "news_post_created_by_app_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;