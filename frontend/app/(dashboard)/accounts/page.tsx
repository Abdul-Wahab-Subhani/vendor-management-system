"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, KeyRound, Ban, CheckCircle2, Trash2, History, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Form";
import { DataTable } from "@/components/ui/DataTable";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccountFormDialog } from "@/components/admin/AccountFormDialog";
import { LoginHistoryDialog } from "@/components/admin/LoginHistoryDialog";
import { useAccounts, useUpdateAccountStatus, useResetAccountPassword, useDeleteAccount } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types";
import { formatDate, debounce } from "@/lib/utils";

export default function AccountsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [historyTarget, setHistoryTarget] = useState<User | null>(null);

  const debouncedSetSearch = useMemo(() => debounce((v: string) => setSearch(v), 350), []);
  const { data, isLoading } = useAccounts({ page, limit: 10, search, role: role || undefined });
  const updateStatus = useUpdateAccountStatus();
  const resetPassword = useResetAccountPassword();
  const deleteAccount = useDeleteAccount();

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar name={row.original.name} size="sm" />
            <div>
              <p className="font-medium text-ink dark:text-white">{row.original.name}</p>
              <p className="text-xs text-[rgb(var(--fg-muted))]">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "role", header: "Role", cell: ({ row }) => <StatusBadge status={row.original.role} /> },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status ?? "ACTIVE"} /> },
      {
        id: "verified",
        header: "Verified",
        cell: ({ row }) => <Badge tone={row.original.isEmailVerified ? "success" : "warning"}>{row.original.isEmailVerified ? "Yes" : "Pending"}</Badge>,
      },
      { accessorKey: "lastLoginAt", header: "Last Login", cell: ({ row }) => formatDate(row.original.lastLoginAt, true) },
      { accessorKey: "createdAt", header: "Created", cell: ({ row }) => formatDate(row.original.createdAt) },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <ActionMenu
              items={[
                u.status === "ACTIVE"
                  ? { label: "Deactivate", icon: <Ban className="h-3.5 w-3.5" />, onClick: () => updateStatus.mutate({ id: u.id, status: "INACTIVE" }) }
                  : { label: "Activate", icon: <CheckCircle2 className="h-3.5 w-3.5" />, onClick: () => updateStatus.mutate({ id: u.id, status: "ACTIVE" }) },
                { label: "Reset password", icon: <KeyRound className="h-3.5 w-3.5" />, onClick: () => resetPassword.mutate(u.id) },
                { label: "View login history", icon: <History className="h-3.5 w-3.5" />, onClick: () => setHistoryTarget(u) },
                { label: "Delete account", icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => setDeleteTarget(u) },
              ]}
            />
          );
        },
      },
    ],
    [updateStatus, resetPassword]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">Admin & Vendor Accounts</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Create accounts, assign roles, and manage access.</p>
        </div>
        {user?.role === "SUPER_ADMIN" && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Create Account
          </Button>
        )}
      </div>

      {user?.role !== "SUPER_ADMIN" ? (
        <EmptyState
          icon={ShieldAlert}
          title="Super Admin access required"
          description="Account management is restricted to Super Admin users. Contact your system administrator if you need access."
        />
      ) : (
        <>
          <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-navy-900 shadow-card">
            <DataTable
              data={data?.items ?? []}
              columns={columns}
              isLoading={isLoading}
              searchValue={search}
              onSearchChange={(v) => { setPage(1); debouncedSetSearch(v); }}
              searchPlaceholder="Search by name or email..."
              pagination={data?.meta}
              onPageChange={setPage}
              exportFileName="accounts"
              emptyTitle="No accounts found"
              toolbarExtra={
                <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-44">
                  <option value="">All roles</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VENDOR">Vendor</option>
                </Select>
              }
            />
          </div>

          <AccountFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

          <ConfirmDialog
            open={Boolean(deleteTarget)}
            title="Delete this account?"
            description={`"${deleteTarget?.name}" will permanently lose access. This cannot be undone.`}
            confirmLabel="Delete"
            variant="danger"
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => {
              if (deleteTarget) deleteAccount.mutate(deleteTarget.id);
              setDeleteTarget(null);
            }}
          />
        </>
      )}
      <LoginHistoryDialog userId={historyTarget?.id ?? null} userName={historyTarget?.name} onClose={() => setHistoryTarget(null)} />
    </div>
  );
}
