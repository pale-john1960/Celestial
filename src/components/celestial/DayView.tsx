// Celestial — single-day view: full tri-calendar date + event cards
"use client";

import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudMoon,
  MoonStar,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  buildDayCell,
  imperialDayName,
  isoDate,
  parseIso,
  todayGregorian,
} from "@/lib/calendar";
import { fromJdn, toJdn } from "@/lib/calendar/jdn";
import { moonInfo, moonPhaseName, MOON_EMOJI } from "@/lib/calendar/moon";
import {
  SEASON_EVENT_EMOJI,
  seasonEventName,
  seasonEventNote,
  seasonEventOn,
} from "@/lib/calendar/solstice";
import { getDict, num, weekdayLong } from "@/lib/i18n";
import type { EventInstance } from "@/lib/events";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { useEvents } from "@/lib/client/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  categoryLabel,
  eventColor,
  sourceBadgeText,
} from "./CategoryLegend";
import { EmptyState } from "./EmptyState";
import {
  formatGregorianDate,
  formatHijriDate,
  formatImperialDate,
  formatJalaliDate,
} from "./HeroHeader";

export function DayView() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const sources = useSettings((s) => s.sources);
  const dict = getDict(locale);

  const selectedIso = useUi((s) => s.selectedIso);
  const gotoDay = useUi((s) => s.gotoDay);
  const goToday = useUi((s) => s.goToday);
  const setEventDialog = useUi((s) => s.setEventDialog);

  const today = todayGregorian();
  const g = parseIso(selectedIso) ?? today;
  const cell = buildDayCell(g, today, true);
  const { data, isLoading, isError, refetch } = useEvents(
    cell.iso,
    cell.iso,
    sources,
  );

  const all = data?.events ?? [];
  const events = all.filter((e) => !e.holidayOnly);
  const isDayOff = all.some((e) => e.isHoliday);

  const prevIso = isoDate(fromJdn(toJdn(g) - 1));
  const nextIso = isoDate(fromJdn(toJdn(g) + 1));

  const moon = moonInfo(g);
  const illumPct = Math.round(moon.illum * 100);
  const ageText = moon.ageDays.toFixed(1);

  // solstice / equinox on this day (device-local window)
  const season = seasonEventOn(g);
  const seasonTimeText = season
    ? num(
        locale,
        `${String(new Date(season.localMs).getHours()).padStart(2, "0")}:${String(
          new Date(season.localMs).getMinutes(),
        ).padStart(2, "0")}`,
      )
    : "";

  const activeDateText =
    system === "gregorian"
      ? formatGregorianDate(locale, cell.gregorian, dict)
      : system === "jalali"
        ? formatJalaliDate(locale, cell.jalali, dict)
        : formatImperialDate(locale, cell.imperial, dict);

  return (
    <section aria-label={dict.viewDay} className="flex flex-col gap-3">
      {/* date hero */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            data-no-print
            className="size-8 rounded-lg border-border transition-transform active:scale-95"
            aria-label={dict.prevMonth}
            onClick={() => gotoDay(prevIso)}
          >
            <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          </Button>
          <div className="min-w-0 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {weekdayLong(locale, cell.weekday)}
            </p>
            <h2 className="mt-0.5 truncate text-xl font-bold tabular-nums sm:text-2xl">
              {activeDateText}
            </h2>
          </div>
          <Button
            variant="outline"
            size="icon"
            data-no-print
            className="size-8 rounded-lg border-border transition-transform active:scale-95"
            aria-label={dict.nextMonth}
            onClick={() => gotoDay(nextIso)}
          >
            <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Button>
        </div>

        {/* the other calendars */}
        <div
          className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
          dir="auto"
        >
          {system !== "gregorian" && (
            <span>{formatGregorianDate(locale, cell.gregorian, dict)}</span>
          )}
          {system !== "jalali" && system !== "imperial" && (
            <span>{formatJalaliDate(locale, cell.jalali, dict)}</span>
          )}
          {system === "imperial" && (
            <span>{formatJalaliDate(locale, cell.jalali, dict)}</span>
          )}
          {system === "imperial" && (
            <span>
              {dict.dayNameLabel}:{" "}
              {imperialDayName(locale, cell.imperial)}
            </span>
          )}
          <span>{formatHijriDate(locale, cell.hijri, dict)}</span>
        </div>

        {!cell.isToday && (
          <div className="mt-3 text-center">
            <Button
              data-no-print
              variant="ghost"
              size="sm"
              className="text-primary transition-transform active:scale-95"
              onClick={goToday}
            >
              <CalendarDays className="size-4" aria-hidden />
              {dict.goToday}
            </Button>
          </div>
        )}
      </div>

      {/* moon phase card (every day) */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-white/10">
        <div className="flex items-center gap-3.5">
          <span aria-hidden className="text-3xl leading-none">
            {MOON_EMOJI[moon.phaseIndex]}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {dict.moonPhaseTitle}
            </p>
            <p className="text-sm font-bold">{moonPhaseName(dict, moon.phaseIndex)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {dict.moonIllumination}: {num(locale, illumPct)}% · {dict.moonAge}:{" "}
              {num(locale, ageText)} {dict.days}
            </p>
          </div>
        </div>
      </div>

      {/* solstice / equinox card (only on event days) */}
      {season && (
        <div
          role="status"
          className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-white/10"
        >
          <div className="flex items-center gap-3.5">
            <span aria-hidden className="text-3xl leading-none">
              {SEASON_EVENT_EMOJI[season.event]}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold">
                {seasonEventName(dict, season.event)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {dict.seasonOccursAt.replace("{t}", seasonTimeText)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {seasonEventNote(dict, season.event)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* day-off banner */}
      {isDayOff && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <MoonStar className="size-5 shrink-0" aria-hidden />
          {dict.dayOffNotice}
        </div>
      )}

      {/* loading / error / events */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
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
      {!isLoading && !isError && events.length === 0 && (
        <EmptyState
          icon={CloudMoon}
          title={dict.noEvents}
          hint={dict.emptyDayHint}
        />
      )}
      {events.length > 0 && (
        <div className="flex flex-col gap-3">
          {events.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              dict={dict}
              locale={locale}
              onOpen={() => setEventDialog(e)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EventCard({
  event,
  dict,
  locale,
  onOpen,
}: {
  event: EventInstance;
  dict: ReturnType<typeof getDict>;
  locale: "en" | "ja" | "fa";
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="w-full cursor-pointer rounded-2xl border border-border bg-card p-4 text-start shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background dark:border-white/10"
      style={{
        borderInlineStartWidth: "3px",
        borderInlineStartColor: eventColor(event),
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {event.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{event.names[locale]}</span>
            {event.isHoliday && (
              <Badge
                variant="outline"
                className="border-red-300 bg-red-50 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                {dict.holidayBadge}
              </Badge>
            )}
            {event.recurring && (
              <Badge
                variant="outline"
                title={dict.recurringYearly}
                className="border-primary/40 bg-primary/5 text-[10px] text-primary"
              >
                🔁 {dict.recurringYearly}
              </Badge>
            )}
          </div>
          {event.descriptions[locale] && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {event.descriptions[locale]}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
              style={{
                borderColor: `${eventColor(event)}55`,
                color: eventColor(event),
              }}
            >
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ backgroundColor: eventColor(event) }}
              />
              {categoryLabel(dict, event.category)}
            </span>
            <SourceBadge event={event} dict={dict} locale={locale} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export function SourceBadge({
  event,
  dict,
  locale,
}: {
  event: EventInstance;
  dict: ReturnType<typeof getDict>;
  locale: "en" | "ja" | "fa";
}) {
  if (event.source === "online") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <span aria-hidden>🌐</span>
        {dict.onlineSources}
        {event.provider ? ` · ${event.provider}` : ""}
      </span>
    );
  }
  if (event.source === "manual") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <span aria-hidden>✍️</span>
        {dict.sourceManual}
      </span>
    );
  }
  if (event.source === "imported") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <span aria-hidden>📥</span>
        {dict.imported}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <span aria-hidden>⭐</span>
      {sourceBadgeText(dict, locale)}
    </span>
  );
}
