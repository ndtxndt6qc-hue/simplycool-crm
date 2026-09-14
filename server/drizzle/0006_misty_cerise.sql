CREATE TYPE "public"."abklaerung_durch" AS ENUM('simplycool', 'bauseits');--> statement-breakpoint
ALTER TYPE "public"."quote_item_typ" ADD VALUE 'rabatt';--> statement-breakpoint
ALTER TABLE "quote_items" ADD COLUMN "optional" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "abklaerung_durch" "abklaerung_durch";