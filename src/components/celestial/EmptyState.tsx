// Celestial — shared rich empty state ("no events" blocks in views/dialogs)
"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Centered stack with a layered icon treatment: a large muted ghost of the
 *  icon behind a smaller overlapping accent chip, then title + one-line hint.
 *  Entrance is a single gentle fade/slide (framer → honors MotionConfig
 *  reducedMotion="user"; opacity still animates when motion is reduced). */
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center dark:border-white/10",
        className,
      )}
    >
      <span aria-hidden className="relative grid size-16 shrink-0 place-items-center">
        {/* large muted ghost */}
        <Icon
          className="absolute size-14 text-muted-foreground/15"
          strokeWidth={1.5}
        />
        {/* smaller overlapping accent chip */}
        <span className="relative grid size-9 place-items-center rounded-full border border-border/70 bg-background text-primary shadow-sm">
          <Icon className="size-4" />
        </span>
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>
    </motion.div>
  );
}
