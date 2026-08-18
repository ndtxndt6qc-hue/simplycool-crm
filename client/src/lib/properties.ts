import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export type Property = {
  id: number;
  customerId: number;
  strasse: string;
  plz: string;
  ort: string;
  notiz: string | null;
  createdAt: string;
};

export type PropertyInput = {
  customerId: number;
  strasse: string;
  plz: string;
  ort: string;
  notiz?: string;
};

export type PropertyPhoto = {
  id: number;
  propertyId: number;
  dateipfad: string;
  beschriftung: string | null;
  createdAt: string;
};

export function useProperties(customerId: number | undefined) {
  return useQuery({
    queryKey: ["properties", { customerId }],
    queryFn: () => api.get<Property[]>(`/properties?customerId=${customerId}`),
    enabled: customerId !== undefined,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PropertyInput) => api.post<Property>("/properties", input),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["properties", { customerId: vars.customerId }] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<PropertyInput>) =>
      api.patch<Property>(`/properties/${id}`, input),
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["properties", { customerId: data.customerId }] }),
  });
}

export function useDeleteProperty(customerId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/properties/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties", { customerId }] }),
  });
}

export function usePropertyPhotos(propertyId: number | undefined) {
  return useQuery({
    queryKey: ["property-photos", propertyId],
    queryFn: () => api.get<PropertyPhoto[]>(`/properties/${propertyId}/photos`),
    enabled: propertyId !== undefined,
  });
}

export function useUploadPropertyPhoto(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("foto", file);
      const res = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload fehlgeschlagen.");
      }
      return res.json() as Promise<PropertyPhoto>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["property-photos", propertyId] }),
  });
}

export function useDeletePropertyPhoto(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: number) => api.delete<void>(`/properties/photos/${photoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["property-photos", propertyId] }),
  });
}
