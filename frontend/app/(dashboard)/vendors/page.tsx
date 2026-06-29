"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Eye, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Form";
import { DataTable } from "@/components/ui/DataTable";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { StatusBadge } from "@/components/ui/Badge";
import { useVendors, useDeleteVendor } from "@/hooks/useVendors";
import { Vendor } from "@/types";
import { formatDate, debounce } from "@/lib/utils";
import { VendorFormDialog } from "@/components/vendors/VendorFormDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function VendorsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);

  const debouncedSetSearch = useMemo(() => debounce((v: string) => setSearch(v), 350), []);

  const { data, isLoading } = useVendors({ page, limit: 10, search, status: status || undefined });
  const deleteVendor = useDeleteVendor();

  const columns = useMemo<ColumnDef<Vendor>[]>(
    () => [
      {
        accessorKey: "companyName",
        header: "Company",
        cell: ({ row }) => (
          <Link href={`/vendors/${row.original.id}`} className="font-medium text-ink hover:text-navy-700 dark:text-white dark:hover:text-gold-400">
            {row.original.companyName}
          </Link>
        ),
      },
      { accessorKey: "vendorName", header: "Contact" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "contactNumber", header: "Phone" },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => (
          <span className="flex items-center gap-1 figure">
            <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" /> {(row.original.rating ?? 0).toFixed(1)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "registrationDate",
        header: "Registered",
        cell: ({ row }) => formatDate(row.original.registrationDate),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ActionMenu
            items={[
              { label: "View details", icon: <Eye className="h-3.5 w-3.5" />, onClick: () => (window.location.href = `/vendors/${row.original.id}`) },
              { label: "Edit", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => setEditVendor(row.original) },
              { label: "Delete", icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => setDeleteTarget(row.original) },
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
          <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">Vendors</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Manage your vendor directory and onboarding status.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Add Vendor
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
          searchPlaceholder="Search by name, company, or email..."
          pagination={data?.meta}
          onPageChange={setPage}
          exportFileName="vendors"
          emptyTitle="No vendors yet"
          emptyDescription="Add your first vendor to start building your procurement directory."
          toolbarExtra={
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
              <option value="BLACKLISTED">Blacklisted</option>
            </Select>
          }
        />
      </div>

      <VendorFormDialog open={formOpen || Boolean(editVendor)} vendor={editVendor} onClose={() => { setFormOpen(false); setEditVendor(null); }} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete vendor?"
        description={`This will permanently remove "${deleteTarget?.companyName}" and all associated records.`}
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteVendor.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
