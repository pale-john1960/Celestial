// Celestial — search dialog: finds events in the current month range
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Search, SearchX, Settings2 } from "lucide-react";
import { monthGrid, todayGregorian } from "@/lib/calendar";
import { getDict } from "@/lib/i18n";
import type { EventInstance } from "@/lib/events";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { useEvents } from "@/lib/client/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { eventColor } from "./CategoryLegend";
import { EmptyState } from "./EmptyState";
import {
  formatGregorianDate,
  formatImperialDate,
  formatJalaliDate,
} from "./HeroHeader";

const MAX_RESULTS = 50;

export function SearchDialog() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const weekStart = useSettings((s) => s.weekStart);
  const sources = useSettings((s) => s.sources);
  const dict = getDict(locale);

  const open = useUi((s) => s.searchOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const cursor = useUi((s) => s.cursor);
  const gotoDay = useUi((s) => s.gotoDay);
  const goToday = useUi((s) => s.goToday);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // search the current month grid range (cache-shared with MonthView)
  const today = useMemo(() => todayGregorian(), []);
  const cells = useMemo(
    () => monthGrid(system, cursor.year, cursor.month, weekStart, today),
    [system, cursor, weekStart, today],
  );
  const from = cells[0].iso;
  const to = cells[cells.length - 1].iso;
  const { data, isLoading } = useEvents(from, to, sources, open);

  const results = useMemo(() => {
    const list = (data?.events ?? []).filter((e) => !e.holidayOnly);
    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 20);
    return list
      .filter((e) => {
        const name = e.names[locale].toLowerCase();
        const desc = (e.descriptions[locale] ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
      .slice(0, MAX_RESULTS);
  }, [data, query, locale]);

  const resultDate = (e: EventInstance) => {
    if (system === "gregorian") return formatGregorianDate(locale, e.gregorian, dict);
    if (system === "jalali") return formatJalaliDate(locale, cells.find((c) => c.iso === e.iso)?.jalali ?? e.gregorian, dict);
    return formatImperialDate(locale, cells.find((c) => c.iso === e.iso)?.imperial ?? { year: e.gregorian.year, month: e.gregorian.month, day: e.gregorian.day }, dict);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setSearchOpen(v);
        if (!v) setQuery("");
      }}
    >
      <DialogContent closeLabel={dict.close} className="max-h-[85vh] max-w-lg overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-border px-5 pb-3 pt-5 text-start">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Search className="size-4 text-primary" aria-hidden />
            {dict.search}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {dict.search}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pt-3">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.search}
            aria-label={dict.search}
            className="h-10 rounded-xl"
          />
        </div>

        {/* quick actions */}
        <div className="flex flex-wrap gap-1.5 px-5 pt-3">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => {
              goToday();
              setSearchOpen(false);
            }}
          >
            <CalendarDays className="size-3.5" aria-hidden />
            {dict.goToday}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => {
              setSearchOpen(false);
              setSettingsOpen(true);
            }}
          >
            <Settings2 className="size-3.5" aria-hidden />
            {dict.settings}
          </Button>
        </div>

        {/* results */}
        <div className="mt-3 max-h-[55vh] overflow-y-auto px-3 pb-4">
          {isLoading && (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              {dict.loading}
            </p>
          )}
          {!isLoading && results.length === 0 && (
            <EmptyState
              icon={SearchX}
              title={dict.noEvents}
              hint={dict.emptySearchHint}
              className="mx-2 my-4 border-border/70 p-6"
            />
          )}
          <ul className="space-y-0.5">
            {results.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    gotoDay(e.iso);
                    setSearchOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start transition-colors hover:bg-accent",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: eventColor(e) }}
                  />
                  <span aria-hidden className="text-base leading-none">
                    {e.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {e.names[locale]}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground tabular-nums">
                      {resultDate(e)}
                    </span>
                  </span>
                  {e.isHoliday && (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-red-300 bg-red-50 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                      {dict.holidayBadge}
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
