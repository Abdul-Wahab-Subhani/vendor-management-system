"use client";

import { Building2, FileText, Clock, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { StatCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDashboardOverview, useMonthlyAnalytics, useStatusBreakdown, useTopVendors, useRecentActivity } from "@/hooks/useDashboard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Activity } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#B45309",
  SUBMITTED: "#2D4A78",
  UNDER_REVIEW: "#E08E00",
  APPROVED: "#15803D",
  REJECTED: "#DC2626",
  CANCELLED: "#6B7280",
};

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useDashboardOverview();
  const { data: monthly, isLoading: loadingMonthly } = useMonthlyAnalytics(6);
  const { data: statusBreakdown } = useStatusBreakdown();
  const { data: topVendors } = useTopVendors();
  const { data: recentActivity } = useRecentActivity(8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">An overview of vendors, quotations, and procurement activity.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingOverview ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Vendors" value={String(overview?.totalVendors ?? 0)} icon={<Building2 className="h-5 w-5" />} />
            <StatCard label="Active Quotations" value={String(overview?.activeQuotationRequests ?? 0)} icon={<FileText className="h-5 w-5" />} />
            <StatCard label="Pending Quotations" value={String(overview?.pendingQuotations ?? 0)} icon={<Clock className="h-5 w-5" />} />
            <StatCard label="Approved Value" value={formatCurrency(overview?.totalApprovedValue ?? 0)} icon={<TrendingUp className="h-5 w-5" />} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Requests" value={String(overview?.totalQuotationRequests ?? 0)} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Approved" value={String(overview?.approvedQuotations ?? 0)} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Rejected" value={String(overview?.rejectedQuotations ?? 0)} icon={<XCircle className="h-5 w-5" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Quotation Volume & Value</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMonthly ? (
              <div className="h-72 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            ) : (
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: number, name: string) => (name === "totalValue" ? formatCurrency(value) : value)}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="quotations" name="Quotations" fill="#14213D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Approved" fill="#FCA311" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quotation Status Mix</CardTitle>
          </CardHeader>
          <CardContent>
            {!statusBreakdown?.length ? (
              <EmptyState title="No data yet" description="Status breakdown will appear once quotations come in." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] ?? "#6B7280"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vendor Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="vendors" name="New Vendors" stroke="#FCA311" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentActivity?.length ? (
              <EmptyState icon={Activity} title="No activity yet" />
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="flex gap-3 border-b border-border dark:border-border-dark pb-3 last:border-0 last:pb-0">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                  <div>
                    <p className="text-sm text-ink dark:text-white">{log.description}</p>
                    <p className="text-xs text-[rgb(var(--fg-muted))]">{formatDate(log.createdAt, true)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {!!topVendors?.length && (
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Approved Value</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topVendors} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="vendor" fontSize={12} width={120} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="totalValue" fill="#14213D" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
