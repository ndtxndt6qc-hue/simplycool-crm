import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export type Branding = { firmenname: string; hatLogo: boolean };

export const PUBLIC_LOGO_URL = "/api/public/logo";

export function useBranding() {
  return useQuery({
    queryKey: ["public", "branding"],
    queryFn: async () => {
      const res = await fetch("/api/public/branding");
      if (!res.ok) throw new Error("Branding konnte nicht geladen werden.");
      return res.json() as Promise<Branding>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export type PublicReferenzFoto = { id: number; typ: "vorher" | "nachher"; url: string };
export type PublicReferenz = {
  id: number;
  ort: string;
  anzahlGeraete: number;
  beschreibung: string | null;
  fotos: PublicReferenzFoto[];
};

export function usePublicReferenzen(limit?: number) {
  return useQuery({
    queryKey: ["public", "referenzen", limit ?? "all"],
    queryFn: async () => {
      const res = await fetch(`/api/public/referenzen${limit ? `?limit=${limit}` : ""}`);
      if (!res.ok) throw new Error("Referenzen konnten nicht geladen werden.");
      return res.json() as Promise<PublicReferenz[]>;
    },
    staleTime: 60 * 1000,
  });
}

export type PublicSlot = { start: string; end: string };
export type PublicSlots = Record<string, PublicSlot[]>; // Key: "YYYY-MM-DD"

export function usePublicBookingSlots(von?: string, bis?: string) {
  return useQuery({
    queryKey: ["public", "booking-slots", von, bis],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (von) params.set("von", von);
      if (bis) params.set("bis", bis);
      const qs = params.toString();
      const res = await fetch(`/api/public/booking/slots${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Termine konnten nicht geladen werden.");
      return res.json() as Promise<PublicSlots>;
    },
    staleTime: 30 * 1000,
  });
}

export type CreateBookingInput = {
  name: string;
  telefon?: string;
  email?: string;
  plz: string;
  ort: string;
  nachricht?: string;
  datum: string;
  startzeit: string;
  quelle?: string;
  firma?: string; // Honeypot
};

export function useCreateBooking() {
  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      api.post<{ ok: true; datum: string; startzeit: string; endzeit: string }>("/public/booking", input),
  });
}

export type PublicQuoteItem = {
  id: number;
  typ: string;
  beschreibung: string;
  menge: string;
  einheit: string | null;
  einzelpreis: string;
  total: string;
  optional: boolean;
  spezifikationen: string | null;
};

export type PublicQuote = {
  angebotsnummer: string;
  datum: string;
  gueltigBis: string | null;
  status: "entwurf" | "versendet" | "angenommen" | "abgelehnt" | "abgelaufen";
  angenommenAm: string | null;
  firmenname: string;
  kunde: { name: string; strasse: string; plz: string; ort: string };
  installationsort: { strasse: string; plz: string; ort: string };
  items: PublicQuoteItem[];
  mwstSatz: number;
  summeNetto: string;
  mwstBetrag: string;
  summeTotal: string;
  summeOptional: string;
};

export function usePublicQuote(token: string) {
  return useQuery({
    queryKey: ["public", "quote", token],
    queryFn: async () => {
      const res = await fetch(`/api/public/quote/${token}`);
      if (!res.ok) throw new Error("Angebot nicht gefunden.");
      return res.json() as Promise<PublicQuote>;
    },
    enabled: Boolean(token),
  });
}

export function useAcceptPublicQuote(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ ok: true; alreadyAccepted: boolean; angenommenAm: string }>(`/public/quote/${token}/accept`, {
        agbAkzeptiert: true,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["public", "quote", token] }),
  });
}
