"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types";

export function DashboardShell({
  children,
  title,
  allowedRoles,
}: {
  children: React.ReactNode;
  title?: string;
  allowedRoles: Role[];
}) {
  const { user, isInitializing } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(user.role === "VENDOR" ? "/vendor-portal" : "/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isInitializing]);

  if (isInitializing || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper dark:bg-navy-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-800 border-t-transparent dark:border-gold-400 dark:border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper dark:bg-navy-950">
      <Sidebar role={user.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
