import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { BookingStatus } from "@klimainstall/shared";

export type AvailabilityRule = {
  id: number;
  wochentag: number;
  startzeit: string;
  endzeit: string;
  aktiv: boolean;
};

export type BlockedSlot = {
  id: number;
  datum: string;
  startzeit: string | null;
  endzeit: string | null;
  grund: string | null;
  createdAt: string;
};

export type Booking = {
  id: number;
  datum: string;
  startzeit: string;
  endzeit: string;
  name: string;
  telefon: string | null;
  email: string | null;
  plz: string;
  ort: string;
  nachricht: string | null;
  quelle: string;
  status: BookingStatus;
  leadId: number | null;
  icsUid: string;
  createdAt: string;
};

function buildQuery(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) usp.set(k, v);
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export function useAvailabilityRules() {
  return useQuery({
    queryKey: ["booking", "availability-rules"],
    queryFn: () => api.get<AvailabilityRule[]>("/booking/availability-rules"),
  });
}

export function useCreateAvailabilityRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { wochentag: number; startzeit: string; endzeit: string; aktiv?: boolean }) =>
      api.post<AvailabilityRule>("/booking/availability-rules", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking", "availability-rules"] }),
  });
}

export function useUpdateAvailabilityRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<{ startzeit: string; endzeit: string; aktiv: boolean }>) =>
      api.patch<AvailabilityRule>(`/booking/availability-rules/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking", "availability-rules"] }),
  });
}

export function useDeleteAvailabilityRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/booking/availability-rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking", "availability-rules"] }),
  });
}

export function useBlockedSlots(von?: string, bis?: string) {
  return useQuery({
    queryKey: ["booking", "blocked-slots", von, bis],
    queryFn: () => api.get<BlockedSlot[]>(`/booking/blocked-slots${buildQuery({ von, bis })}`),
  });
}

export function useCreateBlockedSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { datum: string; startzeit?: string; endzeit?: string; grund?: string }) =>
      api.post<BlockedSlot>("/booking/blocked-slots", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking", "blocked-slots"] }),
  });
}

export function useDeleteBlockedSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/booking/blocked-slots/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking", "blocked-slots"] }),
  });
}

export function useBookings(von?: string, bis?: string) {
  return useQuery({
    queryKey: ["booking", "bookings", von, bis],
    queryFn: () => api.get<Booking[]>(`/booking/bookings${buildQuery({ von, bis })}`),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: BookingStatus }) =>
      api.patch<Booking>(`/booking/bookings/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking", "bookings"] }),
  });
}
