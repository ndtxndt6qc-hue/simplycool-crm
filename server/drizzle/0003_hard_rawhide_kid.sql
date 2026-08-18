CREATE TYPE "public"."order_document_typ" AS ENUM('abnahmeprotokoll_signiert', 'sonstiges');--> statement-breakpoint
ALTER TYPE "public"."checklist_punkt" ADD VALUE 'bohrpartner_termin_bestaetigt' BEFORE 'installation_durchgefuehrt';--> statement-breakpoint
ALTER TYPE "public"."checklist_punkt" ADD VALUE 'kunde_termin_bestaetigt' BEFORE 'installation_durchgefuehrt';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'storniert';--> statement-breakpoint
CREATE TABLE "order_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"typ" "order_document_typ" DEFAULT 'abnahmeprotokoll_signiert' NOT NULL,
	"dateipfad" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "menge" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "menge" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "menge" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "menge" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "quote_items" ALTER COLUMN "menge" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "quote_items" ALTER COLUMN "menge" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "bild_pfad" text;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "einheit" varchar(50);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "plz" varchar(10);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "ort" varchar(255);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "einheit" varchar(50);--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "preis_pro_3loch" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "quote_items" ADD COLUMN "einheit" varchar(50);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "garantie_zeit" varchar(100);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "abnahmeprotokoll_vorlage_pfad" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "installationsanweisung_vorlage_pfad" text;--> statement-breakpoint
ALTER TABLE "order_documents" ADD CONSTRAINT "order_documents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;