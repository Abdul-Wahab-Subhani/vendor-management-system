"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Scale, CheckCircle2, XCircle, Clock, FileText, Paperclip } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea, Label } from "@/components/ui/Form";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useQuotationRequest, useUpdateQuotationStatus } from "@/hooks/useQuotations";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Quotation } from "@/types";

export default function QuotationRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: request, isLoading } = useQuotationRequest(params.id);
  const updateStatus = useUpdateQuotationStatus();
  const [reviewTarget, setReviewTarget] = useState<Quotation | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [notes, setNotes] = useState("");

  if (isLoading || !request) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const submittedCount = request.quotations?.filter((q) => q.status !== "PENDING").length ?? 0;

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/quotations")} className="flex items-center gap-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-ink dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to quotations
      </button>

      <Card className="overflow-hidden">
        <div className="h-2 bg-gold-400" />
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-semibold text-ink dark:text-white">{request.title}</h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--fg-muted))]">{request.description}</p>
            <p className="mt-3 text-xs text-[rgb(var(--fg-muted))]">
              Created by {request.createdBy?.name} · Due {formatDate(request.dueDate)} ·{" "}
              {request.assignedVendors?.length ?? 0} vendor(s) assigned · {submittedCount} submission(s)
            </p>
          </div>
          {submittedCount > 0 && (
            <Button onClick={() => router.push(`/comparison/${request.id}`)}>
              <Scale className="h-4 w-4" /> Compare Quotations
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Assigned Vendors</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {request.assignedVendors?.map((av) => (
              <div key={av.id} className="flex items-center justify-between rounded-lg border border-border dark:border-border-dark p-3">
                <span className="text-sm font-medium">{av.vendor.companyName}</span>
                <StatusBadge status={av.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Submitted Quotations</CardTitle></CardHeader>
          <CardContent>
            {!request.quotations?.length ? (
              <EmptyState icon={FileText} title="No submissions yet" description="Quotations will appear here once vendors respond." />
            ) : (
              <div className="space-y-3">
                {request.quotations.map((q) => (
                  <div key={q.id} className="rounded-lg border border-border dark:border-border-dark p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink dark:text-white">{q.vendor.companyName}</p>
                        <p className="text-xs text-[rgb(var(--fg-muted))]">{q.title} · Submitted {formatDate(q.submissionDate)}</p>
                        {q.attachments && q.attachments.length > 0 && (
                          <a href={q.attachments[0].fileUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-navy-700 dark:text-gold-400">
                            <Paperclip className="h-3 w-3" /> {q.attachments[0].fileName}
                          </a>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="figure text-sm font-bold text-ink dark:text-white">{formatCurrency(Number(q.amount), q.currency)}</p>
                        <StatusBadge status={q.status} />
                      </div>
                    </div>
                    {(q.status === "SUBMITTED" || q.status === "UNDER_REVIEW") && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="success" onClick={() => { setReviewTarget(q); setReviewAction("APPROVED"); }}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => { setReviewTarget(q); setReviewAction("REJECTED"); }}>
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                    {q.status === "APPROVED" || q.status === "REJECTED" ? (
                      <p className="mt-2 flex items-center gap-1 text-xs text-[rgb(var(--fg-muted))]">
                        <Clock className="h-3 w-3" /> Reviewed by {q.reviewedBy?.name ?? "—"}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(reviewTarget)}
        onClose={() => { setReviewTarget(null); setNotes(""); }}
        title={reviewAction === "APPROVED" ? "Approve Quotation" : "Reject Quotation"}
        description={`${reviewTarget?.vendor.companyName} — ${reviewTarget ? formatCurrency(Number(reviewTarget.amount), reviewTarget.currency) : ""}`}
        size="sm"
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context for this decision..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setReviewTarget(null); setNotes(""); }}>Cancel</Button>
            <Button
              variant={reviewAction === "APPROVED" ? "success" : "danger"}
              isLoading={updateStatus.isPending}
              onClick={async () => {
                if (!reviewTarget || !reviewAction) return;
                await updateStatus.mutateAsync({ id: reviewTarget.id, status: reviewAction, internalNotes: notes });
                setReviewTarget(null);
                setNotes("");
              }}
            >
              Confirm {reviewAction === "APPROVED" ? "Approval" : "Rejection"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
