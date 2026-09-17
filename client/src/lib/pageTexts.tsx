import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { PAGE_TEXT_FIELDS } from "./pageTextRegistry";

function defaultsMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of PAGE_TEXT_FIELDS) map[f.id] = f.default;
  return map;
}

// Öffentlich, ohne Login — für die V1/V2-Webseite.
function usePublicPageTextOverrides() {
  return useQuery({
    queryKey: ["public", "page-texts"],
    queryFn: async () => {
      const res = await fetch("/api/public/page-texts");
      if (!res.ok) throw new Error("Seitentexte konnten nicht geladen werden.");
      return res.json() as Promise<Record<string, string>>;
    },
    staleTime: 60 * 1000,
  });
}

const PageTextsContext = createContext<Record<string, string> | null>(null);

export function PageTextsProvider({ children }: { children: ReactNode }) {
  const { data: overrides } = usePublicPageTextOverrides();
  const map = useMemo(() => ({ ...defaultsMap(), ...overrides }), [overrides]);
  return <PageTextsContext.Provider value={map}>{children}</PageTextsContext.Provider>;
}

// Liefert die gemergte Map (Default + DB-Override). Nicht direkt pro Feld als Hook aufrufen,
// damit Aufrufe in Schleifen (z.B. FAQ-Liste) nicht gegen die Rules of Hooks verstossen —
// stattdessen einmal usePageTextMap() aufrufen und danach getText(map, id) beliebig oft nutzen.
export function usePageTextMap(): Record<string, string> {
  const ctx = useContext(PageTextsContext);
  return ctx ?? defaultsMap();
}

export function getText(map: Record<string, string>, id: string): string {
  return map[id] ?? "";
}

// Kontaktdaten inkl. daraus abgeleitetem tel:-Link (Schweizer Format: führende 0 -> +41).
export function useKontaktInfo() {
  const map = usePageTextMap();
  const telefon = getText(map, "kontakt.telefon");
  const email = getText(map, "kontakt.email");
  const einsatzgebiet = getText(map, "kontakt.einsatzgebiet");
  const digits = telefon.replace(/\D/g, "").replace(/^0/, "");
  const telefonHref = `tel:+41${digits}`;
  return { telefon, telefonHref, email, einsatzgebiet };
}

// Authentifiziert — für den Editor im internen Bereich.
export function useAdminPageTexts() {
  return useQuery({
    queryKey: ["admin", "page-texts"],
    queryFn: () => api.get<Record<string, string>>("/page-texts"),
    // Kein Hintergrund-Refetch (z.B. bei Fenster-Fokus) während der Bearbeitung im Editor —
    // das würde unsicherte Änderungen im Formular sonst überschreiben.
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

export function useSavePageTexts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entries: Record<string, string>) => api.patch<Record<string, string>>("/page-texts", { entries }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "page-texts"] });
      qc.invalidateQueries({ queryKey: ["public", "page-texts"] });
    },
  });
}
