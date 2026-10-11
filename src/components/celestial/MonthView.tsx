// Celestial — month grid view (the core view)
"use client";

import { useMemo, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import {
  gregorianToJalali,
  isoWeekNumber,
  isWeeklyDayOff,
  monthGrid,
  shiftMonth,
  systemMonthCount,
  systemMonthLength,
  systemMonthName,
  systemToGregorian,
  systemTripleOf,
  todayGregorian,
  weekdayOrder,
} from "@/lib/calendar";
import { moonInfo, moonPhaseName, MOON_MAJOR_EMOJI } from "@/lib/calendar/moon";
import type { MoonMajor } from "@/lib/calendar/moon";
import { zodiacOf, zodiacName } from "@/lib/calendar/zodiac";
import {
  SEASON_EVENT_EMOJI,
  seasonEventName,
  seasonEventOn,
} from "@/lib/calendar/solstice";
import type { SeasonEvent } from "@/lib/calendar/solstice";
import type { CalendarSystem, DayCell } from "@/lib/calendar";
import {
  getDict,
  num,
  weekdayShort,
} from "@/lib/i18n";
import type { LocaleCode, LocaleDict } from "@/lib/i18n";
import type { EventInstance } from "@/lib/events";
import { useSettings } from "@/store/settings";
import type { WeekendDayCode } from "@/store/settings";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CategoryLegend, eventColor } from "./CategoryLegend";
import {
  activeDateText,
  systemEraLabel,
  weekdayDateText,
} from "./HeroHeader";
import { TodayStrip } from "./TodayStrip";

const MIN_YEAR = 1;
const MAX_YEAR = 3000;

/** event chips shown in the hover preview before the "+N more" line */
const PREVIEW_EVENTS = 6;

/** true when the primary pointer can hover (desktop) — hover previews/tooltips
 *  stay OFF on touch-only devices. Subscribed via useSyncExternalStore (SSR
 *  snapshot: false — no hover on the server), same pattern as useMounted. */
