import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { LeadQuelle, LeadStatus } from "@klimainstall/shared";

export type Lead = {
  id: number;
  name: string;
  adresse: string | null;
  plz: string | null;
  ort: string | null;
  telefon: string | null;
  email: string | null;
  notiz: string | null;
  quelle: LeadQuelle;
  status: LeadStatus;
  customerId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadInput = {
  name: string;
  adresse?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  email?: string;
  notiz?: string;
  quelle: LeadQuelle;
};

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: () => api.get<Lead[]>("/leads"),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadInput) => api.post<Lead>("/leads", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<LeadInput> & { status?: LeadStatus }) =>
      api.patch<Lead>(`/leads/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/leads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}
