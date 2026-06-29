"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useActivityLogs } from "@/hooks/useAdmin";
import { ActivityLog } from "@/types";
import { formatDate } from "@/lib/utils";

const ENTITY_TONE: Record<string, "info" | "success" | "warning" | "danger" | "neutral" | "gold"> = {
  Vendor: "info",
  Quotation: "success",
  QuotationRequest: "gold",
  User: "warning",
  EmailLog: "neutral",
};

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useActivityLogs({ page, limit: 20 });

  const columns = useMemo<ColumnDef<ActivityLog>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) =>
          row.original.user ? (
            <div className="flex items-center gap-2">
              <Avatar name={row.original.user.name} size="sm" />
              <span className="text-sm font-medium">{row.original.user.name}</span>
            </div>
          ) : (
            <span className="text-sm text-[rgb(var(--fg-muted))]">System</span>
          ),
      },
      {
        accessorKey: "description",
        header: "Action",
        cell: ({ row }) => <span className="text-sm">{row.original.description}</span>,
      },
      {
        accessorKey: "entityType",
        header: "Entity",
        cell: ({ row }) => <Badge tone={ENTITY_TONE[row.original.entityType] ?? "neutral"}>{row.original.entityType}</Badge>,
      },
      { accessorKey: "createdAt", header: "When", cell: ({ row }) => formatDate(row.original.createdAt, true) },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">Activity Logs</h1>
        <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">A complete audit trail of every important action across the platform.</p>
      </div>

      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-navy-900 shadow-card">
        <DataTable
          data={data?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          pagination={data?.meta}
          onPageChange={setPage}
          exportFileName="activity-logs"
          emptyTitle="No activity recorded yet"
        />
      </div>
    </div>
  );
}
