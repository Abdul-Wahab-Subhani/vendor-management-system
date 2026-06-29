"use client";

import Link from "next/link";
import { ClipboardList, Send, CheckCircle2, Clock } from "lucide-react";
import { StatCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuotationRequests, useQuotations } from "@/hooks/useQuotations";
import { formatDate } from "@/lib/utils";

export default function VendorPortalPage() {
  const { user } = useAuth();
  const { data: requests, isLoading: loadingRequests } = useQuotationRequests({ limit: 5, status: "OPEN" });
  const { data: quotations, isLoading: loadingQuotations } = useQuotations({ limit: 100 });

  const submitted = quotations?.items.filter((q) => q.status !== "PENDING").length ?? 0;
  const approved = quotations?.items.filter((q) => q.status === "APPROVED").length ?? 0;
  const pendingReview = quotations?.items.filter((q) => q.status === "SUBMITTED" || q.status === "UNDER_REVIEW").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Here&apos;s what&apos;s happening with your quotation requests.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingQuotations ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Open Requests" value={String(requests?.meta?.total ?? 0)} icon={<ClipboardList className="h-5 w-5" />} />
            <StatCard label="Submitted" value={String(submitted)} icon={<Send className="h-5 w-5" />} />
            <StatCard label="Awaiting Review" value={String(pendingReview)} icon={<Clock className="h-5 w-5" />} />
            <StatCard label="Approved" value={String(approved)} icon={<CheckCircle2 className="h-5 w-5" />} />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Requests Awaiting Your Response</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingRequests ? (
            <div className="p-5"><CardSkeleton /></div>
          ) : !requests?.items.length ? (
            <EmptyState icon={ClipboardList} title="No open requests" description="New quotation requests assigned to you will appear here." />
          ) : (
            <div className="divide-y divide-border dark:divide-border-dark">
              {requests.items.map((r) => (
                <Link key={r.id} href="/vendor-portal/quotations" className="flex items-center justify-between p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                  <div>
                    <p className="text-sm font-medium text-ink dark:text-white">{r.title}</p>
                    <p className="text-xs text-[rgb(var(--fg-muted))]">Due {formatDate(r.dueDate)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
