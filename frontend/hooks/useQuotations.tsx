"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { QuotationRequest, Quotation, PaginationMeta } from "@/types";

export function useQuotationRequests(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ["quotation-requests", filters],
    queryFn: async () => {
      const { data } = await api.get("/quotations/requests", { params: filters });
      return { items: data.data as QuotationRequest[], meta: data.meta as PaginationMeta };
    },
  });
}

export function useQuotationRequest(id: string | undefined) {
  return useQuery({
    queryKey: ["quotation-request", id],
    queryFn: async () => (await api.get(`/quotations/requests/${id}`)).data.data as QuotationRequest,
    enabled: Boolean(id),
  });
}

export function useCreateQuotationRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/quotations/requests", payload)).data.data,
    onSuccess: () => {
      toast.success("Quotation request created and vendors notified");
      qc.invalidateQueries({ queryKey: ["quotation-requests"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCancelQuotationRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/quotations/requests/${id}/cancel`)).data.data,
    onSuccess: (_d, id) => {
      toast.success("Request cancelled");
      qc.invalidateQueries({ queryKey: ["quotation-requests"] });
      qc.invalidateQueries({ queryKey: ["quotation-request", id] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useAssignVendors() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vendorIds }: { id: string; vendorIds: string[] }) =>
      (await api.post(`/quotations/requests/${id}/assign-vendors`, { vendorIds })).data.data,
    onSuccess: (_d, vars) => {
      toast.success("Vendors assigned");
      qc.invalidateQueries({ queryKey: ["quotation-request", vars.id] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useSubmitQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, payload }: { requestId: string; payload: Record<string, unknown> }) =>
      (await api.post(`/quotations/requests/${requestId}/submit`, payload)).data.data,
    onSuccess: (_d, vars) => {
      toast.success("Quotation submitted successfully");
      qc.invalidateQueries({ queryKey: ["quotation-request", vars.requestId] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useQuotations(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ["quotations", filters],
    queryFn: async () => {
      const { data } = await api.get("/quotations", { params: filters });
      return { items: data.data as Quotation[], meta: data.meta as PaginationMeta };
    },
  });
}

export function useQuotationStats() {
  return useQuery({
    queryKey: ["quotation-stats"],
    queryFn: async () => (await api.get("/quotations/stats")).data.data as {
      active: number;
      pending: number;
      approved: number;
      rejected: number;
      submitted: number;
    },
  });
}

export function useUpdateQuotationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, internalNotes }: { id: string; status: string; internalNotes?: string }) =>
      (await api.patch(`/quotations/${id}/status`, { status, internalNotes })).data.data,
    onSuccess: () => {
      toast.success("Quotation status updated");
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["quotation-request"] });
      qc.invalidateQueries({ queryKey: ["quotation-stats"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
