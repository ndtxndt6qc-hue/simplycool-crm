import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { ChecklistPunkt, OrderDocumentTyp, OrderItemStatus, OrderStatus } from "@klimainstall/shared";
import type { Customer } from "./customers";
import type { Property } from "./properties";

export type OrderItem = {
  id: number;
  orderId: number;
  deviceId: number | null;
  beschreibung: string;
  menge: string;
  einheit: string | null;
  einzelpreis: string;
  status: OrderItemStatus;
};

export type ChecklistItem = {
  id: number;
  orderId: number;
  bezeichnung: ChecklistPunkt;
  erledigt: boolean;
  erledigtAm: string | null;
};

export type Order = {
  id: number;
  auftragsnummer: string;
  quoteId: number;
  customerId: number;
  propertyId: number;
  status: OrderStatus;
  installationTermin: string | null;
  bohrTermin: string | null;
  bohrpartnerId: number | null;
  createdAt: string;
};

export type OrderListEntry = Order & {
  customer: Customer;
  property: Property;
  checklistErledigt: number;
  checklistTotal: number;
};

export type OrderDocument = {
  id: number;
  orderId: number;
  typ: OrderDocumentTyp;
  dateipfad: string;
  createdAt: string;
};

export type OrderDetail = Order & {
  customer: Customer;
  property: Property;
  items: OrderItem[];
  checklist: ChecklistItem[];
  documents: OrderDocument[];
};

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get<OrderListEntry[]>("/orders"),
  });
}

export function useOrder(id: number | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => api.get<OrderDetail>(`/orders/${id}`),
    enabled: id !== undefined,
  });
}

export function useOrderByQuote(quoteId: number | undefined) {
  return useQuery({
    queryKey: ["orders", "by-quote", quoteId],
    queryFn: async () => {
      try {
        return await api.get<Order>(`/orders/by-quote/${quoteId}`);
      } catch {
        return null;
      }
    },
    enabled: quoteId !== undefined,
  });
}

export function useCreateOrderFromQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: number) => api.post<Order>(`/orders/from-quote/${quoteId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

export function useUpdateOrder(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      status?: OrderStatus;
      installationTermin?: string | null;
      bohrTermin?: string | null;
      bohrpartnerId?: number | null;
    }) => api.patch<Order>(`/orders/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useToggleChecklistItem(orderId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, erledigt }: { itemId: number; erledigt: boolean }) =>
      api.patch<ChecklistItem>(`/orders/${orderId}/checklist/${itemId}`, { erledigt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

export function useUploadOrderDocument(orderId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, typ }: { file: File; typ: OrderDocumentTyp }) => {
      const formData = new FormData();
      formData.append("datei", file);
      formData.append("typ", typ);
      const res = await fetch(`/api/orders/${orderId}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload fehlgeschlagen.");
      return res.json() as Promise<OrderDocument>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", orderId] }),
  });
}

export function useDeleteOrderDocument(orderId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: number) => api.delete<void>(`/orders/${orderId}/documents/${docId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", orderId] }),
  });
}
