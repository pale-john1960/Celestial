// Celestial — next day-off countdown pill (hero, next to the Today chip)
"use client";

import { CalendarClock } from "lucide-react";
import { isoDate, parseIso, todayGregorian } from "@/lib/calendar";
import { fromJdn, toJdn } from "@/lib/calendar/jdn";
import { getDict, num } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { useEvents } from "@/lib/client/api";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS_AHEAD = 90;
/** names longer than this are truncated in the pill (title keeps the full text) */
const NAME_MAX = 24;

export function NextDayOffChip() {
  const locale = useSettings((s) => s.locale);
  const sources = useSettings((s) => s.sources);
  const dict = getDict(locale);
  const gotoDay = useUi((s) => s.gotoDay);

  const today = todayGregorian();
  const from = isoDate(today);
  const to = isoDate(fromJdn(toJdn(today) + DAYS_AHEAD - 1));
  const { data, isLoading } = useEvents(from, to, sources);

  // first legal day off (holidayOnly included — it IS a day off) ≥ today
  // (cheap filter; the API returns events sorted by iso)
  const next =
    (data?.events ?? []).find((e) => e.isHoliday && e.iso >= from) ?? null;

  if (isLoading) {
    return <Skeleton className="h-6 w-40 rounded-full" aria-hidden />;
  }
  if (!next) return null;

  const diffDays = toJdn(parseIso(next.iso) ?? today) - toJdn(today);
  const name = next.names[locale];
  const shortName =
    name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1).trimEnd()}…` : name;
  const fullLabel =
    diffDays === 0
      ? dict.nextDayOffToday.replace("{name}", name)
      : dict.nextDayOff
          .replace("{name}", name)
          .replace("{n}", num(locale, diffDays));
  const label =
    diffDays === 0
      ? dict.nextDayOffToday.replace("{name}", shortName)
      : dict.nextDayOff
          .replace("{name}", shortName)
          .replace("{n}", num(locale, diffDays));

  return (
    <button
      type="button"
      data-no-print
      onClick={() => gotoDay(next.iso)}
      title={fullLabel}
      aria-label={fullLabel}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/35 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
    >
      <CalendarClock className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}
