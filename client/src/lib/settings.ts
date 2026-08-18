import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export type Settings = {
  id: number;
  firmenname: string;
  logoPfad: string | null;
  strasse: string;
  plz: string;
  ort: string;
  iban: string | null;
  qrIban: string | null;
  mwstNummer: string | null;
  defaultMwstSatz: string;
  stundensatz: string;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassSet: boolean;
};

export type SettingsInput = Partial<{
  firmenname: string;
  strasse: string;
  plz: string;
  ort: string;
  iban: string;
  qrIban: string;
  mwstNummer: string;
  defaultMwstSatz: number;
  stundensatz: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassEncrypted: string;
}>;

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Settings>("/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SettingsInput) => api.patch<Settings>("/settings", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/settings/logo", { method: "POST", credentials: "include", body: formData });
      if (!res.ok) throw new Error("Upload fehlgeschlagen.");
      return res.json() as Promise<{ logoPfad: string }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
