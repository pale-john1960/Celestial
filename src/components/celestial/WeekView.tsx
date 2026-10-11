// Celestial — week view: 7 day cards for the week containing the selected day
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  buildDayCell,
  imperialDayName,
  isoDate,
  parseIso,
  todayGregorian,
} from "@/lib/calendar";
import { fromJdn, jdnWeekday, toJdn } from "@/lib/calendar/jdn";
import { moonInfo, MOON_MAJOR_EMOJI } from "@/lib/calendar/moon";
import {
  getDict,
  gregorianMonthName,
  jalaliMonthName,
  num,
  weekdayLong,
} from "@/lib/i18n";
import type { EventInstance } from "@/lib/events";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { useEvents } from "@/lib/client/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { categoryColor } from "./CategoryLegend";
import {
  formatGregorianDate,
  formatHijriDate,
  formatImperialDate,
  formatJalaliDate,
} from "./HeroHeader";
import type { DayCell } from "@/lib/calendar";

export function WeekView() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const weekStart = useSettings((s) => s.weekStart);
  const sources = useSettings((s) => s.sources);
  const dict = getDict(locale);

  const selectedIso = useUi((s) => s.selectedIso);
  const selectDaySync = useUi((s) => s.selectDaySync);
  const gotoDay = useUi((s) => s.gotoDay);
  const goToday = useUi((s) => s.goToday);

  const today = todayGregorian();
  const sel = parseIso(selectedIso) ?? today;

  // week = 7 days starting at weekStart, containing the selected day
  const firstJdn = useMemo(() => {
    const offset = (jdnWeekday(toJdn(sel)) - weekStart + 7) % 7;
    return toJdn(sel) - offset;
  }, [sel, weekStart]);

  const cells = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        buildDayCell(fromJdn(firstJdn + i), today, true),
      ),
    [firstJdn, today],
  );

  const from = cells[0].iso;
  const to = cells[6].iso;
  const { data, isLoading, isError, refetch } = useEvents(from, to, sources);

  const eventsByIso = useMemo(() => {
    const map = new Map<string, EventInstance[]>();
    for (const e of data?.events ?? []) {
      const list = map.get(e.iso);
      if (list) list.push(e);
      else map.set(e.iso, [e]);
    }
    return map;
  }, [data]);

  const moons = useMemo(
    () =>
      new Map(cells.map((c) => [c.iso, moonInfo(c.gregorian)] as const)),
    [cells],
  );

  // week range label in the ACTIVE system, e.g. "Mehr 25 – Aban 1, 1405"
  const weekLabel = useMemo(() => {
    const a = systemOfCell(system, cells[0]);
    const b = systemOfCell(system, cells[6]);
    const monthName = (m: number) =>
      system === "gregorian"
        ? gregorianMonthName(locale, m)
        : jalaliMonthName(locale, m);
    if (a.year === b.year && a.month === b.month) {
      return `${monthName(a.month)} ${num(locale, a.day)} – ${num(locale, b.day)}, ${num(locale, a.year)}`;
    }
    if (a.year === b.year) {
      return `${monthName(a.month)} ${num(locale, a.day)} – ${monthName(b.month)} ${num(locale, b.day)}, ${num(locale, a.year)}`;
    }
    return `${monthName(a.month)} ${num(locale, a.day)}, ${num(locale, a.year)} – ${monthName(b.month)} ${num(locale, b.day)}, ${num(locale, b.year)}`;
  }, [cells, system, locale]);

  const prevWeek = () => selectDaySync(isoDate(fromJdn(firstJdn - 7)));
  const nextWeek = () => selectDaySync(isoDate(fromJdn(firstJdn + 7)));

  return (
    <section aria-label={dict.viewWeek} className="flex flex-col gap-3">
      {/* week navigation */}
      <nav
        data-no-print
        aria-label={dict.viewWeek}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border bg-card transition-transform active:scale-95"
            aria-label={dict.prevWeek}
            onClick={prevWeek}
          >
            <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border bg-card transition-transform active:scale-95"
            aria-label={dict.nextWeek}
            onClick={nextWeek}
          >
            <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Button>
        </div>
        <p className="min-w-0 flex-1 text-sm font-bold tabular-nums" dir="auto">
          {weekLabel}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 rounded-lg font-semibold transition-transform active:scale-95"
          onClick={goToday}
        >
          <CalendarDays className="size-4" aria-hidden />
          {dict.thisWeek}
        </Button>
      </nav>

      {/* status line */}
      {isLoading && <Skeleton className="h-1.5 w-full rounded-full" />}
      {isError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">{dict.error}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {dict.retry}
          </Button>
        </div>
      )}

      {/* day cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {cells.map((cell) => (
          <WeekDayCard
            key={cell.iso}
            cell={cell}
            dict={dict}
            locale={locale}
            system={system}
            selected={cell.iso === selectedIso}
            events={eventsByIso.get(cell.iso)}
            moon={moons.get(cell.iso)?.major ?? null}
            onSelect={() => {
              if (selectedIso === cell.iso) gotoDay(cell.iso);
              else selectDaySync(cell.iso);
            }}
            onOpenDay={() => gotoDay(cell.iso)}
          />
        ))}
      </div>
    </section>
  );
}

function systemOfCell(
  system: "gregorian" | "jalali" | "imperial",
  cell: DayCell,
): { year: number; month: number; day: number } {
  if (system === "gregorian") return cell.gregorian;
  if (system === "jalali") return cell.jalali;
  return cell.imperial;
}

function WeekDayCard({
  cell,
  dict,
  locale,
  system,
  selected,
  events,
  moon,
  onSelect,
  onOpenDay,
}: {
  cell: DayCell;
  dict: ReturnType<typeof getDict>;
  locale: "en" | "ja" | "fa";
  system: "gregorian" | "jalali" | "imperial";
  selected: boolean;
  events: EventInstance[] | undefined;
  moon: "new" | "firstQ" | "full" | "lastQ" | null;
  onSelect: () => void;
  onOpenDay: () => void;
}) {
  const setEventDialog = useUi((s) => s.setEventDialog);
  const isHolidayDay = (events ?? []).some((e) => e.isHoliday);
  const visible = (events ?? []).filter((e) => !e.holidayOnly);

  const sd = systemOfCell(system, cell);
  const primaryDay = sd.day;
  const isMonthFirst = sd.day === 1;
  const monthName =
    system === "gregorian"
      ? gregorianMonthName(locale, sd.month)
      : jalaliMonthName(locale, sd.month);

  // secondary line: the other main system(s)
  const secondary =
    system === "gregorian"
      ? formatJalaliDate(locale, cell.jalali, dict)
      : formatGregorianDate(locale, cell.gregorian, dict);

  const activeDateText =
    system === "gregorian"
      ? formatGregorianDate(locale, cell.gregorian, dict)
      : system === "jalali"
        ? formatJalaliDate(locale, cell.jalali, dict)
        : formatImperialDate(locale, cell.imperial, dict);

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex flex-col rounded-2xl border bg-card shadow-sm",
        cell.isToday && "ring-2 ring-primary",
        selected ? "border-primary/60" : "border-border",
      )}
    >
      {/* card header: big clickable day (1st click selects, 2nd opens) */}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${dict.selectDate}: ${weekdayLong(locale, cell.weekday)}, ${activeDateText}`}
        aria-current={cell.isToday ? "date" : undefined}
        className={cn(
          "flex w-full flex-col gap-0.5 rounded-t-2xl border-b border-border p-3 text-start transition-colors hover:bg-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        )}
      >
        <span className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {weekdayLong(locale, cell.weekday)}
          </span>
          {moon && (
            <span
              aria-hidden
              title={dict.moonPhaseTitle}
              className="text-[11px] leading-none opacity-60"
            >
              {MOON_MAJOR_EMOJI[moon]}
            </span>
          )}
        </span>
        <span
          className={cn(
            "flex items-baseline gap-1.5",
            isHolidayDay && "text-red-600 dark:text-red-400",
          )}
        >
          <span className="text-2xl font-bold tabular-nums">
            {num(locale, primaryDay)}
          </span>
          {isMonthFirst && (
            <span className="text-xs font-semibold text-muted-foreground">
              {monthName}
            </span>
          )}
          {isHolidayDay && (
            <span aria-hidden className="text-sm leading-none">
              🌙
            </span>
          )}
        </span>
        <span
          className="truncate text-[11px] text-muted-foreground"
          dir="auto"
          title={secondary}
        >
          {secondary}
        </span>
        <span
          className="truncate text-[10px] text-muted-foreground/75"
          dir="auto"
        >
          {formatHijriDate(locale, cell.hijri, dict)}
          {system === "imperial" && (
            <span className="text-muted-foreground/60">
              {" · "}
              {imperialDayName(locale, cell.imperial)}
            </span>
          )}
        </span>
      </button>

      {/* event list */}
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        {visible.length === 0 ? (
          <p className="m-auto rounded-lg border border-dashed border-border px-2 py-2.5 text-center text-[11px] text-muted-foreground">
            {dict.noEvents}
          </p>
        ) : (
          visible.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEventDialog(e)}
              className={cn(
                "flex w-full items-start gap-2 rounded-xl border border-border bg-background p-2 text-start transition-colors hover:bg-accent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              )}
            >
              <span aria-hidden className="text-lg leading-none">
                {e.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: categoryColor(e.category) }}
                  />
                  <span className="truncate text-xs font-semibold" title={e.names[locale]}>
                    {e.names[locale]}
                  </span>
                </span>
                {e.descriptions[locale] && (
                  <span
                    className="mt-0.5 block truncate text-[11px] text-muted-foreground"
                    title={e.descriptions[locale]}
                  >
                    {e.descriptions[locale]}
                  </span>
                )}
              </span>
              {e.isHoliday && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-red-300 bg-red-50 px-1.5 py-0 text-[9px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                >
                  {dict.dayOff}
                </Badge>
              )}
            </button>
          ))
        )}
        {/* hidden-category legal holidays: day-off chip only */}
        {(events ?? [])
          .filter((e) => e.holidayOnly)
          .map((e) => (
            <Badge
              key={e.id}
              variant="outline"
              className="w-full justify-center border-red-300 bg-red-50 py-1 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              🌙 {dict.dayOff}
            </Badge>
          ))}
        {selected && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg text-xs font-semibold text-primary transition-transform active:scale-95"
            onClick={onOpenDay}
          >
            {dict.viewDay}
            <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
          </Button>
        )}
      </div>
    </motion.article>
  );
}
