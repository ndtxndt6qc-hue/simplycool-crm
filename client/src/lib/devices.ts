import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { StockMovementTyp } from "@klimainstall/shared";

export type Device = {
  id: number;
  hersteller: string;
  modell: string;
  kuehlleistungKw: string | null;
  heizleistungKw: string | null;
  kaeltemittel: string | null;
  einkaufspreis: string;
  empfVerkaufspreis: string;
  lieferantId: number | null;
  bildPfad: string | null;
  lagerbestand: number;
  mindestbestand: number;
  notiz: string | null;
  aktiv: boolean;
  verplant: number;
  verfuegbar: number;
};

export type DeviceInput = {
  hersteller: string;
  modell: string;
  kuehlleistungKw?: number;
  heizleistungKw?: number;
  kaeltemittel?: string;
  einkaufspreis: number;
  empfVerkaufspreis: number;
  lieferantId?: number;
  mindestbestand?: number;
  notiz?: string;
  aktiv?: boolean;
};

export type StockMovement = {
  id: number;
  deviceId: number;
  typ: StockMovementTyp;
  menge: number;
  orderId: number | null;
  notiz: string | null;
  datum: string;
  createdAt: string;
};

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<Device[]>("/devices"),
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DeviceInput) => api.post<Device>("/devices", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<DeviceInput>) =>
      api.patch<Device>(`/devices/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}

export function useUploadDeviceImage(deviceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("bild", file);
      const res = await fetch(`/api/devices/${deviceId}/bild`, { method: "POST", credentials: "include", body: formData });
      if (!res.ok) throw new Error("Upload fehlgeschlagen.");
      return res.json() as Promise<Device>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}

export function useStockMovements(deviceId: number | undefined) {
  return useQuery({
    queryKey: ["stock-movements", deviceId],
    queryFn: () => api.get<StockMovement[]>(`/devices/${deviceId}/stock-movements`),
    enabled: deviceId !== undefined,
  });
}

export function useCreateStockMovement(deviceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { typ: StockMovementTyp; menge: number; notiz?: string }) =>
      api.post<{ movement: StockMovement; device: Device }>(`/devices/${deviceId}/stock-movements`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-movements", deviceId] });
      qc.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}
