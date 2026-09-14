import type {
  AbklaerungDurch,
  ChecklistPunkt,
  GemeindeAnforderungstyp,
  InvoiceStatus,
  KundenTyp,
  LeadQuelle,
  LeadStatus,
  OrderDocumentTyp,
  OrderStatus,
  PartnerTyp,
  QuoteItemTyp,
  QuoteStatus,
  StockMovementTyp,
} from "@klimainstall/shared";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  offen: "Offen",
  teilzahlung: "Teilzahlung",
  bezahlt: "Bezahlt",
  ueberfaellig: "Überfällig",
  storniert: "Storniert",
};

export const KAELTEMITTEL_OPTIONEN = ["R290 (Propan)", "R32", "R410A", "R134a", "R454B"] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  offen: "Offen",
  in_planung: "In Planung",
  installation_durchgefuehrt: "Installation durchgeführt",
  abgeschlossen: "Abgeschlossen",
  storniert: "Storniert",
};

export const CHECKLIST_PUNKT_LABELS: Record<ChecklistPunkt, string> = {
  geraet_bestellt: "Geräte bestellt",
  bohrpartner_beauftragt: "Bohrpartner beauftragt",
  bohrpartner_termin_bestaetigt: "Bohrpartner hat Termin bestätigt",
  kunde_termin_bestaetigt: "Kunde hat Termin bestätigt",
  installation_durchgefuehrt: "Installation durchgeführt",
  abnahme_kunde: "Abnahme durch Kunde",
};

export const ORDER_DOCUMENT_TYP_LABELS: Record<OrderDocumentTyp, string> = {
  abnahmeprotokoll_signiert: "Unterschriebenes Abnahmeprotokoll",
  sonstiges: "Sonstiges Dokument",
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  entwurf: "Entwurf",
  versendet: "Versendet",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
  abgelaufen: "Abgelaufen",
};

export const QUOTE_ITEM_TYP_LABELS: Record<QuoteItemTyp, string> = {
  geraet: "Gerät",
  kernbohrung: "Kernbohrung",
  montage: "Montage/Arbeitszeit",
  fahrt_material: "Fahrt/Kleinmaterial",
  sonderposition: "Sonderposition",
  gemeindeabklaerung: "Gemeinde-Abklärung",
  rabatt: "Rabatt",
};

export const GEMEINDE_ANFORDERUNGSTYP_LABELS: Record<GemeindeAnforderungstyp, string> = {
  keine: "Keine Anforderung",
  meldepflicht: "Meldepflicht",
  baubewilligungspflicht: "Baubewilligungspflicht",
  unklar_abklaeren: "Unklar — abklären",
};

export const ABKLAERUNG_DURCH_LABELS: Record<AbklaerungDurch, string> = {
  simplycool: "SimplyCool",
  bauseits: "Bauseits (durch Auftraggeber)",
};

export const KUNDEN_TYP_LABELS: Record<KundenTyp, string> = {
  privat: "Privat",
  gewerbe: "Gewerbe",
};

export const PARTNER_TYP_LABELS: Record<PartnerTyp, string> = {
  bohrpartner: "Bohrpartner",
  lieferant: "Lieferant",
};

export const STOCK_MOVEMENT_TYP_LABELS: Record<StockMovementTyp, string> = {
  wareneingang: "Wareneingang",
  verbrauch_installation: "Verbrauch (Installation)",
  korrektur: "Korrektur",
  ruecksendung: "Rücksendung",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  neu: "Neu",
  termin_vereinbart: "Termin vereinbart",
  vor_ort_besichtigung: "Vor-Ort-Besichtigung",
  offeriert: "Offeriert",
  gewonnen: "Gewonnen",
  verloren: "Verloren",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "neu",
  "termin_vereinbart",
  "vor_ort_besichtigung",
  "offeriert",
  "gewonnen",
  "verloren",
];

export const LEAD_QUELLE_LABELS: Record<LeadQuelle, string> = {
  telefon: "Telefon",
  website: "Website",
  empfehlung: "Empfehlung",
  sonstige: "Sonstige",
};
