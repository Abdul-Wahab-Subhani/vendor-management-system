import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allowedRoles={["SUPER_ADMIN", "ADMIN"]}>{children}</DashboardShell>;
}
