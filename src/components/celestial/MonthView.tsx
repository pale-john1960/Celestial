// Celestial — month grid view (the core view)
"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  monthGrid,
  shiftMonth,
  todayGregorian,
  weekdayOrder,
} from "@/lib/calendar";
import type { CalendarSystem, DayCell } from "@/lib/calendar";
import {
  getDict,
  gregorianMonthName,
  jalaliMonthName,
  num,
  weekdayLong,
  weekdayShort,
} from "@/lib/i18n";
import type { LocaleCode, LocaleDict } from "@/lib/i18n";
import type { EventInstance } from "@/lib/events";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { useEvents } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { categoryColor } from "./CategoryLegend";
import { CategoryLegend } from "./CategoryLegend";
import {
  formatGregorianDate,
  formatImperialDate,
  formatJalaliDate,
} from "./HeroHeader";
import { TodayStrip } from "./TodayStrip";

const MIN_YEAR = 1;
const MAX_YEAR = 3000;

export function MonthView() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const weekStart = useSettings((s) => s.weekStart);
  const sources = useSettings((s) => s.sources);
  const dict = getDict(locale);

  const cursor = useUi((s) => s.cursor);
  const selectedIso = useUi((s) => s.selectedIso);
  const setCursorMonth = useUi((s) => s.setCursorMonth);
  const selectDay = useUi((s) => s.selectDay);
  const gotoDay = useUi((s) => s.gotoDay);
  const goToday = useUi((s) => s.goToday);

  const today = useMemo(() => todayGregorian(), []);
  const cells = useMemo(
    () => monthGrid(system, cursor.year, cursor.month, weekStart, today),
    [system, cursor, weekStart, today],
  );
  const from = cells[0].iso;
  const to = cells[cells.length - 1].iso;
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

  const monthCount = system === "imperial" ? 13 : 12;
  const monthLabel =
    system === "gregorian"
      ? gregorianMonthName(locale, cursor.month)
      : jalaliMonthName(locale, cursor.month);

  // ---- navigation ----
  const shift = (delta: number) => {
    const next = shiftMonth(system, cursor.year, cursor.month, delta);
    setCursorMonth(next.year, next.month);
  };

  // uncontrolled year input — remounts (via key) whenever the year changes
  const commitYear = (raw: string) => {
    const y = Number.parseInt(raw, 10);
    if (Number.isFinite(y) && y >= MIN_YEAR && y <= MAX_YEAR) {
      setCursorMonth(y, cursor.month);
    }
  };

  // ---- cell interaction: 1st click selects, 2nd click (same day) opens Day ----
  const onCellClick = (iso: string) => {
    if (selectedIso === iso) gotoDay(iso);
    else selectDay(iso);
  };

  const selectedCell = cells.find((c) => c.iso === selectedIso) ?? null;

  return (
    <section aria-label={dict.viewMonth} className="flex flex-col gap-3">
      {/* month navigation */}
      <nav
        aria-label={dict.viewMonth}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border bg-card"
            aria-label={dict.prevMonth}
            onClick={() => shift(-1)}
          >
            <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border bg-card"
            aria-label={dict.nextMonth}
            onClick={() => shift(1)}
          >
            <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Button>
        </div>

        <Select
          value={String(cursor.month)}
          onValueChange={(v) => setCursorMonth(cursor.year, Number(v))}
        >
          <SelectTrigger
            aria-label={dict.viewMonth}
            className="h-8 w-auto min-w-28 rounded-lg border-border bg-card text-sm font-semibold"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: monthCount }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>
                {system === "gregorian"
                  ? gregorianMonthName(locale, m)
                  : jalaliMonthName(locale, m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center rounded-lg border border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-none rounded-s-lg"
            aria-label={`${dict.prevMonth} ${num(locale, cursor.year - 1)}`}
            onClick={() => setCursorMonth(cursor.year - 1, cursor.month)}
          >
            <ChevronLeft className="size-3.5 rtl:-scale-x-100" aria-hidden />
          </Button>
          <input
            key={cursor.year}
            defaultValue={String(cursor.year)}
            inputMode="numeric"
            aria-label={dict.yearOverview}
            onBlur={(e) => commitYear(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-14 bg-transparent text-center text-sm font-semibold tabular-nums outline-none focus:underline"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-none rounded-e-lg"
            aria-label={`${dict.nextMonth} ${num(locale, cursor.year + 1)}`}
            onClick={() => setCursorMonth(cursor.year + 1, cursor.month)}
          >
            <ChevronRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
          </Button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="h-8 rounded-lg font-semibold"
          onClick={goToday}
        >
          <CalendarDays className="size-4" aria-hidden />
          {dict.goToday}
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

      {/* weekday header */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {weekdayOrder(weekStart).map((w) => {
          const isWeekend =
            locale === "fa" ? w === 4 || w === 5 : w === 0 || w === 6;
          return (
            <div
              key={w}
              className={cn(
                "py-1 text-center text-xs font-semibold",
                isWeekend
                  ? "text-red-600/90 dark:text-red-400/90"
                  : "text-muted-foreground",
              )}
            >
              {weekdayShort(locale, w)}
            </div>
          );
        })}
      </div>

      {/* day grid */}
      <div role="grid" aria-label={monthLabel} className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {Array.from({ length: 6 }, (_, week) => (
          <div key={week} role="row" className="col-span-7 grid grid-cols-7 gap-0.5 sm:gap-1">
            {cells.slice(week * 7, week * 7 + 7).map((cell) => (
              <DayCellButton
                key={cell.iso}
                cell={cell}
                dict={dict}
                locale={locale}
                system={system}
                selected={cell.iso === selectedIso}
                events={eventsByIso.get(cell.iso)}
                onClick={onCellClick}
              />
            ))}
          </div>
        ))}
      </div>

      {/* selected day summary */}
      <TodayStrip
        cell={selectedCell}
        events={selectedCell ? (eventsByIso.get(selectedCell.iso) ?? []) : []}
        onOpenDay={() => selectedCell && gotoDay(selectedCell.iso)}
      />

      {/* legend (hidden on small screens — also in settings) */}
      <CategoryLegend
        dict={dict}
        sources={sources}
        className="hidden sm:flex"
      />
    </section>
  );
}

function DayCellButton({
  cell,
  dict,
  locale,
  system,
  selected,
  events,
  onClick,
}: {
  cell: DayCell;
  dict: LocaleDict;
  locale: LocaleCode;
  system: CalendarSystem;
  selected: boolean;
  events: EventInstance[] | undefined;
  onClick: (iso: string) => void;
}) {
  const isHolidayDay = (events ?? []).some((e) => e.isHoliday);
  const dots = (events ?? []).filter((e) => !e.holidayOnly).slice(0, 4);

  const primary =
    system === "gregorian"
      ? cell.gregorian.day
      : system === "jalali"
        ? cell.jalali.day
        : cell.imperial.day;
  // secondary small number: gregorian mode → Jalali day; jalali/imperial → Gregorian day
  const secondary =
    system === "jalali" ? cell.gregorian.day : cell.jalali.day;

  const activeDateText =
    system === "gregorian"
      ? formatGregorianDate(locale, cell.gregorian, dict)
      : system === "jalali"
        ? formatJalaliDate(locale, cell.jalali, dict)
        : formatImperialDate(locale, cell.imperial, dict);

  return (
    <button
      type="button"
      role="gridcell"
      aria-selected={selected}
      aria-label={`${dict.selectDate}: ${weekdayLong(locale, cell.weekday)}, ${activeDateText}`}
      title={activeDateText}
      onClick={() => onClick(cell.iso)}
      className={cn(
        "relative flex min-h-11 aspect-square flex-col items-center justify-start gap-0.5 rounded-lg p-1 text-center transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        cell.inMonth ? "" : "opacity-40",
        isHolidayDay && "bg-red-50 dark:bg-red-950/30",
        selected && "bg-primary/10 ring-1 ring-primary/40",
      )}
    >
      {isHolidayDay && (
        <span
          aria-hidden
          className="absolute end-0.5 top-0 text-[10px] leading-none"
        >
          🌙
        </span>
      )}
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
          isHolidayDay && "text-red-600 dark:text-red-400",
        )}
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full",
            cell.isToday && "ring-2 ring-primary",
          )}
        >
          {num(locale, primary)}
        </span>
      </span>
      <span className="text-[10px] leading-none text-muted-foreground/80 tabular-nums">
        {num(locale, secondary)}
      </span>
      <span className="flex h-1.5 w-full items-center justify-center gap-0.5">
        {dots.map((e) => (
          <span
            key={e.id}
            aria-hidden
            className="size-1.5 rounded-full"
            style={{ backgroundColor: categoryColor(e.category) }}
          />
        ))}
      </span>
    </button>
  );
}
