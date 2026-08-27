CREATE TYPE "public"."gemeinde_anforderungstyp" AS ENUM('keine', 'meldepflicht', 'baubewilligungspflicht', 'unklar_abklaeren');--> statement-breakpoint
ALTER TYPE "public"."quote_item_typ" ADD VALUE 'gemeindeabklaerung';--> statement-breakpoint
CREATE TABLE "gemeinde_anforderungen" (
	"id" serial PRIMARY KEY NOT NULL,
	"kanton" varchar(2) NOT NULL,
	"gemeinde_name" varchar(255) NOT NULL,
	"bfs_nummer" integer,
	"anforderungstyp" "gemeinde_anforderungstyp" DEFAULT 'unklar_abklaeren' NOT NULL,
	"beschreibung" text,
	"kosten_pauschale" numeric(10, 2),
	"bearbeitungsdauer_tage" integer,
	"quelle" text,
	"zuletzt_geprueft_am" date,
	"erstellt_am" timestamp DEFAULT now() NOT NULL,
	"aktualisiert_am" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gemeinde_anforderungen_kanton_gemeinde_name_unique" UNIQUE("kanton","gemeinde_name")
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "gemeinde_anforderung_id" integer;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "gemeinde_abklaerung_vorgeschlagen" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_gemeinde_anforderung_id_gemeinde_anforderungen_id_fk" FOREIGN KEY ("gemeinde_anforderung_id") REFERENCES "public"."gemeinde_anforderungen"("id") ON DELETE set null ON UPDATE no action;