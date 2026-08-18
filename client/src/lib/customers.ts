import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { KundenTyp } from "@klimainstall/shared";

export type Customer = {
  id: number;
  typ: KundenTyp;
  firma: string | null;
  vorname: string | null;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string | null;
  email: string | null;
  notiz: string | null;
  createdAt: string;
};

export type CustomerInput = {
  typ: KundenTyp;
  firma?: string;
  vorname?: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon?: string;
  email?: string;
  notiz?: string;
  leadId?: number;
};

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => api.get<Customer[]>("/customers"),
  });
}

export function useCustomer(id: number | undefined) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => api.get<Customer>(`/customers/${id}`),
    enabled: id !== undefined,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => api.post<Customer>("/customers", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<CustomerInput>) =>
      api.patch<Customer>(`/customers/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
