export const LEAD_QUELLEN = ["telefon", "website", "empfehlung", "sonstige"] as const;
export type LeadQuelle = (typeof LEAD_QUELLEN)[number];

export const LEAD_STATUS = [
  "neu",
  "termin_vereinbart",
  "vor_ort_besichtigung",
  "offeriert",
  "gewonnen",
  "verloren",
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const KUNDEN_TYPEN = ["privat", "gewerbe"] as const;
export type KundenTyp = (typeof KUNDEN_TYPEN)[number];

export const PARTNER_TYPEN = ["bohrpartner", "lieferant"] as const;
export type PartnerTyp = (typeof PARTNER_TYPEN)[number];

export const QUOTE_STATUS = ["entwurf", "versendet", "angenommen", "abgelehnt", "abgelaufen"] as const;
export type QuoteStatus = (typeof QUOTE_STATUS)[number];

export const QUOTE_ITEM_TYPEN = ["geraet", "kernbohrung", "montage", "fahrt_material", "sonderposition"] as const;
export type QuoteItemTyp = (typeof QUOTE_ITEM_TYPEN)[number];

export const ORDER_STATUS = ["offen", "in_planung", "installation_durchgefuehrt", "abgeschlossen", "storniert"] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export const ORDER_ITEM_STATUS = ["reserviert", "verbaut", "storniert"] as const;
export type OrderItemStatus = (typeof ORDER_ITEM_STATUS)[number];

export const CHECKLIST_PUNKTE = [
  "geraet_bestellt",
  "bohrpartner_beauftragt",
  "termin_bestaetigt",
  "installation_durchgefuehrt",
  "abnahme_kunde",
] as const;
export type ChecklistPunkt = (typeof CHECKLIST_PUNKTE)[number];

export const INVOICE_STATUS = ["offen", "teilzahlung", "bezahlt", "ueberfaellig"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS)[number];

export const STOCK_MOVEMENT_TYPEN = ["wareneingang", "verbrauch_installation", "korrektur", "ruecksendung"] as const;
export type StockMovementTyp = (typeof STOCK_MOVEMENT_TYPEN)[number];

export const MAHNSTUFEN = [1, 2] as const;
export type Mahnstufe = (typeof MAHNSTUFEN)[number];
