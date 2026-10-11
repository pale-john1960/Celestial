// Celestial — shared rich empty state ("no events" blocks in views/dialogs)
"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Centered stack: muted icon in a soft circle, title + one-line hint */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  className,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border bg-card p-8 text-center dark:border-white/10",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-10 place-items-center rounded-full bg-muted/50 text-muted-foreground"
      >
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
