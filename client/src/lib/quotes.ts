import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { AbklaerungDurch, QuoteItemTyp, QuoteStatus } from "@klimainstall/shared";
import type { Customer } from "./customers";
import type { Property } from "./properties";
import type { GemeindeAnforderung } from "./gemeindeAnforderungen";

export type QuoteItem = {
  id: number;
  quoteId: number;
  typ: QuoteItemTyp;
  deviceId: number | null;
  beschreibung: string;
  menge: string;
  einheit: string | null;
  einzelpreis: string;
  einkaufspreisIntern: string;
  sortOrder: number;
  optional: boolean;
};

export type Quote = {
  id: number;
  angebotsnummer: string;
  leadId: number | null;
  customerId: number;
  propertyId: number;
  status: QuoteStatus;
  datum: string;
  gueltigBis: string | null;
  mwstSatz: string;
  abklaerungDurch: AbklaerungDurch | null;
  publicToken: string | null;
  angenommenAm: string | null;
  angenommenIp: string | null;
  angenommenUserAgent: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuoteListEntry = Quote & {
  customer: Customer;
  property: Property;
  summe: number;
  rechnungsnummer: string | null;
};
export type QuoteDetail = Quote & {
  customer: Customer;
  property: Property;
  items: QuoteItem[];
  summe: number;
  summeOptional: number;
  deckungsbeitrag: number;
  locked: boolean;
};

export type QuoteItemInput = {
  typ: QuoteItemTyp;
  deviceId?: number;
  beschreibung: string;
  menge: number;
  einheit?: string;
  einzelpreis: number;
  einkaufspreisIntern: number;
  optional?: boolean;
};

export function useQuotes() {
  return useQuery({
    queryKey: ["quotes"],
    queryFn: () => api.get<QuoteListEntry[]>("/quotes"),
  });
}

export function useQuote(id: number | undefined) {
  return useQuery({
    queryKey: ["quotes", id],
    queryFn: () => api.get<QuoteDetail>(`/quotes/${id}`),
    enabled: id !== undefined,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { customerId: number; propertyId: number; leadId?: number }) =>
      api.post<Quote>("/quotes", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
  });
}

export function useUpdateQuote(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      status?: QuoteStatus;
      gueltigBis?: string;
      mwstSatz?: number;
      abklaerungDurch?: AbklaerungDurch | null;
    }) => api.patch<Quote>(`/quotes/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes", id] });
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/quotes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
  });
}

export function useAddQuoteItem(quoteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuoteItemInput) => api.post<QuoteItem>(`/quotes/${quoteId}/items`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes", quoteId] }),
  });
}

export function useUpdateQuoteItem(quoteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<QuoteItemInput>) =>
      api.patch<QuoteItem>(`/quotes/${quoteId}/items/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes", quoteId] }),
  });
}

export function useDeleteQuoteItem(quoteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => api.delete<void>(`/quotes/${quoteId}/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes", quoteId] }),
  });
}

export function useMoveQuoteItem(quoteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, direction }: { itemId: number; direction: "up" | "down" }) =>
      api.post<void>(`/quotes/${quoteId}/items/${itemId}/move`, { direction }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes", quoteId] }),
  });
}

export function useSendQuote(quoteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { to?: string; message?: string }) => api.post<Quote>(`/quotes/${quoteId}/send`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes", quoteId] });
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useQuotePublicLink(quoteId: number) {
  return useMutation({
    mutationFn: () => api.get<{ token: string; url: string }>(`/quotes/${quoteId}/public-link`),
  });
}

export type QuoteGemeindeInfo = {
  ort: string;
  gemeinde: GemeindeAnforderung | null;
  vorgeschlagen: boolean;
};

export function useQuoteGemeinde(quoteId: number | undefined) {
  return useQuery({
    queryKey: ["quotes", quoteId, "gemeinde"],
    queryFn: () => api.get<QuoteGemeindeInfo>(`/quotes/${quoteId}/gemeinde`),
    enabled: quoteId !== undefined,
  });
}

export function useSetQuoteGemeinde(quoteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gemeindeAnforderungId: number | null) =>
      api.patch<Quote>(`/quotes/${quoteId}/gemeinde`, { gemeindeAnforderungId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes", quoteId, "gemeinde"] });
      qc.invalidateQueries({ queryKey: ["quotes", quoteId] });
    },
  });
}

export function useApplyGemeindePosition(quoteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ item?: QuoteItem; skipped?: boolean }>(`/quotes/${quoteId}/gemeinde/apply-position`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes", quoteId, "gemeinde"] });
      qc.invalidateQueries({ queryKey: ["quotes", quoteId] });
    },
  });
}
