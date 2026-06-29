"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Scale,
  Users,
  Mail,
  ScrollText,
  Settings,
  ClipboardList,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: Role[];
}

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Vendors", href: "/vendors", icon: Building2 },
  { label: "Quotations", href: "/quotations", icon: FileText },
  { label: "Accounts", href: "/accounts", icon: Users, roles: ["SUPER_ADMIN"] },
  { label: "Emails", href: "/emails", icon: Mail },
  { label: "Activity Logs", href: "/activity-logs", icon: ScrollText },
  { label: "Settings", href: "/settings", icon: Settings },
];

const VENDOR_NAV: NavItem[] = [
  { label: "Overview", href: "/vendor-portal", icon: LayoutDashboard },
  { label: "My Quotations", href: "/vendor-portal/quotations", icon: ClipboardList },
  { label: "Settings", href: "/vendor-portal/settings", icon: Settings },
];

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = (role === "VENDOR" ? VENDOR_NAV : ADMIN_NAV).filter((item) => !item.roles || item.roles.includes(role));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[rgb(var(--sidebar-bg))] text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400 font-display text-sm font-bold text-navy-900">
              V
            </div>
            <span className="font-display text-sm font-semibold tracking-wide">VENDOR MGMT</span>
          </div>
          <button onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/vendor-portal");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-white/10 text-gold-400" : "text-navy-200 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-navy-300">
          <p>VMS Enterprise · v1.0</p>
        </div>
      </aside>
    </>
  );
}
