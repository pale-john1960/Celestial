// Celestial — next day-off countdown pill (hero, next to the Today chip)
"use client";

import { CalendarClock } from "lucide-react";
import {
  isWeeklyDayOff,
  isoDate,
  parseIso,
  todayGregorian,
} from "@/lib/calendar";
import { fromJdn, jdnWeekday, toJdn } from "@/lib/calendar/jdn";
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
  const weekendDay = useSettings((s) => s.weekendDay);
  const sources = useSettings((s) => s.sources);
  const dict = getDict(locale);
  const gotoDay = useUi((s) => s.gotoDay);

  const today = todayGregorian();
  const from = isoDate(today);
  const to = isoDate(fromJdn(toJdn(today) + DAYS_AHEAD - 1));
  const { data, isLoading } = useEvents(from, to, sources);

  // candidate 1 — first legal day off (holidayOnly included — it IS a day
  // off) ≥ today (cheap filter; the API returns events sorted by iso)
  const holidayNext =
    (data?.events ?? []).find((e) => e.isHoliday && e.iso >= from) ?? null;

  // candidate 2 — the next WEEKLY day off (round 14: user-configurable;
  // auto → fa Friday, else none) within the coming 7 days, today included
  const todayJdn = toJdn(today);
  let weeklyOffJdn: number | null = null;
  for (let i = 0; i < 7; i++) {
    if (isWeeklyDayOff(weekendDay, locale, jdnWeekday(todayJdn + i))) {
      weeklyOffJdn = todayJdn + i;
      break;
    }
  }
  const holidayJdn = holidayNext
    ? toJdn(parseIso(holidayNext.iso) ?? today)
    : null;
  // the earlier candidate wins; a legal holiday wins ties (real name)
  const weeklyWins =
    weeklyOffJdn !== null &&
    (holidayJdn === null || weeklyOffJdn < holidayJdn);
  const next = weeklyWins
    ? { iso: isoDate(fromJdn(weeklyOffJdn as number)), name: dict.weekend }
    : holidayNext
      ? { iso: holidayNext.iso, name: holidayNext.names[locale] }
      : null;

  if (isLoading) {
    return <Skeleton className="h-6 w-40 rounded-full" aria-hidden />;
  }
  if (!next) return null;

  const diffDays = toJdn(parseIso(next.iso) ?? today) - toJdn(today);
  const name = next.name;
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
