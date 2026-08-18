import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { InvoiceStatus } from "@klimainstall/shared";
import type { Customer } from "./customers";
import type { Property } from "./properties";
import type { Order } from "./orders";

export type InvoiceItem = {
  id: number;
  invoiceId: number;
  beschreibung: string;
  menge: number;
  einzelpreis: string;
  mwstSatz: string;
};

export type Payment = {
  id: number;
  invoiceId: number;
  betrag: string;
  datum: string;
  notiz: string | null;
};

export type Reminder = {
  id: number;
  invoiceId: number;
  stufe: number;
  datum: string;
  pdfPfad: string | null;
};

export type Invoice = {
  id: number;
  rechnungsnummer: string;
  orderId: number;
  datum: string;
  faelligkeitsdatum: string;
  status: InvoiceStatus;
  betragTotal: string;
  mwstSatz: string;
  qrReferenznummer: string | null;
  createdAt: string;
};

export type InvoiceListEntry = Invoice & {
  customer: Customer;
  order: Order;
  total: number;
  bezahlt: number;
  displayStatus: InvoiceStatus;
};

export type InvoiceDetail = Invoice & {
  customer: Customer;
  property: Property;
  order: Order;
  items: InvoiceItem[];
  payments: Payment[];
  reminders: Reminder[];
  netto: number;
  mwstBetrag: number;
  total: number;
  bezahlt: number;
  displayStatus: InvoiceStatus;
};

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.get<InvoiceListEntry[]>("/invoices"),
  });
}

export function useInvoice(id: number | undefined) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => api.get<InvoiceDetail>(`/invoices/${id}`),
    enabled: id !== undefined,
  });
}

export function useInvoiceByOrder(orderId: number | undefined) {
  return useQuery({
    queryKey: ["invoices", "by-order", orderId],
    queryFn: async () => {
      try {
        return await api.get<Invoice>(`/invoices/by-order/${orderId}`);
      } catch {
        return null;
      }
    },
    enabled: orderId !== undefined,
  });
}

export function useCreateInvoiceFromOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => api.post<Invoice>(`/invoices/from-order/${orderId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useAddInvoiceItem(invoiceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { beschreibung: string; menge: number; einzelpreis: number }) =>
      api.post<InvoiceItem>(`/invoices/${invoiceId}/items`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices", invoiceId] }),
  });
}

export function useDeleteInvoiceItem(invoiceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => api.delete<void>(`/invoices/${invoiceId}/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices", invoiceId] }),
  });
}

export function useAddPayment(invoiceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { betrag: number; notiz?: string }) => api.post<Payment>(`/invoices/${invoiceId}/payments`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useCreateReminder(invoiceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stufe: 1 | 2) => api.post<Reminder>(`/invoices/${invoiceId}/reminders`, { stufe }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices", invoiceId] }),
  });
}
