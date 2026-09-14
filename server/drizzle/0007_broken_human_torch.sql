CREATE TYPE "public"."order_referenz_foto_typ" AS ENUM('vorher', 'nachher');--> statement-breakpoint
ALTER TYPE "public"."lead_quelle" ADD VALUE 'google';--> statement-breakpoint
ALTER TYPE "public"."lead_quelle" ADD VALUE 'facebook';--> statement-breakpoint
ALTER TYPE "public"."lead_quelle" ADD VALUE 'flyer';--> statement-breakpoint
CREATE TABLE "order_referenz_fotos" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"typ" "order_referenz_foto_typ" NOT NULL,
	"dateipfad" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "referenz_freigegeben" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "referenz_beschreibung" text;--> statement-breakpoint
ALTER TABLE "order_referenz_fotos" ADD CONSTRAINT "order_referenz_fotos_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;