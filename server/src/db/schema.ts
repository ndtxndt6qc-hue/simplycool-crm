import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  varchar,
} from "drizzle-orm/pg-core";

export const leadQuelleEnum = pgEnum("lead_quelle", ["telefon", "website", "empfehlung", "sonstige"]);
export const leadStatusEnum = pgEnum("lead_status", [
  "neu",
  "termin_vereinbart",
  "vor_ort_besichtigung",
  "offeriert",
  "gewonnen",
  "verloren",
]);
export const kundenTypEnum = pgEnum("kunden_typ", ["privat", "gewerbe"]);
export const partnerTypEnum = pgEnum("partner_typ", ["bohrpartner", "lieferant"]);
export const quoteStatusEnum = pgEnum("quote_status", ["entwurf", "versendet", "angenommen", "abgelehnt", "abgelaufen"]);
export const quoteItemTypEnum = pgEnum("quote_item_typ", [
  "geraet",
  "kernbohrung",
  "montage",
  "fahrt_material",
  "sonderposition",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "offen",
  "in_planung",
  "installation_durchgefuehrt",
  "abgeschlossen",
  "storniert",
]);
export const orderItemStatusEnum = pgEnum("order_item_status", ["reserviert", "verbaut", "storniert"]);
export const checklistPunktEnum = pgEnum("checklist_punkt", [
  "geraet_bestellt",
  "bohrpartner_beauftragt",
  "termin_bestaetigt",
  "bohrpartner_termin_bestaetigt",
  "kunde_termin_bestaetigt",
  "installation_durchgefuehrt",
  "abnahme_kunde",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "offen",
  "teilzahlung",
  "bezahlt",
  "ueberfaellig",
  "storniert",
]);
export const orderDocumentTypEnum = pgEnum("order_document_typ", ["abnahmeprotokoll_signiert", "sonstiges"]);
export const stockMovementTypEnum = pgEnum("stock_movement_typ", [
  "wareneingang",
  "verbrauch_installation",
  "korrektur",
  "ruecksendung",
]);
export const userRoleEnum = pgEnum("user_role", ["admin", "mitarbeiter"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  typ: kundenTypEnum("typ").notNull().default("privat"),
  firma: varchar("firma", { length: 255 }),
  vorname: varchar("vorname", { length: 255 }),
  nachname: varchar("nachname", { length: 255 }).notNull(),
  strasse: varchar("strasse", { length: 255 }).notNull(),
  plz: varchar("plz", { length: 10 }).notNull(),
  ort: varchar("ort", { length: 255 }).notNull(),
  telefon: varchar("telefon", { length: 50 }),
  email: varchar("email", { length: 255 }),
  notiz: text("notiz"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  adresse: text("adresse"),
  plz: varchar("plz", { length: 10 }),
  ort: varchar("ort", { length: 255 }),
  telefon: varchar("telefon", { length: 50 }),
  email: varchar("email", { length: 255 }),
  notiz: text("notiz"),
  quelle: leadQuelleEnum("quelle").notNull().default("sonstige"),
  status: leadStatusEnum("status").notNull().default("neu"),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  strasse: varchar("strasse", { length: 255 }).notNull(),
  plz: varchar("plz", { length: 10 }).notNull(),
  ort: varchar("ort", { length: 255 }).notNull(),
  notiz: text("notiz"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const propertyPhotos = pgTable("property_photos", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  dateipfad: text("dateipfad").notNull(),
  beschriftung: varchar("beschriftung", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  typ: partnerTypEnum("typ").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  kontaktName: varchar("kontakt_name", { length: 255 }),
  telefon: varchar("telefon", { length: 50 }),
  email: varchar("email", { length: 255 }),
  preisProBohrung: numeric("preis_pro_bohrung", { precision: 10, scale: 2 }),
  preisPro3Loch: numeric("preis_pro_3loch", { precision: 10, scale: 2 }),
  lieferzeitTage: integer("lieferzeit_tage"),
  notiz: text("notiz"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  hersteller: varchar("hersteller", { length: 255 }).notNull(),
  modell: varchar("modell", { length: 255 }).notNull(),
  kuehlleistungKw: numeric("kuehlleistung_kw", { precision: 5, scale: 2 }),
  heizleistungKw: numeric("heizleistung_kw", { precision: 5, scale: 2 }),
  kaeltemittel: varchar("kaeltemittel", { length: 100 }),
  einkaufspreis: numeric("einkaufspreis", { precision: 10, scale: 2 }).notNull(),
  empfVerkaufspreis: numeric("empf_verkaufspreis", { precision: 10, scale: 2 }).notNull(),
  lieferantId: integer("lieferant_id").references(() => partners.id, { onDelete: "set null" }),
  bildPfad: text("bild_pfad"),
  lagerbestand: integer("lagerbestand").notNull().default(0),
  mindestbestand: integer("mindestbestand").notNull().default(0),
  notiz: text("notiz"),
  aktiv: boolean("aktiv").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id")
    .notNull()
    .references(() => devices.id, { onDelete: "cascade" }),
  typ: stockMovementTypEnum("typ").notNull(),
  menge: integer("menge").notNull(),
  orderId: integer("order_id").references(() => orders.id),
  notiz: text("notiz"),
  datum: date("datum").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  angebotsnummer: varchar("angebotsnummer", { length: 50 }).notNull().unique(),
  leadId: integer("lead_id").references(() => leads.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  status: quoteStatusEnum("status").notNull().default("entwurf"),
  datum: date("datum").notNull().defaultNow(),
  gueltigBis: date("gueltig_bis"),
  mwstSatz: numeric("mwst_satz", { precision: 4, scale: 2 }).notNull().default("8.10"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  typ: quoteItemTypEnum("typ").notNull(),
  deviceId: integer("device_id").references(() => devices.id, { onDelete: "set null" }),
  beschreibung: varchar("beschreibung", { length: 500 }).notNull(),
  menge: numeric("menge", { precision: 10, scale: 2 }).notNull().default("1"),
  einheit: varchar("einheit", { length: 50 }),
  einzelpreis: numeric("einzelpreis", { precision: 10, scale: 2 }).notNull(),
  einkaufspreisIntern: numeric("einkaufspreis_intern", { precision: 10, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  auftragsnummer: varchar("auftragsnummer", { length: 50 }).notNull().unique(),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  status: orderStatusEnum("status").notNull().default("offen"),
  installationTermin: timestamp("installation_termin"),
  bohrTermin: timestamp("bohr_termin"),
  bohrpartnerId: integer("bohrpartner_id").references(() => partners.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  deviceId: integer("device_id").references(() => devices.id, { onDelete: "set null" }),
  beschreibung: varchar("beschreibung", { length: 500 }).notNull(),
  menge: numeric("menge", { precision: 10, scale: 2 }).notNull().default("1"),
  einheit: varchar("einheit", { length: 50 }),
  einzelpreis: numeric("einzelpreis", { precision: 10, scale: 2 }).notNull(),
  status: orderItemStatusEnum("status").notNull().default("reserviert"),
});

export const orderChecklistItems = pgTable("order_checklist_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  bezeichnung: checklistPunktEnum("bezeichnung").notNull(),
  erledigt: boolean("erledigt").notNull().default(false),
  erledigtAm: timestamp("erledigt_am"),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  rechnungsnummer: varchar("rechnungsnummer", { length: 50 }).notNull().unique(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  datum: date("datum").notNull().defaultNow(),
  faelligkeitsdatum: date("faelligkeitsdatum").notNull(),
  status: invoiceStatusEnum("status").notNull().default("offen"),
  betragTotal: numeric("betrag_total", { precision: 10, scale: 2 }).notNull(),
  mwstSatz: numeric("mwst_satz", { precision: 4, scale: 2 }).notNull().default("8.10"),
  qrReferenznummer: varchar("qr_referenznummer", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  beschreibung: varchar("beschreibung", { length: 500 }).notNull(),
  menge: numeric("menge", { precision: 10, scale: 2 }).notNull().default("1"),
  einheit: varchar("einheit", { length: 50 }),
  einzelpreis: numeric("einzelpreis", { precision: 10, scale: 2 }).notNull(),
  mwstSatz: numeric("mwst_satz", { precision: 4, scale: 2 }).notNull().default("8.10"),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  betrag: numeric("betrag", { precision: 10, scale: 2 }).notNull(),
  datum: date("datum").notNull().defaultNow(),
  notiz: text("notiz"),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  stufe: integer("stufe").notNull(),
  datum: date("datum").notNull().defaultNow(),
  pdfPfad: text("pdf_pfad"),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  firmenname: varchar("firmenname", { length: 255 }).notNull().default(""),
  logoPfad: text("logo_pfad"),
  strasse: varchar("strasse", { length: 255 }).default(""),
  plz: varchar("plz", { length: 10 }).default(""),
  ort: varchar("ort", { length: 255 }).default(""),
  iban: varchar("iban", { length: 34 }),
  qrIban: varchar("qr_iban", { length: 34 }),
  mwstNummer: varchar("mwst_nummer", { length: 50 }),
  defaultMwstSatz: numeric("default_mwst_satz", { precision: 4, scale: 2 }).notNull().default("8.10"),
  stundensatz: numeric("stundensatz", { precision: 10, scale: 2 }).notNull().default("0"),
  garantieZeit: varchar("garantie_zeit", { length: 100 }),
  angebotSperreNachVersand: boolean("angebot_sperre_nach_versand").notNull().default(true),
  abnahmeprotokollVorlagePfad: text("abnahmeprotokoll_vorlage_pfad"),
  installationsanweisungVorlagePfad: text("installationsanweisung_vorlage_pfad"),
  smtpHost: varchar("smtp_host", { length: 255 }),
  smtpPort: integer("smtp_port"),
  smtpUser: varchar("smtp_user", { length: 255 }),
  smtpPassEncrypted: text("smtp_pass_encrypted"),
});

export const orderDocuments = pgTable("order_documents", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  typ: orderDocumentTypEnum("typ").notNull().default("abnahmeprotokoll_signiert"),
  dateipfad: text("dateipfad").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