const HOVER_QUERY = "(hover: hover)";
const hoverSubscribe = (onChange: () => void) => {
  const mql = window.matchMedia(HOVER_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};
const getHoverSnapshot = () => window.matchMedia(HOVER_QUERY).matches;
function useHoverCapable(): boolean {
  return useSyncExternalStore(
    hoverSubscribe,
    getHoverSnapshot,
    () => false,
  );
}

export function MonthView() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const weekStart = useSettings((s) => s.weekStart);
  const showWeekNumbers = useSettings((s) => s.showWeekNumbers);
  const weekendDay = useSettings((s) => s.weekendDay);
  const royal = useSettings((s) => s.royalMonthNames);
  const sources = useSettings((s) => s.sources);
  const dict = getDict(locale);

  const cursor = useUi((s) => s.cursor);
  const selectedIso = useUi((s) => s.selectedIso);
  const setCursorMonth = useUi((s) => s.setCursorMonth);
  const selectDay = useUi((s) => s.selectDay);
  const gotoDay = useUi((s) => s.gotoDay);
  const goToday = useUi((s) => s.goToday);

  const today = useMemo(() => todayGregorian(), []);
  const hoverCapable = useHoverCapable();
  const cells = useMemo(
    () => monthGrid(system, cursor.year, cursor.month, weekStart, today),
    [system, cursor, weekStart, today],
  );
  // ISO week number per grid row (0-5) — ISO 8601 semantics regardless of the
  // weekStart setting: the row's number is the ISO week of the row's
  // THURSDAY (JS weekday 4), whose column position shifts with weekStart.
  // Null when the column is off so the OFF render path stays untouched.
  const weekNums = useMemo(() => {
    if (!showWeekNumbers) return null;
    const thuCol = (4 - weekStart + 7) % 7;
    return Array.from(
      { length: 6 },
      (_, w) => isoWeekNumber(cells[w * 7 + thuCol].gregorian),
    );
  }, [showWeekNumbers, weekStart, cells]);
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

  // moon major markers for the visible grid (tiny glyph in the end corner)
  const moonByIso = useMemo(() => {
    const map = new Map<string, MoonMajor | null>();
    for (const c of cells) {
      map.set(c.iso, moonInfo(c.gregorian).major ?? null);
    }
    return map;
  }, [cells]);

  // solstice/equinox markers for the visible grid (same corner, one cluster)
  const seasonByIso = useMemo(() => {
    const map = new Map<string, SeasonEvent | null>();
    for (const c of cells) {
      map.set(c.iso, seasonEventOn(c.gregorian)?.event ?? null);
    }
    return map;
  }, [cells]);

  const monthCount = systemMonthCount(system);
  const monthLabel = systemMonthName(system, locale, cursor.month, royal);
  const era = systemEraLabel(system, dict);

  // Persian zodiac chip: the Jalali month underlying the DISPLAYED month.
  // Middle-day sampling (min(15, length)) — matches the Android derivation:
  // identical for Gregorian/Jalali, agrees with the header month name for
  // Imperial (day 1 of imperial month 7 is still Jalali Shahrivar → Virgo
  // under a "Mehr" title; day 15 lands in Mehr), Andarjah → Esfand → Pisces.
  const zodiacSampleDay = Math.max(
    1,
    Math.min(15, systemMonthLength(system, cursor.year, cursor.month)),
  );
  const zodiac = zodiacOf(
    gregorianToJalali(
      systemToGregorian(system, cursor.year, cursor.month, zodiacSampleDay),
    ).month,
  );
  const zodiacSign = zodiac ? zodiacName(dict, zodiac.key) : "";
  const zodiacLabel = zodiac
    ? dict.zodiacChipDesc
        .replace("{month}", monthLabel)
        .replace("{sign}", zodiacSign)
    : "";

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

  // one row's 7 day cells — shared by both render paths (week numbers ON/OFF)
  // so the OFF branch renders byte-identical DOM to the pre-12-a structure
  const rowCells = (week: number) =>
    cells.slice(week * 7, week * 7 + 7).map((cell, col) => (
      <DayCellButton
        key={cell.iso}
        index={week * 7 + col}
        cell={cell}
        dict={dict}
        locale={locale}
        system={system}
        royal={royal}
        weekendDay={weekendDay}
        selected={cell.iso === selectedIso}
        events={eventsByIso.get(cell.iso)}
        moon={moonByIso.get(cell.iso) ?? null}
        season={seasonByIso.get(cell.iso) ?? null}
        hoverCapable={hoverCapable}
        onClick={onCellClick}
      />
    ));

  const weekdayHeaderCells = weekdayOrder(weekStart).map((w) => {
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
  });

  return (
    <section aria-label={dict.viewMonth} className="flex flex-col gap-3">
      {/* print-only masthead — the hero h1 is [data-no-print], so paper needs
          its own title (hidden removes it from screen AND the a11y tree) */}
      <div className="hidden print:block border-b border-border pb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {dict.appName} · {dict.tagline}
        </p>
        <h2 className="mt-1 text-2xl font-bold">
          {monthLabel} {num(locale, cursor.year)}{" "}
          <span className="text-base font-semibold text-muted-foreground">
            {era}
          </span>
        </h2>
      </div>

      {/* month navigation */}
      <nav
        data-no-print
        aria-label={dict.viewMonth}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border bg-card transition-transform active:scale-95"
            aria-label={dict.prevMonth}
            onClick={() => shift(-1)}
          >
            <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border bg-card transition-transform active:scale-95"
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
                {systemMonthName(system, locale, m, royal)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center rounded-lg border border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-none rounded-s-lg transition-transform active:scale-95"
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
            className="size-7 rounded-none rounded-e-lg transition-transform active:scale-95"
            aria-label={`${dict.nextMonth} ${num(locale, cursor.year + 1)}`}
            onClick={() => setCursorMonth(cursor.year + 1, cursor.month)}
          >
            <ChevronRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
          </Button>
        </div>

        {/* Persian zodiac month chip — reflects the displayed month in every
            calendar mode (web counterpart of the Android month-hero chip) */}
        {zodiac && (
          <span
            title={zodiacLabel}
            aria-label={zodiacLabel}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            <span
              aria-hidden
              className="text-[13px] leading-none text-primary"
            >
              {zodiac.glyph}
            </span>
            {zodiacSign}
          </span>
        )}

        <Button
          variant="secondary"
          size="sm"
          className="h-8 rounded-lg font-semibold transition-transform active:scale-95"
          onClick={goToday}
        >
          <CalendarDays className="size-4" aria-hidden />
          {dict.goToday}
        </Button>

        {/* print — pushed to the toolbar's end, away from the nav group */}
        <Button
          variant="outline"
          size="icon"
          className="ms-auto size-8 rounded-lg border-border bg-card transition-transform active:scale-95"
          aria-label={dict.printDesc}
          title={dict.printMonth}
          onClick={() => window.print()}
        >
          <Printer className="size-4" aria-hidden />
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

      {/* weekday header — with week numbers on, a matching prefix cell
          (dict.weekNumCol) leads the row; flex order follows document
          direction so RTL keeps it on the start (right) side. w-6 = min-w-6,
          fixed so the header prefix can never drift out of alignment with
          the week cells below */}
      {showWeekNumbers ? (
        <div className="flex items-stretch gap-1 sm:gap-1.5">
          <div className="flex w-6 shrink-0 items-center justify-center rounded py-1 text-[10px] font-medium text-muted-foreground/70">
            {dict.weekNumCol}
          </div>
          <div className="grid flex-1 grid-cols-7 gap-1 sm:gap-1.5">
            {weekdayHeaderCells}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {weekdayHeaderCells}
        </div>
      )}

      {/* day grid — keyed by month so the entrance stagger replays on
          navigation. Week numbers ON: each role=row becomes a flex row
          (rowheader cell + the 7-cell inner grid) — flex order follows
          document direction, so the column sits on the right under fa/RTL.
          OFF: the exact pre-12-a structure renders (no extra DOM, no shift) */}
      <div
        key={`${cursor.year}-${cursor.month}`}
        role="grid"
        aria-label={monthLabel}
        className="grid grid-cols-7 gap-1 sm:gap-1.5"
      >
        {Array.from({ length: 6 }, (_, week) =>
          showWeekNumbers && weekNums ? (
            <div
              key={week}
              role="row"
              className="col-span-7 flex items-stretch gap-1 sm:gap-1.5"
            >
              {/* non-interactive week number — no touch target needed;
                  stays visible in print (useful on paper) */}
              <div
                role="rowheader"
                aria-label={dict.weekNumLabel.replace(
                  "{n}",
                  num(locale, weekNums[week]),
                )}
                className="flex w-6 shrink-0 items-center justify-center rounded text-[10px] font-medium text-muted-foreground/70 tabular-nums"
              >
                {num(locale, weekNums[week])}
              </div>
              <div className="grid flex-1 grid-cols-7 gap-1 sm:gap-1.5">
                {rowCells(week)}
              </div>
            </div>
          ) : (
            <div
              key={week}
              role="row"
              className="col-span-7 grid grid-cols-7 gap-1 sm:gap-1.5"
            >
              {rowCells(week)}
            </div>
          ),
        )}
      </div>

      {/* selected day summary */}
      <TodayStrip
        cell={selectedCell}
        events={selectedCell ? (eventsByIso.get(selectedCell.iso) ?? []) : []}
        onOpenDay={() => selectedCell && gotoDay(selectedCell.iso)}
      />

      {/* legend (hidden on small screens — also in settings) */}
      <div data-no-print className="hidden sm:block">
        <CategoryLegend dict={dict} sources={sources} className="flex" />
      </div>
    </section>
  );
}

function DayCellButton({
  cell,
  index,
  dict,
  locale,
  system,
  royal,
  weekendDay,
  selected,
  events,
  moon,
  season,
  hoverCapable,
  onClick,
}: {
  cell: DayCell;
  index: number;
  dict: LocaleDict;
  locale: LocaleCode;
  system: CalendarSystem;
  /** royalMonthNames setting — ancient month names in the imperial family */
  royal: boolean;
  /** weekendDay setting — drives the weekly day-off styling */
  weekendDay: WeekendDayCode;
  selected: boolean;
  events: EventInstance[] | undefined;
  moon: "new" | "firstQ" | "full" | "lastQ" | null;
  season: SeasonEvent | null;
  hoverCapable: boolean;
  onClick: (iso: string) => void;
}) {
  const isHolidayDay = (events ?? []).some((e) => e.isHoliday);
  // Weekly day off (round 14: user-configurable — auto follows the locale,
  // fa → Friday, else none; the settings sheet can force Fri/Sat/Sun/none).
  // It gets the full holiday STYLING (red date number + red tint + 🌙 corner
  // glyph), same as event holidays. STYLING ONLY: no event is fabricated, so
  // the dots / preview / aria segments below stay purely event-driven.
  const weeklyDayOff = isWeeklyDayOff(weekendDay, locale, cell.weekday);
  const dayOff = isHolidayDay || weeklyDayOff;
  const dots = (events ?? []).filter((e) => !e.holidayOnly).slice(0, 4);
  const hasRecurring = (events ?? []).some(
    (e) => !e.holidayOnly && e.recurring,
  );

  // hover preview chips (all events incl. day-off-only) + "+N more" counter
  const previewEvents = (events ?? []).slice(0, PREVIEW_EVENTS);
  const moreCount = (events?.length ?? 0) - previewEvents.length;

  const sd = systemTripleOf(system, cell);
  const primary = sd.day;
  // secondary small number: gregorian mode → Jalali day; jalali/imperial → Gregorian day
  const secondary =
    system === "jalali" || system === "imperialSolar" || system === "imperial" || system === "ancient"
      ? cell.gregorian.day
      : cell.jalali.day;

  const cellDateText = activeDateText(system, locale, cell, dict, royal);

  // first few event names appended to the cell's aria-label (kept short)
  const ariaEventNames = (events ?? [])
    .filter((e) => !e.holidayOnly)
    .slice(0, 3)
    .map((e) => e.names[locale])
    .join(", ")
    .slice(0, 120);

  // moon phase name for the corner-glyph title + hover preview
  const moonPhaseText = moon
    ? moonPhaseName(
        dict,
        moon === "new" ? 0 : moon === "firstQ" ? 2 : moon === "full" ? 4 : 6,
      )
    : "";

  const cellButton = (
    <motion.button
      type="button"
      role="gridcell"
      aria-selected={selected}
      aria-label={`${dict.selectDate}: ${weekdayDateText(locale, cell.weekday, cellDateText)}${moon ? ` · ${moonPhaseText}` : ""}${season ? ` · ${seasonEventName(dict, season)}` : ""}${ariaEventNames ? ` · ${ariaEventNames}` : ""}`}
      title={hoverCapable ? undefined : cellDateText}
      onClick={() => onClick(cell.iso)}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.16, delay: Math.min(index * 0.006, 0.25) }}
      className={cn(
        "relative flex min-h-11 aspect-square flex-col items-center justify-start gap-0.5 rounded-lg border border-border/60 p-1 text-center transition-colors",
        "hover:bg-accent hover:z-10 hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        cell.inMonth ? "" : "opacity-40",
        // background precedence — explicit, because two bg-* utilities would
        // otherwise be resolved by stylesheet order, not class order:
        //   selected > holiday / Iran-Friday tint > plain tile
        !selected && !dayOff && "bg-card",
        dayOff && !selected && "bg-red-50 dark:bg-red-950/30",
        selected && "bg-primary/15 ring-2 ring-primary",
      )}
    >
      {dayOff && (
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
          dayOff && "text-red-600 dark:text-red-400",
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
      <span
        className={cn(
          "flex h-1.5 w-full items-center gap-0.5",
          // keep the end corner free for the astronomy glyph cluster
          moon || season ? "justify-start" : "justify-center",
        )}
      >
        {dots.map((e) => (
          <span
            key={e.id}
            aria-hidden
            className="size-1.5 rounded-full"
            style={{ backgroundColor: eventColor(e) }}
          />
        ))}
        {hasRecurring && (
          <span
            aria-hidden
            title={dict.recurringYearly}
            className="text-[10px] leading-none"
          >
            🔁
          </span>
        )}
      </span>
      {(moon || season) && (
        <span
          aria-hidden
          className="absolute bottom-1 end-1 flex items-center gap-0.5 text-[10px] leading-none opacity-60"
        >
          {moon && (
            <span title={`${dict.moonPhaseTitle}: ${moonPhaseText}`}>
              {MOON_MAJOR_EMOJI[moon]}
            </span>
          )}
          {season && (
            <span title={seasonEventName(dict, season)}>
              {SEASON_EVENT_EMOJI[season]}
            </span>
          )}
        </span>
      )}
    </motion.button>
  );

  // no hover previews on touch-only pointers — render the plain cell
  if (!hoverCapable) return cellButton;

  // desktop hover preview. The cell button stays the click/focus target
  // (TooltipTrigger asChild — no extra wrapper DOM, role=gridcell intact);
  // the bubble itself is pointer-events-none so it can never swallow a click.
  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>{cellButton}</TooltipTrigger>
      <TooltipContent
        sideOffset={6}
        className="rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-2.5 text-xs max-w-56 z-50 pointer-events-none [&>span:has(>svg)]:hidden"
      >
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold">
            {weekdayDateText(locale, cell.weekday, cellDateText)}
          </p>
          {previewEvents.length > 0 && (
            <ul className="flex flex-col gap-1">
              {previewEvents.map((e) => (
                <li key={e.id} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: eventColor(e) }}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {e.names[locale]}
                  </span>
                  {e.isHoliday && (
                    <span className="shrink-0 font-medium text-red-600 dark:text-red-400">
                      🌙 {dict.holidayBadge}
                    </span>
                  )}
                  {e.recurring && (
                    <span
                      aria-hidden
                      title={dict.recurringYearly}
                      className="shrink-0 opacity-70"
                    >
                      🔁
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {moreCount > 0 && (
            <p className="text-muted-foreground">
              {dict.moreEvents.replace("{n}", num(locale, moreCount))}
            </p>
          )}
          {(moon || season) && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-border pt-1.5 text-muted-foreground">
              {moon && (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden>{MOON_MAJOR_EMOJI[moon]}</span>
                  {moonPhaseText}
                </span>
              )}
              {season && (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden>{SEASON_EVENT_EMOJI[season]}</span>
                  {seasonEventName(dict, season)}
                </span>
              )}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
