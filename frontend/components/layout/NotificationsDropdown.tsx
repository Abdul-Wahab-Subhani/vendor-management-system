"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Notification } from "@/types";
import { formatDate, cn } from "@/lib/utils";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications?limit=8");
      return res.data.data as { items: Notification[]; unreadCount: number };
    },
    refetchInterval: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-navy-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-navy-900 shadow-elevated animate-fade-in">
            <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button onClick={() => markAllRead.mutate()} className="flex items-center gap-1 text-xs text-navy-700 dark:text-gold-400">
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!data?.items.length && <p className="px-4 py-8 text-center text-sm text-[rgb(var(--fg-muted))]">No notifications yet</p>}
              {data?.items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => !n.isRead && markRead.mutate(n.id)}
                  className={cn(
                    "block border-b border-border dark:border-border-dark px-4 py-3 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]",
                    !n.isRead && "bg-gold-50/40 dark:bg-gold-400/5"
                  )}
                >
                  <p className="text-sm font-medium text-ink dark:text-white">{n.title}</p>
                  <p className="mt-0.5 text-xs text-[rgb(var(--fg-muted))] line-clamp-2">{n.message}</p>
                  <p className="mt-1 text-[11px] text-[rgb(var(--fg-muted))]">{formatDate(n.createdAt, true)}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
