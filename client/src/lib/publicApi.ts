import { useQuery } from "@tanstack/react-query";

export type Branding = { firmenname: string; hatLogo: boolean };

export const PUBLIC_LOGO_URL = "/api/public/logo";

export function useBranding() {
  return useQuery({
    queryKey: ["public", "branding"],
    queryFn: async () => {
      const res = await fetch("/api/public/branding");
      if (!res.ok) throw new Error("Branding konnte nicht geladen werden.");
      return res.json() as Promise<Branding>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export type PublicReferenzFoto = { id: number; typ: "vorher" | "nachher"; url: string };
export type PublicReferenz = {
  id: number;
  ort: string;
  anzahlGeraete: number;
  beschreibung: string | null;
  fotos: PublicReferenzFoto[];
};

export function usePublicReferenzen(limit?: number) {
  return useQuery({
    queryKey: ["public", "referenzen", limit ?? "all"],
    queryFn: async () => {
      const res = await fetch(`/api/public/referenzen${limit ? `?limit=${limit}` : ""}`);
      if (!res.ok) throw new Error("Referenzen konnten nicht geladen werden.");
      return res.json() as Promise<PublicReferenz[]>;
    },
    staleTime: 60 * 1000,
  });
}
