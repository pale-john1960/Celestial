// Celestial — agenda view: next 90 days grouped by date
"use client";

import { useMemo } from "react";
import { AlertTriangle, CalendarClock, CalendarOff, Download, RotateCw } from "lucide-react";
import { toast } from "sonner";
import {
  buildDayCell,
  isoDate,
  systemDateOf,
  todayGregorian,
} from "@/lib/calendar";
import { fromJdn, toJdn } from "@/lib/calendar/jdn";
import { getDict, gregorianMonthName, jalaliMonthName, num, weekdayShort } from "@/lib/i18n";
import type { EventInstance } from "@/lib/events";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { useEvents } from "@/lib/client/api";
import { buildIcs } from "@/lib/client/ics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { eventColor } from "./CategoryLegend";
import { EmptyState } from "./EmptyState";
import {
  formatGregorianDate,
  formatImperialDate,
  formatJalaliDate,
} from "./HeroHeader";

const DAYS_AHEAD = 90;

export function AgendaView() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const sources = useSettings((s) => s.sources);
  const dict = getDict(locale);
  const setEventDialog = useUi((s) => s.setEventDialog);

  const today = todayGregorian();
  const todayJdn = toJdn(today);
  const from = isoDate(today);
  const to = isoDate(fromJdn(todayJdn + DAYS_AHEAD - 1));

  const { data, isLoading, isError, isFetching, refetch } = useEvents(
    from,
    to,
    sources,
  );

  const groups = useMemo(() => {
    const map = new Map<string, EventInstance[]>();
    for (const e of data?.events ?? []) {
      if (e.holidayOnly) continue; // hidden category — day-off only
      const list = map.get(e.iso);
      if (list) list.push(e);
      else map.set(e.iso, [e]);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([iso, events]) => ({ iso, events }));
  }, [data]);

  // group the date groups by ACTIVE-system month for sticky month headers
  const monthGroups = useMemo(() => {
    const out: {
      key: string;
      label: string;
      groups: { iso: string; events: EventInstance[] }[];
    }[] = [];
    let prev: { year: number; month: number } | null = null;
    for (const grp of groups) {
      const g = {
        year: Number(grp.iso.slice(0, 4)),
        month: Number(grp.iso.slice(5, 7)),
        day: Number(grp.iso.slice(8, 10)),
      };
      const sd = systemDateOf(system, g);
      if (!prev || sd.year !== prev.year || sd.month !== prev.month) {
        const monthName =
          system === "gregorian"
            ? gregorianMonthName(locale, sd.month)
            : jalaliMonthName(locale, sd.month);
        out.push({
          key: `${sd.year}-${sd.month}`,
          label: `${monthName} ${num(locale, sd.year)}`,
          groups: [],
        });
        prev = sd;
      }
      out[out.length - 1].groups.push(grp);
    }
    return out;
  }, [groups, system, locale]);

  const dayOffIsos = useMemo(() => {
    const set = new Set<string>();
    for (const e of data?.events ?? []) {
      if (e.isHoliday) set.add(e.iso);
    }
    return set;
  }, [data]);

  const rtf = useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
    [locale],
  );

  // print masthead range: first → last visible ACTIVE-system month labels
  // (single label when the whole 90-day window falls inside one month)
  const agendaRange =
    monthGroups.length > 0
      ? monthGroups[0].label === monthGroups[monthGroups.length - 1].label
        ? monthGroups[0].label
        : `${monthGroups[0].label} – ${monthGroups[monthGroups.length - 1].label}`
      : "";

  const onExportIcs = () => {
    // currently loaded events of the active query, incl. source filters
    const list = groups.flatMap((grp) => grp.events);
    if (list.length === 0) return;
    const ics = buildIcs(list, locale, dict);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `celestial-agenda-${from}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(dict.exportIcsDone.replace("{n}", num(locale, list.length)));
  };

  return (
    <section aria-label={dict.viewAgenda} className="flex flex-col gap-3">
      {/* print-only masthead — the hero h1 is [data-no-print], so paper needs
          its own title (hidden removes it from screen AND the a11y tree) */}
      <div className="hidden print:block border-b border-border pb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {dict.appName} · {dict.tagline}
        </p>
        <h2 className="mt-1 text-2xl font-bold">
          {dict.viewAgenda}
          {agendaRange && (
            <span className="text-base font-semibold text-muted-foreground">
              {" · "}
              {agendaRange}
            </span>
          )}
        </h2>
      </div>

      {/* toolbar (hidden in print — the agenda rows themselves stay printable) */}
      <div
        data-no-print
        className="flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="size-4" aria-hidden />
          <span>
            {dict.upcoming} · {num(locale, DAYS_AHEAD)} {dict.days}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border bg-card transition-transform active:scale-95"
            aria-label={dict.refresh}
            onClick={() => void refetch()}
          >
            <RotateCw
              className={cn("size-4", isFetching && "animate-spin")}
              aria-hidden
            />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 rounded-lg font-semibold transition-transform active:scale-95"
            onClick={onExportIcs}
            disabled={groups.length === 0}
            title={groups.length === 0 ? dict.noEvents : dict.exportIcs}
          >
            <Download className="size-4" aria-hidden />
            {dict.exportIcs}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div
          aria-hidden
          className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 sm:p-3 dark:border-white/10"
        >
          {/* skeleton month header */}
          <Skeleton className="h-5 w-32 rounded-md" />
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border border-border bg-background p-3 rounded-e-xl rounded-s-sm"
            >
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}
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
      {!isLoading && !isError && groups.length === 0 && (
        <EmptyState
          icon={CalendarOff}
          title={dict.noEvents}
          hint={dict.emptyAgendaHint}
        />
      )}

      {groups.length > 0 && (
        <div
          data-agenda-scroll
          className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card p-2 sm:p-3 dark:border-white/10"
        >
          {monthGroups.map((mg) => (
            <div key={mg.key} className="mb-3 last:mb-0">
              {/* sticky month header — sticks while its month is on screen */}
              <div
                data-no-print
                className="sticky top-0 z-20 -mx-1 border-b border-border bg-background/95 px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground backdrop-blur-sm"
              >
                {mg.label}
              </div>
              {mg.groups.map(({ iso, events }) => {
                const g = {
                  year: Number(iso.slice(0, 4)),
                  month: Number(iso.slice(5, 7)),
                  day: Number(iso.slice(8, 10)),
                };
                const cell = buildDayCell(g, today, iso === from);
                const diffDays = cell.jdn - todayJdn;
                const relative = rtf.format(diffDays, "day");

                const activeDateText =
                  system === "gregorian"
                    ? formatGregorianDate(locale, cell.gregorian, dict)
                    : system === "jalali"
                      ? formatJalaliDate(locale, cell.jalali, dict)
                      : formatImperialDate(locale, cell.imperial, dict);
                const secondaryText =
                  system === "gregorian"
                    ? formatJalaliDate(locale, cell.jalali, dict)
                    : formatGregorianDate(locale, cell.gregorian, dict);
                const isDayOff = dayOffIsos.has(iso);

                return (
                  <div key={iso} className="mt-2">
                    <div
                      className={cn(
                        "sticky top-[29px] z-10 -mx-1 px-1 py-1.5 backdrop-blur-sm",
                        // today's group header gets the accent tint (same 95%
                        // opacity as the default) so it stands out in the list
                        cell.isToday ? "bg-accent/95" : "bg-card/95",
                      )}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-bold tabular-nums">
                          {weekdayShort(locale, cell.weekday)} · {activeDateText}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground" dir="auto">
                          {secondaryText}
                        </span>
                        <span className="text-xs font-medium text-primary">
                          {relative}
                        </span>
                        {isDayOff && (
                          <Badge
                            variant="outline"
                            className="border-red-300 bg-red-50 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                          >
                            {dict.dayOff}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-col gap-1.5">
                      {events.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setEventDialog(e)}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-3 border border-border bg-background p-3 text-start rounded-e-xl rounded-s-sm transition-[background-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:bg-accent/60 hover:shadow-sm active:scale-[0.99] motion-reduce:hover:translate-y-0 dark:border-white/10 dark:shadow-sm",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                          )}
                          style={{
                            borderInlineStartWidth: "3px",
                            borderInlineStartColor: eventColor(e),
                          }}
                        >
                          <span className="text-xl leading-none" aria-hidden>
                            {e.emoji}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {e.names[locale]}
                          </span>
                          {e.recurring && (
                            <Badge
                              variant="outline"
                              title={dict.recurringYearly}
                              className="shrink-0 border-primary/40 bg-primary/5 text-[10px] text-primary"
                            >
                              🔁 {dict.recurringYearly}
                            </Badge>
                          )}
                          {e.isHoliday && (
                            <Badge
                              variant="outline"
                              className="shrink-0 border-red-300 bg-red-50 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                            >
                              {dict.holidayBadge}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
