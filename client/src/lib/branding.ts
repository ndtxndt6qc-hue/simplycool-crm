import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type Branding = {
  firmenname: string;
  logoDataUri: string | null;
};

export function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: () => api.get<Branding>("/auth/branding"),
    staleTime: 5 * 60 * 1000,
  });
}
