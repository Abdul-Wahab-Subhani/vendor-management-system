"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Eye, Ban, Scale } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Form";
import { DataTable } from "@/components/ui/DataTable";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QuotationRequestFormDialog } from "@/components/quotations/QuotationRequestFormDialog";
import { useQuotationRequests, useCancelQuotationRequest } from "@/hooks/useQuotations";
import { QuotationRequest } from "@/types";
import { formatDate, debounce } from "@/lib/utils";

export default function QuotationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<QuotationRequest | null>(null);

  const debouncedSetSearch = useMemo(() => debounce((v: string) => setSearch(v), 350), []);
  const { data, isLoading } = useQuotationRequests({ page, limit: 10, search, status: status || undefined });
  const cancelRequest = useCancelQuotationRequest();

  const columns = useMemo<ColumnDef<QuotationRequest>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Request",
        cell: ({ row }) => (
          <Link href={`/quotations/requests/${row.original.id}`} className="font-medium text-ink hover:text-navy-700 dark:text-white dark:hover:text-gold-400">
            {row.original.title}
          </Link>
        ),
      },
      {
        id: "vendors",
        header: "Vendors Assigned",
        cell: ({ row }) => <span className="figure">{row.original.assignedVendors?.length ?? 0}</span>,
      },
      {
        id: "submissions",
        header: "Submissions",
        cell: ({ row }) => <span className="figure">{row.original._count?.quotations ?? 0}</span>,
      },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { accessorKey: "dueDate", header: "Due Date", cell: ({ row }) => formatDate(row.original.dueDate) },
      { accessorKey: "createdAt", header: "Created", cell: ({ row }) => formatDate(row.original.createdAt) },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ActionMenu
            items={[
              { label: "View details", icon: <Eye className="h-3.5 w-3.5" />, onClick: () => (window.location.href = `/quotations/requests/${row.original.id}`) },
              { label: "Compare quotations", icon: <Scale className="h-3.5 w-3.5" />, onClick: () => (window.location.href = `/comparison/${row.original.id}`) },
              { label: "Cancel request", icon: <Ban className="h-3.5 w-3.5" />, danger: true, onClick: () => setCancelTarget(row.original) },
            ]}
          />
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">Quotations</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Create requests, track vendor submissions, and manage approvals.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> New Request
        </Button>
      </div>

      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-navy-900 shadow-card">
        <DataTable
          data={data?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={(v) => {
            setPage(1);
            debouncedSetSearch(v);
          }}
          searchPlaceholder="Search quotation requests..."
          pagination={data?.meta}
          onPageChange={setPage}
          exportFileName="quotation-requests"
          emptyTitle="No quotation requests yet"
          emptyDescription="Create your first request and assign vendors to start collecting quotes."
          toolbarExtra={
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          }
        />
      </div>

      <QuotationRequestFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel this quotation request?"
        description={`Vendors will no longer be able to submit quotations for "${cancelTarget?.title}".`}
        confirmLabel="Cancel Request"
        variant="danger"
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) cancelRequest.mutate(cancelTarget.id);
          setCancelTarget(null);
        }}
      />
    </div>
  );
}
