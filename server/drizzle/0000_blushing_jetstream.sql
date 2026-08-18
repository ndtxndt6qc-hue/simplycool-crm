CREATE TYPE "public"."checklist_punkt" AS ENUM('geraet_bestellt', 'bohrpartner_beauftragt', 'termin_bestaetigt', 'installation_durchgefuehrt', 'abnahme_kunde');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('offen', 'teilzahlung', 'bezahlt', 'ueberfaellig');--> statement-breakpoint
CREATE TYPE "public"."kunden_typ" AS ENUM('privat', 'gewerbe');--> statement-breakpoint
CREATE TYPE "public"."lead_quelle" AS ENUM('telefon', 'website', 'empfehlung', 'sonstige');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('neu', 'termin_vereinbart', 'vor_ort_besichtigung', 'offeriert', 'gewonnen', 'verloren');--> statement-breakpoint
CREATE TYPE "public"."order_item_status" AS ENUM('reserviert', 'verbaut', 'storniert');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('offen', 'in_planung', 'installation_durchgefuehrt', 'abgeschlossen', 'storniert');--> statement-breakpoint
CREATE TYPE "public"."partner_typ" AS ENUM('bohrpartner', 'lieferant');--> statement-breakpoint
CREATE TYPE "public"."quote_item_typ" AS ENUM('geraet', 'kernbohrung', 'montage', 'fahrt_material', 'sonderposition');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('entwurf', 'versendet', 'angenommen', 'abgelehnt', 'abgelaufen');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_typ" AS ENUM('wareneingang', 'verbrauch_installation', 'korrektur', 'ruecksendung');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'mitarbeiter');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"typ" "kunden_typ" DEFAULT 'privat' NOT NULL,
	"firma" varchar(255),
	"vorname" varchar(255),
	"nachname" varchar(255) NOT NULL,
	"strasse" varchar(255) NOT NULL,
	"plz" varchar(10) NOT NULL,
	"ort" varchar(255) NOT NULL,
	"telefon" varchar(50),
	"email" varchar(255),
	"notiz" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"hersteller" varchar(255) NOT NULL,
	"modell" varchar(255) NOT NULL,
	"kuehlleistung_kw" numeric(5, 2),
	"heizleistung_kw" numeric(5, 2),
	"kaeltemittel" varchar(100),
	"einkaufspreis" numeric(10, 2) NOT NULL,
	"empf_verkaufspreis" numeric(10, 2) NOT NULL,
	"lieferant_id" integer,
	"lagerbestand" integer DEFAULT 0 NOT NULL,
	"mindestbestand" integer DEFAULT 0 NOT NULL,
	"notiz" text,
	"aktiv" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"beschreibung" varchar(500) NOT NULL,
	"menge" integer DEFAULT 1 NOT NULL,
	"einzelpreis" numeric(10, 2) NOT NULL,
	"mwst_satz" numeric(4, 2) DEFAULT '8.10' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"rechnungsnummer" varchar(50) NOT NULL,
	"order_id" integer NOT NULL,
	"datum" date DEFAULT now() NOT NULL,
	"faelligkeitsdatum" date NOT NULL,
	"status" "invoice_status" DEFAULT 'offen' NOT NULL,
	"betrag_total" numeric(10, 2) NOT NULL,
	"mwst_satz" numeric(4, 2) DEFAULT '8.10' NOT NULL,
	"qr_referenznummer" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_rechnungsnummer_unique" UNIQUE("rechnungsnummer")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"adresse" text,
	"telefon" varchar(50),
	"email" varchar(255),
	"notiz" text,
	"quelle" "lead_quelle" DEFAULT 'sonstige' NOT NULL,
	"status" "lead_status" DEFAULT 'neu' NOT NULL,
	"customer_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"bezeichnung" "checklist_punkt" NOT NULL,
	"erledigt" boolean DEFAULT false NOT NULL,
	"erledigt_am" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"device_id" integer,
	"beschreibung" varchar(500) NOT NULL,
	"menge" integer DEFAULT 1 NOT NULL,
	"einzelpreis" numeric(10, 2) NOT NULL,
	"status" "order_item_status" DEFAULT 'reserviert' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"auftragsnummer" varchar(50) NOT NULL,
	"quote_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"status" "order_status" DEFAULT 'offen' NOT NULL,
	"installation_termin" timestamp,
	"bohr_termin" timestamp,
	"bohrpartner_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_auftragsnummer_unique" UNIQUE("auftragsnummer")
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"typ" "partner_typ" NOT NULL,
	"name" varchar(255) NOT NULL,
	"kontakt_name" varchar(255),
	"telefon" varchar(50),
	"email" varchar(255),
	"preis_pro_bohrung" numeric(10, 2),
	"lieferzeit_tage" integer,
	"notiz" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"betrag" numeric(10, 2) NOT NULL,
	"datum" date DEFAULT now() NOT NULL,
	"notiz" text
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"strasse" varchar(255) NOT NULL,
	"plz" varchar(10) NOT NULL,
	"ort" varchar(255) NOT NULL,
	"notiz" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"dateipfad" text NOT NULL,
	"beschriftung" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer NOT NULL,
	"typ" "quote_item_typ" NOT NULL,
	"device_id" integer,
	"beschreibung" varchar(500) NOT NULL,
	"menge" integer DEFAULT 1 NOT NULL,
	"einzelpreis" numeric(10, 2) NOT NULL,
	"einkaufspreis_intern" numeric(10, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"angebotsnummer" varchar(50) NOT NULL,
	"lead_id" integer,
	"customer_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"status" "quote_status" DEFAULT 'entwurf' NOT NULL,
	"datum" date DEFAULT now() NOT NULL,
	"gueltig_bis" date,
	"mwst_satz" numeric(4, 2) DEFAULT '8.10' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_angebotsnummer_unique" UNIQUE("angebotsnummer")
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"stufe" integer NOT NULL,
	"datum" date DEFAULT now() NOT NULL,
	"pdf_pfad" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"firmenname" varchar(255) DEFAULT '' NOT NULL,
	"logo_pfad" text,
	"strasse" varchar(255) DEFAULT '',
	"plz" varchar(10) DEFAULT '',
	"ort" varchar(255) DEFAULT '',
	"iban" varchar(34),
	"qr_iban" varchar(34),
	"mwst_nummer" varchar(50),
	"default_mwst_satz" numeric(4, 2) DEFAULT '8.10' NOT NULL,
	"stundensatz" numeric(10, 2) DEFAULT '0' NOT NULL,
	"smtp_host" varchar(255),
	"smtp_port" integer,
	"smtp_user" varchar(255),
	"smtp_pass_encrypted" text
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" integer NOT NULL,
	"typ" "stock_movement_typ" NOT NULL,
	"menge" integer NOT NULL,
	"order_id" integer,
	"notiz" text,
	"datum" date DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_lieferant_id_partners_id_fk" FOREIGN KEY ("lieferant_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_checklist_items" ADD CONSTRAINT "order_checklist_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_bohrpartner_id_partners_id_fk" FOREIGN KEY ("bohrpartner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_photos" ADD CONSTRAINT "property_photos_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;