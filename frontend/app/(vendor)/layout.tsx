import { DashboardShell } from "@/components/layout/DashboardShell";

export default function VendorPortalLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allowedRoles={["VENDOR"]}>{children}</DashboardShell>;
}
