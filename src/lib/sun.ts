// Celestial — sun times for a location (task 14-b, round 14).
//
// Pure-TypeScript NOAA solar calculator — the classic "general solar position
// calculations" spreadsheet formulas (fractional year → equation of time +
// declination → hour angles), zero external dependencies. Times are returned
// as minutes after LOCAL midnight in the location's timezone.
//
// Also exports the tz offset helper (Intl, no libraries) and the shared
// WORLD_CITIES preset list used by SunTimesCard + WorldClockCard.

import { isGregorianLeap, toJdn } from "./calendar/jdn";
import type { SimpleDate } from "./calendar/types";
import { num } from "./i18n";
import type { LocaleCode, LocaleDict } from "./i18n/types";

const RAD = Math.PI / 180;

/** Sun events for one day, in minutes after local midnight (null = the event
 *  does not occur that day at that latitude). `noon` is always defined. */
export interface SunTimes {
  /** astronomical dawn (sun 18° below the horizon, zenith 108°) */
  dawn: number | null;
  /** sunrise (zenith 90.833° = 90°50′: refraction + solar radius) */
  sunrise: number | null;
  /** solar noon (upper culmination), always defined */
  noon: number;
  sunset: number | null;
  /** astronomical dusk (zenith 108°) */
  dusk: number | null;
  /** sun never dips below the horizon (no sunrise/sunset that day) */
  midnightSun: boolean;
  /** sun never climbs above the horizon (no sunrise/sunset that day) */
  polarNight: boolean;
}

/**
 * NOAA solar position algorithm for the given Gregorian day.
 *
 * - `lat`/`lng` in degrees (positive north/east).
 * - `tzOff` = the location's UTC offset in minutes for that date
 *   (see {@link tzOffsetMinutes}); all returned times are local wall-clock.
 *
 * Per-event nulls: the 90.833° events (sunrise/sunset) and the 108° events
 * (astronomical dawn/dusk) are computed independently, so a day can have a
 * sunrise but no astronomical dawn (e.g. London on the summer solstice) — or,
 * deep in a polar night, dawn/dusk can still occur while the sun never rises.
 * `midnightSun`/`polarNight` describe the horizon events only.
 */
export function sunTimes(
  date: SimpleDate,
  lat: number,
  lng: number,
  tzOff: number,
): SunTimes {
  // day of year 1..366 via the existing JDN math
  const doy = toJdn(date) - toJdn({ year: date.year, month: 1, day: 1 }) + 1;
  const yearLen = isGregorianLeap(date.year) ? 366 : 365;

  // fractional year γ at 12:00 — the NOAA spreadsheet's angle
  const g = (2 * Math.PI / yearLen) * (doy - 1);

  // equation of time, minutes (NOAA coefficients)
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g));

  // solar declination, radians (NOAA 6-term series)
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);

  const sinLat = Math.sin(lat * RAD);
  const cosLat = Math.cos(lat * RAD);
  const sinDecl = Math.sin(decl);
  const cosDecl = Math.cos(decl);

  // solar noon in local clock minutes (formula: 720 − 4·lng − eqTime + tz)
  const noon = 720 - 4 * lng - eqTime + tzOff;

  // cos(hour angle) for a given zenith; |c| > 1 → the sun never crosses
  // that altitude that day. Denominator 0 only at the exact poles, where
  // JS gives ±Infinity and the classification below still works.
  const cosH = (zenithDeg: number): number =>
    (Math.cos(zenithDeg * RAD) - sinLat * sinDecl) / (cosLat * cosDecl);

  const cRise = cosH(90.833); // 90°50′ — refraction + solar radius
  const cAstro = cosH(108); // astronomical twilight

  const hRise = cRise >= -1 && cRise <= 1 ? Math.acos(cRise) / RAD : null;
  const hAstro = cAstro >= -1 && cAstro <= 1 ? Math.acos(cAstro) / RAD : null;

  // horizon classification (only when the 90.833° crossing is absent):
  //  c > 1  → sun never climbs to −0.833° → never rises → polar night
  //  c < −1 → sun never dips to −0.833° → never sets → midnight sun
  const polarNight = hRise === null && cRise > 1;
  const midnightSun = hRise === null && cRise < -1;

  return {
    dawn: hAstro === null ? null : noon - 4 * hAstro,
    sunrise: hRise === null ? null : noon - 4 * hRise,
    noon,
    sunset: hRise === null ? null : noon + 4 * hRise,
    dusk: hAstro === null ? null : noon + 4 * hAstro,
    midnightSun,
    polarNight,
  };
}

