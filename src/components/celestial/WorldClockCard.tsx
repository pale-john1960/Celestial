// Celestial — world-clock card for the Day view (task 14-b, round 14).
//
// Self-contained: no props; reads worldClockZones from the settings store.
// Each added zone shows its localized city name (WORLD_CITIES presets, with
// a slash-part fallback for unknown IANA zones), a live HH:MM ticking every
// 30s (locale digits), a next/previous-day chip when the zone's calendar day
// differs from the device's, and a remove button. Add-city appends from the
// presets (cap 8 zones).
"use client";

import { useSyncExternalStore } from "react";
import { Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDict } from "@/lib/i18n";
import { formatHm, WORLD_CITIES, zoneLabel } from "@/lib/sun";
import { useSettings } from "@/store/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_ZONES = 8;
const TICK_MS = 30_000;

/** the clock as an "external system": notifies React every 30s (and when
 *  the tab wakes up — setInterval is throttled while hidden). */
function subscribeToClock(callback: () => void): () => void {
  const id = window.setInterval(callback, TICK_MS);
  const onVisible = () => {
    if (document.visibilityState === "visible") callback();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/** 30-second bucket id — stable between notifications, so React never
 *  re-renders in a loop. */
const clockSnapshot = (): number => Math.floor(Date.now() / TICK_MS);
/** server snapshot: bucket 0 = "no reading yet" (real buckets are ~58M since
 *  the epoch, so 0 can never collide). The prerendered HTML shows the "–:–"
 *  placeholder and React swaps in live times right after mount — no
 *  hydration mismatch, no setState-in-effect. */
const serverClockSnapshot = (): number => 0;

/** Wall-clock reading of an instant in a zone: packed yyyymmdd plus minutes
 *  after local midnight (via Intl parts — no libraries, DST-correct). */
function zoneWall(ms: number, tz: string): { ymd: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ms);
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return {
    ymd: get("year") * 10000 + get("month") * 100 + get("day"),
    minutes: get("hour") * 60 + get("minute"),
  };
}

export function WorldClockCard() {
  const locale = useSettings((s) => s.locale);
  const zones = useSettings((s) => s.worldClockZones);
  const setWorldClockZones = useSettings((s) => s.setWorldClockZones);
  const dict = getDict(locale);

  // live clock via useSyncExternalStore (see above); null until mounted
  const tick = useSyncExternalStore(
    subscribeToClock,
    clockSnapshot,
    serverClockSnapshot,
  );
  const now = tick === 0 ? null : tick * TICK_MS;

  const addable = WORLD_CITIES.filter((c) => !zones.includes(c.tz));

  const addZone = (id: string): void => {
    const city = WORLD_CITIES.find((c) => c.id === id);
    if (!city || zones.includes(city.tz) || zones.length >= MAX_ZONES) return;
    setWorldClockZones([...zones, city.tz]);
  };

  const removeZone = (tz: string): void => {
    setWorldClockZones(zones.filter((z) => z !== tz));
  };

  // device-local calendar day (the reference for the ±1 day chips)
  const localYmd = (() => {
    if (now === null) return null;
    const dt = new Date(now);
    return dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate();
  })();

  return (
    <section
      aria-label={dict.worldClockTitle}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-white/10"
    >
      {/* title row — same icon-chip pattern as the sun-times card */}
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
        >
          <Globe className="size-5" />
        </span>
        <p className="min-w-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {dict.worldClockTitle}
        </p>
      </div>

      {zones.length === 0 ? (
        <p
          className="mt-3 text-xs leading-relaxed text-muted-foreground"
          dir="auto"
        >
          {dict.worldClockEmpty}
        </p>
      ) : (
        <div
          role="list"
          aria-label={dict.worldClockTitle}
          className="mt-2 max-h-80 divide-y divide-border/70 overflow-y-auto"
        >
          {zones.map((tz) => {
            const preset = WORLD_CITIES.find((c) => c.tz === tz);
            const label = preset ? dict[preset.dictKey] : zoneLabel(tz);
            const wall = now === null ? null : zoneWall(now, tz);
            const dayChip =
              wall !== null && localYmd !== null
                ? wall.ymd > localYmd
                  ? dict.worldClockTomorrow
                  : wall.ymd < localYmd
                    ? dict.worldClockYesterday
                    : null
                : null;
            return (
              <div
                key={tz}
                role="listitem"
                className="flex items-center gap-2.5 py-2"
              >
                <span className="min-w-0 truncate text-xs font-semibold" dir="auto">
                  {label}
                </span>
                {dayChip && (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {dayChip}
                  </Badge>
                )}
                <span className="ms-auto text-sm font-bold tabular-nums">
                  {wall === null ? "–:–" : formatHm(locale, wall.minutes)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${dict.remove} ${label}`}
                  onClick={() => removeZone(tz)}
                  className="size-7 shrink-0 rounded-lg text-muted-foreground transition-transform hover:text-foreground active:scale-95 print:hidden"
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* add-city — hidden in print and when the cap is reached */}
      {zones.length < MAX_ZONES && addable.length > 0 && (
        <div
          className={cn(
            "print:hidden",
            zones.length > 0 && "mt-3 border-t border-border pt-3 dark:border-white/10",
          )}
        >
          <Select value="" onValueChange={addZone}>
            <SelectTrigger
              size="sm"
              aria-label={dict.worldClockAdd}
              className="h-8 w-full min-w-0 rounded-lg"
            >
              <SelectValue placeholder={dict.worldClockAdd} />
            </SelectTrigger>
            <SelectContent>
              {addable.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {dict[c.dictKey]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </section>
  );
}
