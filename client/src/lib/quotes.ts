import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { QuoteItemTyp, QuoteStatus } from "@klimainstall/shared";
import type { Customer } from "./customers";
import type { Property } from "./properties";

export type QuoteItem = {
  id: number;
  quoteId: number;
  typ: QuoteItemTyp;
  deviceId: number | null;
  beschreibung: string;
  menge: number;
  einzelpreis: string;
  einkaufspreisIntern: string;
  sortOrder: number;
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
  createdAt: string;
  updatedAt: string;
};

export type QuoteListEntry = Quote & { customer: Customer; property: Property; summe: number };
export type QuoteDetail = Quote & { customer: Customer; property: Property; items: QuoteItem[]; summe: number; deckungsbeitrag: number };

export type QuoteItemInput = {
  typ: QuoteItemTyp;
  deviceId?: number;
  beschreibung: string;
  menge: number;
  einzelpreis: number;
  einkaufspreisIntern: number;
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
    mutationFn: (input: { status?: QuoteStatus; gueltigBis?: string; mwstSatz?: number }) =>
      api.patch<Quote>(`/quotes/${id}`, input),
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

export function useDeleteQuoteItem(quoteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => api.delete<void>(`/quotes/${quoteId}/items/${itemId}`),
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
