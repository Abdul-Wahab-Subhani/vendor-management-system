"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Vendor, PaginationMeta } from "@/types";

interface VendorFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export function useVendors(filters: VendorFilters) {
  return useQuery({
    queryKey: ["vendors", filters],
    queryFn: async () => {
      const { data } = await api.get("/vendors", { params: filters });
      return { items: data.data as Vendor[], meta: data.meta as PaginationMeta };
    },
  });
}

export function useVendor(id: string | undefined) {
  return useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const { data } = await api.get(`/vendors/${id}`);
      return data.data as Vendor;
    },
    enabled: Boolean(id),
  });
}

export function useVendorStats() {
  return useQuery({
    queryKey: ["vendor-stats"],
    queryFn: async () => {
      const { data } = await api.get("/vendors/stats");
      return data.data as { total: number; active: number; inactive: number; pending: number; blacklisted: number };
    },
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/vendors", payload)).data.data,
    onSuccess: () => {
      toast.success("Vendor created successfully");
      qc.invalidateQueries({ queryKey: ["vendors"] });
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      (await api.put(`/vendors/${id}`, payload)).data.data,
    onSuccess: (_d, vars) => {
      toast.success("Vendor updated");
      qc.invalidateQueries({ queryKey: ["vendors"] });
      qc.invalidateQueries({ queryKey: ["vendor", vars.id] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateVendorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/vendors/${id}/status`, { status })).data.data,
    onSuccess: () => {
      toast.success("Vendor status updated");
      qc.invalidateQueries({ queryKey: ["vendors"] });
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/vendors/${id}`),
    onSuccess: () => {
      toast.success("Vendor deleted");
      qc.invalidateQueries({ queryKey: ["vendors"] });
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useAddVendorNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) =>
      (await api.post(`/vendors/${id}/notes`, { content })).data.data,
    onSuccess: (_d, vars) => {
      toast.success("Note added");
      qc.invalidateQueries({ queryKey: ["vendor", vars.id] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUploadVendorDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return (await api.post(`/vendors/${id}/documents`, form, { headers: { "Content-Type": "multipart/form-data" } })).data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success("Document uploaded");
      qc.invalidateQueries({ queryKey: ["vendor", vars.id] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
