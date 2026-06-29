"use client";

import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useLoginHistory } from "@/hooks/useAdmin";
import { formatDate } from "@/lib/utils";
import { History } from "lucide-react";

export function LoginHistoryDialog({
  userId,
  userName,
  onClose,
}: {
  userId: string | null;
  userName?: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useLoginHistory(userId ?? undefined, { limit: 20 });

  return (
    <Dialog open={Boolean(userId)} onClose={onClose} title="Login History" description={userName ? `Recent sign-in attempts for ${userName}` : undefined} size="md">
      {isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : !data?.items.length ? (
        <EmptyState icon={History} title="No login activity yet" />
      ) : (
        <div className="space-y-2">
          {data.items.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-lg border border-border dark:border-border-dark p-3">
              <div>
                <p className="text-sm font-medium text-ink dark:text-white">{formatDate(entry.createdAt, true)}</p>
                <p className="text-xs text-[rgb(var(--fg-muted))]">{entry.ipAddress ?? "Unknown IP"} · {entry.userAgent ?? "Unknown device"}</p>
              </div>
              <Badge tone={entry.success ? "success" : "danger"}>{entry.success ? "Success" : "Failed"}</Badge>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
