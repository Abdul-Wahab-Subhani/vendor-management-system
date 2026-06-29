"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  defaultTab,
  onChange,
}: {
  tabs: { value: string; label: string; icon?: React.ReactNode }[];
  defaultTab?: string;
  onChange?: (value: string) => void;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.value);

  const select = (value: string) => {
    setActive(value);
    onChange?.(value);
  };

  return (
    <div className="flex gap-1 border-b border-border dark:border-border-dark overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => select(tab.value)}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            active === tab.value
              ? "border-gold-400 text-ink dark:text-white"
              : "border-transparent text-[rgb(var(--fg-muted))] hover:text-ink dark:hover:text-white"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
