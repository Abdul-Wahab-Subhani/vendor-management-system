"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, TrendingDown, Award, Users, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, StatCard } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { StampBadge } from "@/components/ui/StampBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useComparison } from "@/hooks/useDashboard";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function ComparisonPage() {
  const params = useParams<{ requestId: string }>();
  const router = useRouter();
  const { data: comparison, isLoading } = useComparison(params.requestId);
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/comparison/${params.requestId}/export-pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `comparison-${params.requestId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to generate PDF report");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!comparison) {
    return (
      <EmptyState
        icon={Users}
        title="No quotations to compare yet"
        description="Once vendors submit their quotations for this request, they'll appear here for side-by-side comparison."
        actionLabel="Back to quotations"
        onAction={() => router.push("/quotations")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => router.push(`/quotations/requests/${params.requestId}`)} className="flex items-center gap-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-ink dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to request
        </button>
        <Button onClick={exportPdf} isLoading={exporting} variant="outline">
          <Download className="h-4 w-4" /> Export PDF Report
        </Button>
      </div>

      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">{comparison.requestTitle}</h1>
        <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Comparing {comparison.summary.vendorCount} vendor quotation(s)</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lowest Price" value={formatCurrency(comparison.summary.lowestPrice.amount, comparison.summary.lowestPrice.currency)} icon={<TrendingDown className="h-5 w-5" />} />
        <StatCard label="Best Value Pick" value={comparison.summary.bestValue.vendor} icon={<Award className="h-5 w-5" />} />
        <StatCard label="Average Quote" value={formatCurrency(comparison.summary.averageAmount, comparison.summary.lowestPrice.currency)} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Potential Savings" value={formatCurrency(comparison.summary.potentialSavings, comparison.summary.lowestPrice.currency)} icon={<TrendingDown className="h-5 w-5" />} />
      </div>

      {/* Stamp badges row — the signature procurement-stamp visual */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-border dark:border-border-dark bg-white dark:bg-navy-900 p-5">
        {comparison.rows.filter((r) => r.isLowestPrice || r.isBestValue).map((r) => (
          <div key={r.quotationId} className="flex items-center gap-3">
            <StampBadge label={r.isLowestPrice && r.isBestValue ? "Best Overall" : r.isBestValue ? "Best Value" : "Lowest Bid"} tone={r.isBestValue ? "success" : "gold"} />
            <div>
              <p className="text-sm font-semibold text-ink dark:text-white">{r.companyName}</p>
              <p className="figure text-xs text-[rgb(var(--fg-muted))]">{formatCurrency(r.amount, r.currency)}</p>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Price Comparison</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparison.rows} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="companyName" fontSize={12} width={130} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {comparison.rows.map((r, i) => (
                  <Cell key={i} fill={r.isBestValue ? "#15803D" : r.isLowestPrice ? "#FCA311" : "#14213D"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Side-by-Side Comparison</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-border-dark text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--fg-muted))]">
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tag</th>
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((r) => (
                  <tr key={r.quotationId} className="border-b border-border dark:border-border-dark last:border-0">
                    <td className="px-4 py-3 font-medium text-ink dark:text-white">{r.companyName}</td>
                    <td className="figure px-4 py-3 font-semibold">{formatCurrency(r.amount, r.currency)}</td>
                    <td className="figure px-4 py-3">{r.vendorRating.toFixed(1)}</td>
                    <td className="px-4 py-3">{formatDate(r.submissionDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      {r.isBestValue && <span className="text-xs font-semibold text-success">Best Value</span>}
                      {r.isLowestPrice && !r.isBestValue && <span className="text-xs font-semibold text-gold-600 dark:text-gold-400">Lowest</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gold-300 bg-gold-50/40 dark:border-gold-400/30 dark:bg-gold-400/5">
        <CardContent className="flex items-start gap-3 pt-5">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-gold-600 dark:text-gold-400" />
          <div>
            <p className="font-display text-sm font-semibold text-ink dark:text-white">Recommendation</p>
            <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">{comparison.recommendation}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
