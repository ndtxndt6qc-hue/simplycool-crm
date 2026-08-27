import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { GemeindeAnforderungstyp } from "@klimainstall/shared";

export type GemeindeAnforderung = {
  id: number;
  kanton: string;
  gemeindeName: string;
  bfsNummer: number | null;
  anforderungstyp: GemeindeAnforderungstyp;
  beschreibung: string | null;
  kostenPauschale: string | null;
  bearbeitungsdauerTage: number | null;
  quelle: string | null;
  zuletztGeprueftAm: string | null;
  erstelltAm: string;
  aktualisiertAm: string;
};

export type GemeindeAnforderungInput = {
  kanton: string;
  gemeindeName: string;
  bfsNummer?: number;
  anforderungstyp: GemeindeAnforderungstyp;
  beschreibung?: string;
  kostenPauschale?: number;
  bearbeitungsdauerTage?: number;
  quelle?: string;
  zuletztGeprueftAm?: string;
};

export function useGemeindeAnforderungen(search?: string) {
  return useQuery({
    queryKey: ["gemeinde-anforderungen", search ?? ""],
    queryFn: () =>
      api.get<GemeindeAnforderung[]>(`/gemeinde-anforderungen${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });
}

export function useGemeindeAnforderung(id: number | undefined) {
  return useQuery({
    queryKey: ["gemeinde-anforderungen", id],
    queryFn: () => api.get<GemeindeAnforderung>(`/gemeinde-anforderungen/${id}`),
    enabled: id !== undefined,
  });
}

export function useCreateGemeindeAnforderung() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GemeindeAnforderungInput) => api.post<GemeindeAnforderung>("/gemeinde-anforderungen", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gemeinde-anforderungen"] }),
  });
}

export function useUpdateGemeindeAnforderung() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<GemeindeAnforderungInput>) =>
      api.patch<GemeindeAnforderung>(`/gemeinde-anforderungen/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gemeinde-anforderungen"] }),
  });
}

export function useDeleteGemeindeAnforderung() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/gemeinde-anforderungen/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gemeinde-anforderungen"] }),
  });
}

export function istVeraltet(zuletztGeprueftAm: string | null): boolean {
  if (!zuletztGeprueftAm) return true;
  const zwoelfMonateVorher = new Date();
  zwoelfMonateVorher.setMonth(zwoelfMonateVorher.getMonth() - 12);
  return new Date(zuletztGeprueftAm) < zwoelfMonateVorher;
}
