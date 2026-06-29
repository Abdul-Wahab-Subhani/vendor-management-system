import { cn } from "@/lib/utils";

type StampTone = "gold" | "navy" | "success";

const toneClasses: Record<StampTone, string> = {
  gold: "border-gold-400 text-gold-600 dark:text-gold-300",
  navy: "border-navy-700 text-navy-700 dark:border-navy-300 dark:text-navy-200",
  success: "border-success text-success",
};

/**
 * A circular, dashed-border "stamp" badge — evokes a procurement approval stamp.
 * This is the system's signature visual motif, used to call out the lowest
 * bid / best value / approved quotation in comparisons and reports.
 */
export function StampBadge({
  label,
  tone = "gold",
  className,
}: {
  label: string;
  tone?: StampTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-16 w-16 shrink-0 -rotate-[8deg] animate-stamp-in select-none items-center justify-center rounded-full",
        "border-2 border-dashed text-center font-display text-[9px] font-bold uppercase leading-[1.1] tracking-wide",
        toneClasses[tone],
        className
      )}
      style={{ padding: "4px" }}
    >
      {label}
    </div>
  );
}
