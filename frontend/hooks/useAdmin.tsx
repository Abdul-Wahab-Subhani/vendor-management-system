"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { User, PaginationMeta, ActivityLog } from "@/types";

// ---- Accounts (Super Admin) ----
export function useAccounts(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ["accounts", filters],
    queryFn: async () => {
      const { data } = await api.get("/accounts", { params: filters });
      return { items: data.data as User[], meta: data.meta as PaginationMeta };
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/accounts", payload)).data.data,
    onSuccess: (data: { email: string }) => {
      toast.success(`Account created. Credentials emailed to ${data.email}.`);
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateAccountStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/accounts/${id}/status`, { status })).data.data,
    onSuccess: () => {
      toast.success("Account status updated");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useResetAccountPassword() {
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/accounts/${id}/reset-password`, {})).data.data,
    onSuccess: () => toast.success("Password reset and emailed to the user"),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      toast.success("Account deleted");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ---- Vendors lookup for select inputs ----
export function useVendorOptions() {
  return useQuery({
    queryKey: ["vendor-options"],
    queryFn: async () => (await api.get("/vendors", { params: { limit: 100, status: "ACTIVE" } })).data.data,
  });
}

// ---- Emails ----
export function useSendEmail() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/emails/send", payload)).data.data,
    onSuccess: (data: { recipientCount: number }) => toast.success(`Queued for ${data.recipientCount} recipient(s)`),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useEmailHistory(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ["email-history", filters],
    queryFn: async () => {
      const { data } = await api.get("/emails/history", { params: filters });
      return { items: data.data, meta: data.meta as PaginationMeta };
    },
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => (await api.get("/emails/templates")).data.data,
  });
}

// ---- Login history ----
export function useLoginHistory(userId: string | undefined, filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["login-history", userId, filters],
    queryFn: async () => {
      const { data } = await api.get(`/accounts/${userId}/login-history`, { params: filters });
      return { items: data.data as { id: string; success: boolean; ipAddress: string | null; userAgent: string | null; createdAt: string }[], meta: data.meta as PaginationMeta };
    },
    enabled: Boolean(userId),
  });
}

// ---- Activity logs ----
export function useActivityLogs(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ["activity-logs", filters],
    queryFn: async () => {
      const { data } = await api.get("/activity-logs", { params: filters });
      return { items: data.data as ActivityLog[], meta: data.meta as PaginationMeta };
    },
  });
}
