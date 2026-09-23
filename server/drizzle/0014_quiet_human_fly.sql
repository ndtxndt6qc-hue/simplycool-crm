ALTER TABLE "orders" ADD COLUMN "abnahme_unterzeichner_name" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "abnahme_bemerkungen" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "abnahme_unterschrift" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "abnahme_abgeschlossen_am" timestamp;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "abnahmeprotokoll_text" text;