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
