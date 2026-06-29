"use client";

import { useState } from "react";
import { Menu, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";

export function Topbar({ onMenuClick, title }: { onMenuClick: () => void; title?: string }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border dark:border-border-dark bg-paper/80 dark:bg-navy-950/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="font-display text-lg font-semibold text-ink dark:text-white">{title}</h1>}
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationsDropdown />

        <div className="relative ml-1">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10">
            <Avatar name={user?.name ?? "?"} src={user?.avatarUrl} size="sm" />
            <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[rgb(var(--fg-muted))]" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-48 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-navy-900 p-1.5 shadow-elevated animate-fade-in">
                <div className="px-3 py-2 text-xs text-[rgb(var(--fg-muted))]">{user?.email}</div>
                <a
                  href={user?.role === "VENDOR" ? "/vendor-portal/settings" : "/settings"}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <UserIcon className="h-4 w-4" /> Profile & Settings
                </a>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
