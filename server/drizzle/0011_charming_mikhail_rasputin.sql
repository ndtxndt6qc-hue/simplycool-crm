CREATE TYPE "public"."booking_status" AS ENUM('bestaetigt', 'storniert');--> statement-breakpoint
CREATE TABLE "booking_availability_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"wochentag" integer NOT NULL,
	"startzeit" varchar(5) NOT NULL,
	"endzeit" varchar(5) NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_blocked_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"datum" date NOT NULL,
	"startzeit" varchar(5),
	"endzeit" varchar(5),
	"grund" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"datum" date NOT NULL,
	"startzeit" varchar(5) NOT NULL,
	"endzeit" varchar(5) NOT NULL,
	"name" varchar(255) NOT NULL,
	"telefon" varchar(50),
	"email" varchar(255),
	"plz" varchar(10) NOT NULL,
	"ort" varchar(255) NOT NULL,
	"nachricht" text,
	"quelle" "lead_quelle" DEFAULT 'website' NOT NULL,
	"status" "booking_status" DEFAULT 'bestaetigt' NOT NULL,
	"lead_id" integer,
	"ics_uid" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "termin_dauer_minuten" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;