import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type DashboardData = {
  offeneAngebote: { anzahl: number; volumen: number };
  laufendeAuftraege: number;
  offeneRechnungen: { anzahl: number; volumen: number };
  durchschnittlicheMargeProAuftrag: number;
  umsatzProMonat: { monat: string; umsatz: number; deckungsbeitrag: number }[];
};

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/dashboard"),
  });
}
