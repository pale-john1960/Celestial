// Celestial — sun-times card for the Day view (task 14-b, round 14).
//
// Self-contained: takes the displayed Gregorian day as a REQUIRED prop,
// reads the sun location from the settings store, and renders NOAA sun times
// (from @/lib/sun) in the established card style. Includes a city picker
// (WORLD_CITIES presets) and a "use my location" geolocation button.
"use client";

import { useMemo, useState } from "react";
import {
  LocateFixed,
  MoonStar,
  Sun,
  SunDim,
  SunMedium,
  Sunrise,
  Sunset,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getDict } from "@/lib/i18n";
import type { SimpleDate } from "@/lib/calendar";
import {
  formatHm,
  sunTimes,
  tzOffsetMinutes,
  WORLD_CITIES,
  zoneLabel,
} from "@/lib/sun";
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

/** canonical English city names — the persisted sunLocation label stays
 *  locale-independent so preset matching keeps working after a language
 *  switch (display is localized via dict[dictKey]). */
const EN = getDict("en");

export function SunTimesCard({ date }: { date: SimpleDate }) {
  const locale = useSettings((s) => s.locale);
  const sunLocation = useSettings((s) => s.sunLocation);
  const setSunLocation = useSettings((s) => s.setSunLocation);
  const dict = getDict(locale);
  const [locating, setLocating] = useState(false);

  // deterministic per (day, location) — no time-of-day input, so SSR and
  // client renders agree (no hydration mismatch)
  const times = useMemo(
    () =>
      sunTimes(
        date,
        sunLocation.lat,
        sunLocation.lng,
        tzOffsetMinutes(sunLocation.tz, date),
      ),
    [date, sunLocation.lat, sunLocation.lng, sunLocation.tz],
  );

  // does the stored location match a preset? → localized label
  const preset = useMemo(
    () =>
      WORLD_CITIES.find(
        (c) =>
          c.tz === sunLocation.tz &&
          Math.abs(c.lat - sunLocation.lat) < 0.05 &&
          Math.abs(c.lng - sunLocation.lng) < 0.05,
      ),
    [sunLocation.tz, sunLocation.lat, sunLocation.lng],
  );
  const locationLabel = preset ? dict[preset.dictKey] : sunLocation.label;

  const pickCity = (id: string): void => {
    const city = WORLD_CITIES.find((c) => c.id === id);
    if (city)
      setSunLocation({
        label: EN[city.dictKey],
        lat: city.lat,
        lng: city.lng,
        tz: city.tz,
      });
  };

  const useMyLocation = (): void => {
    if (locating) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(dict.sunLocError);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // resolved tz's city part as the label ("America/New_York" → "New
        // York") — locale-independent, matches the preset-label convention
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        setSunLocation({
          label: zoneLabel(tz),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          tz,
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error(dict.sunLocError);
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  return (
    <section
      aria-label={dict.sunTimesTitle}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-white/10"
    >
      {/* title row — icon chip + localized place (the established muted
          uppercase title + bold value pattern from the moon card) */}
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
        >
          <Sun className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {dict.sunTimesTitle}
          </p>
          <p className="mt-0.5 truncate text-sm font-bold" dir="auto">
            {locationLabel}
          </p>
        </div>
      </div>

      {/* the five events, chronological; sunrise/sunset highlighted, the
          others muted; per-event nulls skipped (dawn/dusk may be absent at
          high latitudes, e.g. London on the summer solstice) */}
      <div className="mt-3 flex flex-col gap-0.5">
        {times.dawn !== null && (
          <TimeRow
            icon={SunDim}
            label={dict.sunDawn}
            minutes={times.dawn}
            locale={locale}
          />
        )}
        {times.sunrise !== null && (
          <TimeRow
            icon={Sunrise}
            label={dict.sunSunrise}
            minutes={times.sunrise}
            locale={locale}
            primary
          />
        )}
        {(times.polarNight || times.midnightSun) && (
          <div className="flex items-center px-1.5 py-1">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/5 text-[10px] font-medium text-primary"
            >
              {times.polarNight ? dict.sunPolarNight : dict.sunMidnightSun}
            </Badge>
          </div>
        )}
        <TimeRow
          icon={SunMedium}
          label={dict.sunNoon}
          minutes={times.noon}
          locale={locale}
        />
        {times.sunset !== null && (
          <TimeRow
            icon={Sunset}
            label={dict.sunSunset}
            minutes={times.sunset}
            locale={locale}
            primary
          />
        )}
        {times.dusk !== null && (
          <TimeRow
            icon={MoonStar}
            label={dict.sunDusk}
            minutes={times.dusk}
            locale={locale}
          />
        )}
      </div>

      {/* location controls — screen-only: the location itself stays visible in
          print via the header's bold value */}
      <div className="mt-3 border-t border-border pt-3 print:hidden dark:border-white/10">
        <p
          id="sun-location-label"
          className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {dict.sunLocation}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Select value={preset?.id ?? ""} onValueChange={pickCity}>
            <SelectTrigger
              size="sm"
              aria-labelledby="sun-location-label"
              className="h-8 min-w-0 flex-1 rounded-lg"
            >
              <SelectValue placeholder={locationLabel} />
            </SelectTrigger>
            <SelectContent>
              {WORLD_CITIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {dict[c.dictKey]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 rounded-lg"
            disabled={locating}
            onClick={useMyLocation}
          >
            <LocateFixed className="size-3.5" aria-hidden />
            {locating ? dict.sunLocating : dict.sunUseMyLocation}
          </Button>
        </div>
      </div>
    </section>
  );
}

/** one event line: icon + label + localized bold time. `primary` marks the
 *  horizon events (sunrise/sunset) — text-foreground vs the muted
 *  dawn/noon/dusk rows. */
function TimeRow({
  icon: Icon,
  label,
  minutes,
  locale,
  primary = false,
}: {
  icon: LucideIcon;
  label: string;
  minutes: number;
  locale: "en" | "ja" | "fa";
  primary?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 px-1.5 py-1">
      <Icon
        aria-hidden
        className={cn(
          "size-4 shrink-0",
          primary ? "text-primary" : "text-muted-foreground/70",
        )}
      />
      <span
        className={cn(
          "text-xs",
          primary ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "ms-auto text-sm tabular-nums",
          primary ? "font-bold text-foreground" : "font-semibold text-muted-foreground",
        )}
      >
        {formatHm(locale, minutes)}
      </span>
    </div>
  );
}
