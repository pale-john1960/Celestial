// Celestial — selected-day summary strip shown under the month grid
"use client";

import { ArrowRight } from "lucide-react";
import type { DayCell } from "@/lib/calendar";
import { getDict, num, weekdayLong } from "@/lib/i18n";
import type { LocaleCode, LocaleDict } from "@/lib/i18n";
import type { EventInstance } from "@/lib/events";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categoryColor } from "./CategoryLegend";
import {
  formatGregorianDate,
  formatImperialDate,
  formatJalaliDate,
} from "./HeroHeader";

export function TodayStrip({
  cell,
  events,
  onOpenDay,
}: {
  cell: DayCell | null;
  events: EventInstance[];
  onOpenDay: () => void;
}) {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const dict = getDict(locale);
  const setEventDialog = useUi((s) => s.setEventDialog);

  if (!cell) return null;

  const activeDate =
    system === "gregorian"
      ? formatGregorianDate(locale, cell.gregorian, dict)
      : system === "jalali"
        ? formatJalaliDate(locale, cell.jalali, dict)
        : formatImperialDate(locale, cell.imperial, dict);
  const isDayOff = events.some((e) => e.isHoliday);
  const chips = events.filter((e) => !e.holidayOnly).slice(0, 5);

  return (
    <section
      aria-label={dict.selectDate}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {weekdayLong(locale, cell.weekday)} · {activeDate}
          </p>
          {isDayOff && (
            <p className="mt-0.5 text-xs font-medium text-red-600 dark:text-red-400">
              {dict.dayOffNotice}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg font-semibold"
          onClick={onOpenDay}
        >
          {dict.viewDay}
          <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </Button>
      </div>

      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEventDialog(e)}
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-accent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              )}
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: categoryColor(e.category) }}
              />
              <span aria-hidden>{e.emoji}</span>
              <span className="truncate">{e.names[locale]}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          {isDayOff ? dict.dayOff : dict.noEvents}
        </p>
      )}
    </section>
  );
}
