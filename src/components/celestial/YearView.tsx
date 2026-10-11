// Celestial — year overview: stats card + 12 (13) mini month cards
"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MoonStar,
  Repeat,
  Sparkles,
} from "lucide-react";
import {
  monthGrid,
  systemToGregorian,
  todayGregorian,
  weekdayOrder,
  yearMonths,
} from "@/lib/calendar";
import type { DayCell, CalendarSystem } from "@/lib/calendar";
import { getDict, gregorianMonthName, jalaliMonthName, num } from "@/lib/i18n";
import type { LocaleCode, LocaleDict } from "@/lib/i18n";
import type { EventInstance } from "@/lib/events";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { useEvents } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { eventColor } from "./CategoryLegend";
import { seasonImageSrc } from "./HeroHeader";

export function YearView() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const weekStart = useSettings((s) => s.weekStart);
  const sources = useSettings((s) => s.sources);
  const dict = getDict(locale);

  const cursor = useUi((s) => s.cursor);
  const setCursorMonth = useUi((s) => s.setCursorMonth);
  const setView = useUi((s) => s.setView);
  const goToday = useUi((s) => s.goToday);

  const today = useMemo(() => todayGregorian(), []);
  const months = useMemo(
    () => yearMonths(system, cursor.year),
    [system, cursor.year],
  );
  const grids = useMemo(
    () =>
      months.map((m) =>
        monthGrid(system, cursor.year, m.index, weekStart, today),
      ),
    [months, system, cursor.year, weekStart, today],
  );

  const from = useMemo(
    () => grids.reduce((min, g) => (g[0].iso < min ? g[0].iso : min), "9999-99-99"),
    [grids],
  );
  const to = useMemo(
    () =>
      grids.reduce(
        (max, g) => (g[41].iso > max ? g[41].iso : max),
        "0000-00-00",
      ),
    [grids],
  );
  const { data } = useEvents(from, to, sources);

  const eventsByIso = useMemo(() => {
    const map = new Map<string, EventInstance[]>();
    for (const e of data?.events ?? []) {
      const list = map.get(e.iso);
      if (list) list.push(e);
      else map.set(e.iso, [e]);
    }
    return map;
  }, [data]);

  // year insights: computed from the same fetched dataset, scoped to the
  // ACTIVE system's year (in-month cells only — the fetch range also covers
  // trailing/leading days of the adjacent year's months)
  const stats = useMemo(() => {
    const monthOfIso = new Map<string, number>();
    grids.forEach((cells, i) => {
      const m = months[i].index;
      for (const cell of cells) {
        if (cell.inMonth) monthOfIso.set(cell.iso, m);
      }
    });
    let total = 0;
    let dayOffs = 0;
    const perMonth = new Map<number, number>();
    const recurringSeries = new Set<string>();
    for (const e of data?.events ?? []) {
      const m = monthOfIso.get(e.iso);
      if (m === undefined) continue;
      total++;
      if (e.isHoliday) dayOffs++;
      perMonth.set(m, (perMonth.get(m) ?? 0) + 1);
      if (e.recurring) recurringSeries.add(e.dbId ?? e.id);
    }
    let busiest: number | null = null;
    let busiestCount = 0;
    for (const m of months) {
      const count = perMonth.get(m.index) ?? 0;
      if (count > busiestCount) {
        busiest = m.index;
        busiestCount = count;
      }
    }
    return { total, dayOffs, recurring: recurringSeries.size, busiest };
  }, [data, grids, months]);

  return (
    <section aria-label={dict.yearOverview} className="flex flex-col gap-3">
      {/* print-only masthead — the hero h1 is [data-no-print], so paper needs
          its own title (hidden removes it from screen AND the a11y tree) */}
      <div className="hidden print:block border-b border-border pb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {dict.appName} · {dict.tagline}
        </p>
        <h2 className="mt-1 text-2xl font-bold">
          {num(locale, cursor.year)}{" "}
          <span className="text-base font-semibold text-muted-foreground">
            {system === "gregorian"
              ? dict.eraGregorian
              : system === "jalali"
                ? dict.eraJalali
                : dict.eraImperial}
          </span>
        </h2>
      </div>

      <nav
        data-no-print
        aria-label={dict.yearOverview}
        className="flex items-center gap-2"
      >
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border bg-card transition-transform active:scale-95"
            aria-label={dict.prevMonth}
            onClick={() => setCursorMonth(cursor.year - 1, cursor.month)}
          >
            <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border bg-card transition-transform active:scale-95"
            aria-label={dict.nextMonth}
            onClick={() => setCursorMonth(cursor.year + 1, cursor.month)}
          >
            <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Button>
        </div>
        <h2 className="text-lg font-bold tabular-nums">
          {num(locale, cursor.year)}
        </h2>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 rounded-lg font-semibold transition-transform active:scale-95"
          onClick={goToday}
        >
          <CalendarDays className="size-4" aria-hidden />
          {dict.goToday}
        </Button>
      </nav>

      <YearStats
        dict={dict}
        locale={locale}
        system={system}
        stats={stats}
        ready={data !== undefined}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map((m, i) => (
          <MonthCard
            key={m.index}
            monthIndex={m.index}
            firstG={m.firstG}
            cells={grids[i]}
            dict={dict}
            locale={locale}
            system={system}
            weekStart={weekStart}
            eventsByIso={eventsByIso}
            onOpen={() => {
              setCursorMonth(cursor.year, m.index);
              setView("month");
            }}
          />
        ))}
      </div>
    </section>
  );
}

