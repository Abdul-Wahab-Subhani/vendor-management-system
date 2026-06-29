import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "gold";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-black/5 text-ink dark:bg-white/10 dark:text-white",
  success: "bg-success-light text-success dark:bg-success/15 dark:text-green-300",
  warning: "bg-warning-light text-warning dark:bg-warning/15 dark:text-amber-300",
  danger: "bg-danger-light text-danger dark:bg-danger/15 dark:text-red-300",
  info: "bg-navy-50 text-navy-700 dark:bg-navy-700/30 dark:text-navy-200",
  gold: "bg-gold-50 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300",
};

const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  PENDING: "warning",
  SUSPENDED: "danger",
  BLACKLISTED: "danger",
  DRAFT: "neutral",
  OPEN: "info",
  CLOSED: "neutral",
  CANCELLED: "danger",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  SUPER_ADMIN: "gold",
  ADMIN: "info",
  VENDOR: "neutral",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Renders a status string as a Badge, auto-mapping known statuses to a sensible color. */
export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE_MAP[status] ?? "neutral";
  return <Badge tone={tone}>{status.replace(/_/g, " ")}</Badge>;
}
