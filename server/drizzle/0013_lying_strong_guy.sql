ALTER TABLE "quotes" ADD COLUMN "public_token" varchar(64);--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "angenommen_am" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "angenommen_ip" varchar(64);--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "angenommen_user_agent" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_public_token_unique" UNIQUE("public_token");