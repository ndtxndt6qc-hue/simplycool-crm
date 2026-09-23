import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type HeuteTermin = {
  orderId: number;
  auftragsnummer: string;
  art: "installation" | "kernbohrung";
  uhrzeit: string | null;
  kunde: string;
  ort: string;
};
export type HeuteBeratungstermin = { bookingId: number; startzeit: string; endzeit: string; name: string; ort: string };
export type HeuteAngebot = { quoteId: number; angebotsnummer: string; gueltigBis: string; abgelaufen: boolean; kunde: string };
export type HeuteLead = { leadId: number; name: string; ort: string | null; telefon: string | null; email: string | null; seit: string };
export type HeuteRechnung = { invoiceId: number; rechnungsnummer: string; faelligkeitsdatum: string; offenerBetrag: number; kunde: string };

export type DashboardData = {
  offeneAngebote: { anzahl: number; volumen: number };
  laufendeAuftraege: number;
  offeneRechnungen: { anzahl: number; volumen: number };
  durchschnittlicheMargeProAuftrag: number;
  umsatzProMonat: { monat: string; umsatz: number; deckungsbeitrag: number }[];
  heute: {
    termine: HeuteTermin[];
    beratungstermine: HeuteBeratungstermin[];
    angeboteBaldAblaufend: HeuteAngebot[];
    leadsOhneKontakt: HeuteLead[];
    ueberfaelligeRechnungen: HeuteRechnung[];
  };
};

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/dashboard"),
  });
}
