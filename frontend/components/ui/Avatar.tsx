import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({ name, src, size = "md", className }: { name: string; src?: string | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" }[size];

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn("rounded-full object-cover", sizeClasses, className)} />;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-navy-800 font-semibold text-white dark:bg-gold-400 dark:text-navy-900",
        sizeClasses,
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
