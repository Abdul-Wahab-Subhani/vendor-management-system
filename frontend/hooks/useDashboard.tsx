"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ComparisonResult, ActivityLog } from "@/types";

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => (await api.get("/dashboard/overview")).data.data,
  });
}

export function useMonthlyAnalytics(months = 6) {
  return useQuery({
    queryKey: ["dashboard-monthly", months],
    queryFn: async () => (await api.get("/dashboard/monthly-analytics", { params: { months } })).data.data,
  });
}

export function useStatusBreakdown() {
  return useQuery({
    queryKey: ["dashboard-status-breakdown"],
    queryFn: async () => (await api.get("/dashboard/status-breakdown")).data.data as { status: string; count: number }[],
  });
}

export function useTopVendors() {
  return useQuery({
    queryKey: ["dashboard-top-vendors"],
    queryFn: async () => (await api.get("/dashboard/top-vendors")).data.data as {
      vendor: string;
      rating: number;
      totalValue: number;
      approvedCount: number;
    }[],
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ["dashboard-recent-activity", limit],
    queryFn: async () => (await api.get("/dashboard/recent-activity", { params: { limit } })).data.data as ActivityLog[],
  });
}

export function useComparison(requestId: string | undefined) {
  return useQuery({
    queryKey: ["comparison", requestId],
    queryFn: async () => (await api.get(`/comparison/${requestId}`)).data.data as ComparisonResult,
    enabled: Boolean(requestId),
  });
}
