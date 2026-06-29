"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, FileSpreadsheet, Columns3, Search } from "lucide-react";
import { Button } from "./Button";
import { TableSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";
import { PaginationMeta } from "@/types";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  toolbarExtra?: React.ReactNode;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  enableRowSelection?: boolean;
  bulkActions?: (selectedRows: T[], clearSelection: () => void) => React.ReactNode;
  exportFileName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

function toCSV<T extends object>(rows: T[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]) as (keyof T)[];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Prepend to a columns array to enable row-selection checkboxes. */
export function selectionColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
    ),
    enableSorting: false,
  };
}

export function DataTable<T extends object>({
  data,
  columns,
  isLoading,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  toolbarExtra,
  pagination,
  onPageChange,
  enableRowSelection,
  bulkActions,
  exportFileName = "export",
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters.",
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = useMemo(
    () => table.getSelectedRowModel().rows.map((r) => r.original),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowSelection, data]
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border dark:border-border-dark p-4">
        <div className="flex flex-1 items-center gap-2 min-w-[200px] max-w-sm">
          {onSearchChange && (
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--fg-muted))]" />
              <input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-navy-950 pl-9 pr-3 text-sm focus:border-gold-400"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {toolbarExtra}

          {selectedRows.length > 0 && bulkActions && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-[rgb(var(--fg-muted))]">{selectedRows.length} selected</span>
              {bulkActions(selectedRows, () => setRowSelection({}))}
            </div>
          )}

          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowColumnMenu((s) => !s)}>
              <Columns3 className="h-4 w-4" /> Columns
            </Button>
            {showColumnMenu && (
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-navy-900 p-2 shadow-elevated">
                {table.getAllLeafColumns().map((col) => (
                  <label key={col.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5">
                    <input type="checkbox" checked={col.getIsVisible()} onChange={col.getToggleVisibilityHandler()} />
                    {String(col.columnDef.header ?? col.id)}
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadFile(toCSV(data), `${exportFileName}.csv`, "text/csv")}
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadFile(toCSV(data), `${exportFileName}.xls`, "application/vnd.ms-excel")}
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton cols={columns.length} />
      ) : data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-paper dark:bg-navy-950">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border dark:border-border-dark">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--fg-muted))]",
                        header.column.getCanSort() && "cursor-pointer select-none"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() &&
                          (header.column.getIsSorted() === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                          ))}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border dark:border-border-dark transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]",
                    row.getIsSelected() && "bg-gold-50/60 dark:bg-gold-400/5"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle text-ink dark:text-white">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border dark:border-border-dark p-4 text-sm">
          <span className="text-[rgb(var(--fg-muted))]">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => onPageChange?.(pagination.page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
