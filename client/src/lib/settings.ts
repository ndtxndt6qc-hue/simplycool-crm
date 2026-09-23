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
  smtpAbsenderEmail: string | null;
  smtpPassSet: boolean;
  garantieZeit: string | null;
  angebotSperreNachVersand: boolean;
  abnahmeprotokollVorlagePfad: string | null;
  installationsanweisungVorlagePfad: string | null;
  adminBenachrichtigungEmail: string | null;
  terminDauerMinuten: number;
  abnahmeprotokollText: string | null;
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
  smtpAbsenderEmail: string;
  garantieZeit: string;
  angebotSperreNachVersand: boolean;
  adminBenachrichtigungEmail: string;
  terminDauerMinuten: number;
  abnahmeprotokollText: string;
}>;

export const DEFAULT_ABNAHMEPROTOKOLL_TEXT = [
  "Das Klimagerät wurde fachgerecht installiert und in Betrieb genommen.",
  "Der Kunde wurde in die Bedienung des Geräts eingewiesen.",
  "Die Funktion wurde gemeinsam mit dem Kunden geprüft.",
  "Es bestehen keine offensichtlichen Mängel.",
].join("\n");

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

export type SmtpTestInput = {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassEncrypted?: string;
  smtpAbsenderEmail?: string;
  adminBenachrichtigungEmail?: string;
};

export function useTestSmtp() {
  return useMutation({
    mutationFn: (input: SmtpTestInput) => api.post<{ ok: true; testMailGesendetAn: string | null }>("/settings/smtp-test", input),
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

export function useUploadVorlage(typ: "abnahmeprotokoll" | "installationsanweisung") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("datei", file);
      const res = await fetch(`/api/settings/vorlagen/${typ}`, { method: "POST", credentials: "include", body: formData });
      if (!res.ok) throw new Error("Upload fehlgeschlagen.");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