/**
 * UTC offset (minutes, east positive) of an IANA timezone on a given
 * Gregorian date — DST included, no libraries.
 *
 * Fixed-point iteration: find the offset `o` such that the instant
 * UTC(y,m,d 12:00) − o, formatted in `tz`, reads exactly 12:00 on the same
 * wall-clock date. Converges in ≤3 passes (offsets are piecewise constant and
 * jump around 02:00–03:00 local, far from the noon anchor).
 *
 * Throws RangeError for unknown timezone names (callers pass validated zones).
 */
export function tzOffsetMinutes(tz: string, date: SimpleDate): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const noonUtc = Date.UTC(date.year, date.month - 1, date.day, 12);
  let offset = 0;
  for (let pass = 0; pass < 6; pass++) {
    const instant = noonUtc - offset * 60000;
    const parts = fmt.formatToParts(instant);
    const get = (type: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((p) => p.type === type)?.value ?? "0");
    const wall = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    const next = Math.round((wall - instant) / 60000);
    if (next === offset) return offset;
    offset = next;
  }
  return offset;
}

/** "06:12" (locale digits for fa); wraps out-of-range minutes into [0,1440)
 *  and rounds to the nearest minute. */
export function formatHm(locale: LocaleCode, minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return num(locale, `${pad(h)}:${pad(m)}`);
}

/** One preset city (shared by the sun-times city picker and the world clock). */
export interface WorldCity {
  id: string;
  tz: string;
  lat: number;
  lng: number;
  dictKey: keyof LocaleDict;
}

/** The ten world cities offered in the sun-location picker and the world
 *  clock add-menu (task 14-b spec). `dictKey` resolves the localized name
 *  via getDict(locale)[dictKey]; the stored sun-location label uses the
 *  canonical English name getDict("en")[dictKey]. */
export const WORLD_CITIES: WorldCity[] = [
  { id: "tehran", tz: "Asia/Tehran", lat: 35.6892, lng: 51.389, dictKey: "cityTehran" },
  { id: "tokyo", tz: "Asia/Tokyo", lat: 35.6762, lng: 139.6503, dictKey: "cityTokyo" },
  { id: "seoul", tz: "Asia/Seoul", lat: 37.5665, lng: 126.978, dictKey: "citySeoul" },
  { id: "beijing", tz: "Asia/Shanghai", lat: 39.9042, lng: 116.4074, dictKey: "cityBeijing" },
  { id: "new-york", tz: "America/New_York", lat: 40.7128, lng: -74.006, dictKey: "cityNewYork" },
  { id: "london", tz: "Europe/London", lat: 51.5074, lng: -0.1278, dictKey: "cityLondon" },
  { id: "paris", tz: "Europe/Paris", lat: 48.8566, lng: 2.3522, dictKey: "cityParis" },
  { id: "dubai", tz: "Asia/Dubai", lat: 25.2048, lng: 55.2708, dictKey: "cityDubai" },
  { id: "sydney", tz: "Australia/Sydney", lat: -33.8688, lng: 151.2093, dictKey: "citySydney" },
  { id: "los-angeles", tz: "America/Los_Angeles", lat: 34.0522, lng: -118.2437, dictKey: "cityLosAngeles" },
];

/** Human label for an arbitrary IANA zone: the part after the last slash,
 *  underscores turned into spaces ("America/New_York" → "New York"). */
export function zoneLabel(tz: string): string {
  const last = tz.split("/").pop() ?? tz;
  return last.replace(/_/g, " ");
}
