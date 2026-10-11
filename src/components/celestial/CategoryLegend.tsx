// Celestial — category colors + legend chips (shared by views & dialogs)
"use client";

import { useState } from "react";
import type { EventCategory } from "@/lib/calendar";
import type { LocaleDict, LocaleCode } from "@/lib/i18n";
import type { SourceFlags } from "@/store/settings";
import { cn } from "@/lib/utils";

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  international: "#8E7CC3",
  us: "#C2185B",
  japan: "#D95970",
  "persian-cultural": "#2BA84A",
  "persian-religious": "#B8860B",
  "persian-national": "#C2185B",
  imported: "#5B8C85",
};

/** Fixed per-event color palette (8 swatches, no indigo/blue) — shared spec
 *  with Android. Stored/displayed as lowercase hex (DB canonical form). */
export const EVENT_COLOR_PALETTE: readonly string[] = [
  "#c2185b", // magenta
  "#d95970", // rose
  "#e07b39", // orange
  "#b8860b", // gold
  "#2ba84a", // green
  "#5b8c85", // teal (category default)
  "#8e7cc3", // violet
  "#64748b", // slate
];

export function categoryColor(cat: EventCategory): string {
  return CATEGORY_COLORS[cat] ?? "#C2185B";
}

/** Effective dot color of an event instance: per-event color wins over the category default */
export function eventColor(e: { color?: string; category: EventCategory }): string {
  return e.color ?? categoryColor(e.category);
}

export function categoryLabel(dict: LocaleDict, cat: EventCategory): string {
  switch (cat) {
    case "international":
      return dict.srcInternational;
    case "us":
      return dict.srcUs;
    case "japan":
      return dict.srcJapan;
    case "persian-cultural":
      return dict.srcPersianCultural;
    case "persian-religious":
      return dict.srcPersianReligious;
    case "persian-national":
      return dict.srcPersianNational;
    case "imported":
      return dict.imported;
  }
}

export function sourceBadgeText(dict: LocaleDict, locale: LocaleCode): string {
  if (locale === "fa") return "داخلی";
  if (locale === "ja") return "内蔵";
  return "Built-in";
}

/** Categories currently enabled via the source toggles */
export function activeCategories(sources: SourceFlags): EventCategory[] {
  const list: EventCategory[] = [];
  if (sources.international) list.push("international");
  if (sources.us) list.push("us");
  if (sources.japan) list.push("japan");
  if (sources.persianCultural) list.push("persian-cultural");
  if (sources.persianReligious) list.push("persian-religious");
  if (sources.persianNational) list.push("persian-national");
  if (sources.imported) list.push("imported");
  return list;
}

const COLLAPSED_COUNT = 4;

/** Row of dot+label chips; collapses after 4 on small footprints */
export function CategoryLegend({
  dict,
  sources,
  className,
}: {
  dict: LocaleDict;
  sources: SourceFlags;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const cats = activeCategories(sources);
  if (cats.length === 0) return null;

  const visible = open ? cats : cats.slice(0, COLLAPSED_COUNT);
  const hidden = cats.length - visible.length;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      role="list"
      aria-label={dict.eventSources}
    >
      {visible.map((cat) => (
        <span
          key={cat}
          role="listitem"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
        >
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ backgroundColor: categoryColor(cat) }}
          />
          {categoryLabel(dict, cat)}
        </span>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? "−" : "+"}
          {open ? "" : String(hidden)}
        </button>
      )}
    </div>
  );
}
