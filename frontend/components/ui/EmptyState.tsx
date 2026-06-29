import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="mb-4 rounded-2xl bg-navy-800/5 dark:bg-gold-400/10 p-4">
        <Icon className="h-7 w-7 text-navy-800 dark:text-gold-400" />
      </div>
      <h3 className="font-display text-base font-semibold text-ink dark:text-white">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-[rgb(var(--fg-muted))]">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
