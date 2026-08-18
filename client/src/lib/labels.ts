import type {
  ChecklistPunkt,
  InvoiceStatus,
  KundenTyp,
  LeadQuelle,
  LeadStatus,
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
};

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
  termin_bestaetigt: "Termin bestätigt",
  installation_durchgefuehrt: "Installation durchgeführt",
  abnahme_kunde: "Abnahme durch Kunde",
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
