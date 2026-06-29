"use client";

import { useState } from "react";
import { Send, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { SubmitQuotationDialog } from "@/components/vendor-portal/SubmitQuotationDialog";
import { useQuotationRequests, useQuotations } from "@/hooks/useQuotations";
import { QuotationRequest } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VendorQuotationsPage() {
  const [tab, setTab] = useState("requests");
  const [submitTarget, setSubmitTarget] = useState<QuotationRequest | null>(null);
  const { data: requests, isLoading: loadingRequests } = useQuotationRequests({ limit: 50 });
  const { data: quotations, isLoading: loadingQuotations } = useQuotations({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">My Quotations</h1>
        <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Respond to assigned requests and track your submissions.</p>
      </div>

      <Tabs
        tabs={[
          { value: "requests", label: "Assigned Requests" },
          { value: "submissions", label: "My Submissions" },
        ]}
        onChange={setTab}
      />

      {tab === "requests" && (
        <Card>
          <CardContent className="p-0">
            {loadingRequests ? (
              <div className="p-5"><CardSkeleton /></div>
            ) : !requests?.items.length ? (
              <EmptyState icon={FileText} title="No quotation requests yet" description="Requests assigned to your company will appear here." />
            ) : (
              <div className="divide-y divide-border dark:divide-border-dark">
                {requests.items.map((r) => {
                  return (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium text-ink dark:text-white">{r.title}</p>
                        <p className="text-xs text-[rgb(var(--fg-muted))]">Due {formatDate(r.dueDate)} · Status: <StatusBadge status={r.status} /></p>
                      </div>
                      <Button
                        size="sm"
                        disabled={r.status === "CLOSED" || r.status === "CANCELLED"}
                        onClick={() => setSubmitTarget(r)}
                      >
                        <Send className="h-3.5 w-3.5" /> Submit Quotation
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "submissions" && (
        <Card>
          <CardContent className="p-0">
            {loadingQuotations ? (
              <div className="p-5"><CardSkeleton /></div>
            ) : !quotations?.items.length ? (
              <EmptyState icon={Send} title="No submissions yet" description="Quotations you submit will appear here with their review status." />
            ) : (
              <div className="divide-y divide-border dark:divide-border-dark">
                {quotations.items.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-ink dark:text-white">{q.title}</p>
                      <p className="text-xs text-[rgb(var(--fg-muted))]">For: {q.quotationRequest?.title} · Submitted {formatDate(q.submissionDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="figure text-sm font-semibold">{formatCurrency(Number(q.amount), q.currency)}</span>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <SubmitQuotationDialog request={submitTarget} onClose={() => setSubmitTarget(null)} />
    </div>
  );
}
