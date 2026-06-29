import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-navy-900 shadow-card",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-5 pb-3 flex items-center justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-base font-semibold text-ink dark:text-white", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[rgb(var(--fg-muted))]", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

/** Stat card with a thin gold top accent — a recurring "ledger" motif across the dashboard. */
export function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gold-400" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--fg-muted))]">{label}</p>
          <p className="figure mt-2 text-2xl font-semibold text-ink dark:text-white">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-success" : "text-danger")}>
              {trend.positive ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-navy-800/5 dark:bg-gold-400/10 p-2.5 text-navy-800 dark:text-gold-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
