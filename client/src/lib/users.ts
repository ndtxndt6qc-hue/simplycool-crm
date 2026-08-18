import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export type AppUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "mitarbeiter";
  createdAt: string;
};

export type UserInput = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "mitarbeiter";
};

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<AppUser[]>("/users"),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UserInput) => api.post<AppUser>("/users", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number; name?: string; role?: "admin" | "mitarbeiter" }) =>
      api.patch<AppUser>(`/users/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