/** Year insights card — totals, day-offs, busiest month, recurring series */
function YearStats({
  dict,
  locale,
  system,
  stats,
  ready,
}: {
  dict: LocaleDict;
  locale: LocaleCode;
  system: CalendarSystem;
  stats: { total: number; dayOffs: number; recurring: number; busiest: number | null };
  ready: boolean;
}) {
  const busiestName =
    stats.busiest === null
      ? "—"
      : system === "gregorian"
        ? gregorianMonthName(locale, stats.busiest)
        : jalaliMonthName(locale, stats.busiest);
  const totalText = dict.statsTotal.replace("{n}", num(locale, stats.total));
  const dayOffsText = dict.statsDayOffs.replace("{n}", num(locale, stats.dayOffs));
  const busiestText = dict.statsBusiest.replace("{month}", busiestName);
  const recurringText = dict.statsRecurring.replace("{n}", num(locale, stats.recurring));

  return (
    <section
      aria-label={
        ready
          ? `${dict.statsTitle} · ${totalText} · ${dayOffsText} · ${busiestText} · ${recurringText}`
          : dict.statsTitle
      }
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
        {dict.statsTitle}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {ready ? (
          <>
            <StatTile icon={<CalendarDays className="size-3.5" aria-hidden />}>
              <StatNum template={totalText} value={num(locale, stats.total)} />
            </StatTile>
            <StatTile icon={<MoonStar className="size-3.5" aria-hidden />}>
              <StatNum template={dayOffsText} value={num(locale, stats.dayOffs)} />
            </StatTile>
            <StatTile icon={<BarChart3 className="size-3.5" aria-hidden />}>
              {busiestText}
            </StatTile>
            <StatTile icon={<Repeat className="size-3.5" aria-hidden />}>
              <StatNum template={recurringText} value={num(locale, stats.recurring)} />
            </StatTile>
          </>
        ) : (
          <Skeleton aria-hidden className="col-span-2 h-9 rounded-xl sm:col-span-4" />
        )}
      </div>
    </section>
  );
}

function StatTile({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-muted/50 p-2.5">
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
      >
        {icon}
      </span>
      <p className="min-w-0 text-xs font-medium text-foreground">{children}</p>
    </div>
  );
}

/** split an already-substituted "{n}" template so the number renders bold
 *  (works for both number-first and label-first locales) */
function StatNum({ template, value }: { template: string; value: string }) {
  const parts = template.split(value);
  if (parts.length !== 2) return template;
  return (
    <>
      {parts[0]}
      <span className="font-bold tabular-nums">{value}</span>
      {parts[1]}
    </>
  );
}

function MonthCard({
  monthIndex,
  firstG,
  cells,
  dict,
  locale,
  system,
  weekStart,
  eventsByIso,
  onOpen,
}: {
  monthIndex: number;
  firstG: { year: number; month: number; day: number };
  cells: DayCell[];
  dict: LocaleDict;
  locale: LocaleCode;
  system: CalendarSystem;
  weekStart: 0 | 1 | 6;
  eventsByIso: Map<string, EventInstance[]>;
  onOpen: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const monthName =
    system === "gregorian"
      ? gregorianMonthName(locale, monthIndex)
      : jalaliMonthName(locale, monthIndex);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-2xl border border-border bg-card text-start shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-16 overflow-hidden">
        {imgFailed ? (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-primary/20" />
        ) : (
          <img
            src={seasonImageSrc(firstG.month)}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 size-full object-cover object-[50%_35%] transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"
        />
        <span className="absolute bottom-1.5 start-3 text-sm font-bold text-white drop-shadow-sm">
          {monthName}
        </span>
      </div>

      <div className="p-2.5">
        <div className="grid grid-cols-7 gap-0.5">
          {weekdayOrder(weekStart).map((w) => (
            <div
              key={w}
              className="text-center text-[9px] font-medium text-muted-foreground"
            >
              {weekdayShortInitial(locale, w)}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {cells.map((cell) => {
            const events = eventsByIso.get(cell.iso) ?? [];
            const isHoliday = events.some((e) => e.isHoliday);
            const dots = events
              .filter((e) => !e.holidayOnly)
              .slice(0, 3);
            if (!cell.inMonth) {
              return <span key={cell.iso} aria-hidden className="h-6" />;
            }
            return (
              <span
                key={cell.iso}
                className={cn(
                  "flex h-6 flex-col items-center justify-center rounded",
                  cell.isToday && "bg-primary font-bold text-primary-foreground",
                  // holiday tint — same red family as the month grid cells
                  isHoliday &&
                    !cell.isToday &&
                    "bg-red-50 dark:bg-red-950/30",
                )}
                title={cell.iso}
              >
                <span
                  className={cn(
                    "text-[10px] leading-none tabular-nums",
                    !cell.isToday && isHoliday && "font-bold text-red-600 dark:text-red-400",
                  )}
                >
                  {num(locale, miniDay(system, cell))}
                </span>
                {dots.length > 0 && (
                  <span className="mt-0.5 flex h-0.5 gap-px" aria-hidden>
                    {dots.map((e) => (
                      <span
                        key={e.id}
                        className="block size-[2px] rounded-full"
                        style={{ backgroundColor: eventColor(e) }}
                      />
                    ))}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </button>
  );
}

/** day number shown in the mini grid — ACTIVE system's day-of-month */
function miniDay(system: CalendarSystem, cell: DayCell): number {
  return system === "gregorian"
    ? cell.gregorian.day
    : system === "jalali"
      ? cell.jalali.day
      : cell.imperial.day;
}

function weekdayShortInitial(locale: LocaleCode, weekday: number): string {
  const map: Record<LocaleCode, string[]> = {
    en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    ja: ["日", "月", "火", "水", "木", "金", "土"],
    fa: ["ی", "د", "س", "چ", "پ", "ج", "ش"],
  };
  return map[locale][weekday] ?? "";
}
