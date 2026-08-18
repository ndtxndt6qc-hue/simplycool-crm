import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { PartnerTyp } from "@klimainstall/shared";

export type Partner = {
  id: number;
  typ: PartnerTyp;
  name: string;
  kontaktName: string | null;
  telefon: string | null;
  email: string | null;
  preisProBohrung: string | null;
  lieferzeitTage: number | null;
  notiz: string | null;
};

export type PartnerInput = {
  typ: PartnerTyp;
  name: string;
  kontaktName?: string;
  telefon?: string;
  email?: string;
  preisProBohrung?: number;
  lieferzeitTage?: number;
  notiz?: string;
};

export function usePartners(typ?: PartnerTyp) {
  return useQuery({
    queryKey: ["partners", typ],
    queryFn: () => api.get<Partner[]>(`/partners${typ ? `?typ=${typ}` : ""}`),
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PartnerInput) => api.post<Partner>("/partners", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<PartnerInput>) =>
      api.patch<Partner>(`/partners/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/partners/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }),
  });
}
