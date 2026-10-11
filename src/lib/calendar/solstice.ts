// Celestial — solstice & equinox instants (Meeus ch.25 solar longitude, truncated)
//
// ALGORITHM IS VALIDATED (coordinator, Task 8-a spec): 8/8 anchors within
// ±17 min of the authoritative instants (2000–2100 window; accuracy degrades
// slowly outside ±2 centuries of J2000 but seeds keep Newton converging).
//
// Accuracy: ~±17 min vs USNO/IMCCE for 1900–2100 — far beyond calendar needs.
//
// Constants (for the Android port — keep in sync):
//   sunLon(jd):  d = jd − 2451545.0
//     L = norm(280.46646 + 0.9856474·d)            // mean longitude (deg)
//     g = norm(357.529 + 0.98560028·d)             // mean anomaly (deg; radians in sin)
//     λ = norm(L + 1.914602·sin g + 0.019993·sin 2g + 0.000289·sin 3g)
//   solve(target, seedJd): Newton, 6 iterations, step = diff / 0.9856474 (deg/day)
//     diff = signedNorm(target − λ(t))  // signed shortest, ±180
//   seeds (12:00 UTC — a JD IS 12:00 UTC): λ=0 → Mar 20, λ=90 → Jun 21,
//     λ=180 → Sep 22, λ=270 → Dec 21 of the year
//   safety: if |diff| > 2.5° after solving, the event is dropped (null)
//   day bucketing matches moon.ts EXACTLY: marker on date D iff the event
//     instant ∈ [jdn(D) − 0.5 + off, jdn(D) + 0.5 + off) with
//     off = new Date(y, m−1, d).getTimezoneOffset() / 1440  (DAYS WEST, posix
//     sign — negative east; this is the convention that passed the Tokyo /
//     Tehran moon anchors).
//
// Pure module — no React, no Node APIs. Runs identically client & server.
import type { SimpleDate } from './types';
import { toJdn } from './jdn';

export type SeasonEvent = 'marEquinox' | 'junSolstice' | 'sepEquinox' | 'decSolstice';

/** solar-longitude target (deg) of each event — used by the season-event event rules */
export const SEASON_EVENT_TARGET: Record<SeasonEvent, number> = {
  marEquinox: 0,
  junSolstice: 90,
  sepEquinox: 180,
  decSolstice: 270,
};

export interface SolsticeInfo {
  event: SeasonEvent;
  /** Julian Day of the event instant (JD = days, 12:00 UTC-based) */
  jd: number;
  /** the same instant as a JS epoch-ms value (UTC absolute) */
  localMs: number;
}

const DEFS: { event: SeasonEvent; target: number; seedMonth: number; seedDay: number }[] = [
  { event: 'marEquinox', target: 0, seedMonth: 3, seedDay: 20 },
  { event: 'junSolstice', target: 90, seedMonth: 6, seedDay: 21 },
  { event: 'sepEquinox', target: 180, seedMonth: 9, seedDay: 22 },
  { event: 'decSolstice', target: 270, seedMonth: 12, seedDay: 21 },
];

/** JD → JS epoch ms (JD 2440587.5 = 1970-01-01T00:00:00Z) */
const jdToMs = (jd: number): number => (jd - 2440587.5) * 86400000;

/** normalize degrees to [0, 360) */
function norm360(x: number): number {
  return x - 360 * Math.floor(x / 360);
}

/** signed shortest distance in degrees, result ∈ (−180, 180] */
function signedNorm(x: number): number {
  const n = norm360(x);
  return n > 180 ? n - 360 : n;
}

/** Apparent solar longitude (deg) — Meeus ch.25 truncated to 3 terms */
export function sunLon(jd: number): number {
  const d = jd - 2451545.0;
  const L = norm360(280.46646 + 0.9856474 * d);
  const g = norm360(357.529 + 0.98560028 * d);
  const gRad = (g * Math.PI) / 180;
  return norm360(
    L +
      1.914602 * Math.sin(gRad) +
      0.019993 * Math.sin(2 * gRad) +
      0.000289 * Math.sin(3 * gRad),
  );
}

/** Newton solve λ(t) = target (deg); 6 iterations, seed within ±1.5 d of truth */
function solve(target: number, seedJd: number): number {
  let t = seedJd;
  for (let i = 0; i < 6; i++) {
    const diff = signedNorm(target - sunLon(t));
    t += diff / 0.9856474;
  }
  return t;
}

// year → events cache (pure; the instants are timezone-independent)
const yearCache = new Map<number, SolsticeInfo[]>();

/** All four season events of a Gregorian year (for tests/labels) */
export function seasonEventsOfYear(year: number): SolsticeInfo[] {
  const cached = yearCache.get(year);
  if (cached) return cached;
  const out: SolsticeInfo[] = [];
  for (const def of DEFS) {
    // a JD is exactly 12:00 UTC of its date — the seed IS noon UTC
    const seed = toJdn({ year, month: def.seedMonth, day: def.seedDay });
    const jd = solve(def.target, seed);
    // safety: Newton must have converged (seeds are within ±1.5 d for 1900-2100)
    if (Math.abs(signedNorm(def.target - sunLon(jd))) > 2.5) continue;
    out.push({ event: def.event, jd, localMs: jdToMs(jd) });
  }
  yearCache.set(year, out);
  return out;
}

/**
 * The season event falling on Gregorian date g (device-local day window),
 * or null. Same bucketing convention as moon.ts: event instant ∈
 * [D 00:00, D+1 00:00) LOCAL, using the days-west posix timezone offset.
 */
export function seasonEventOn(g: SimpleDate): SolsticeInfo | null {
  const jdn = toJdn(g);
  const off =
    new Date(g.year, g.month - 1, g.day).getTimezoneOffset() / 1440;
  const lo = jdn - 0.5 + off;
  const hi = jdn + 0.5 + off;
  // all four events sit well inside the year (Mar 19-21 … Dec 20-23),
  // so checking g's own year is sufficient
  for (const info of seasonEventsOfYear(g.year)) {
    if (info.jd >= lo && info.jd < hi) return info;
  }
  return null;
}

/** Tiny cell glyph for each event (Zodiac anchors of the seasons) */
export const SEASON_EVENT_EMOJI: Record<SeasonEvent, string> = {
  marEquinox: '♈', // Aries — sun crosses the equator northward
  junSolstice: '♋', // Cancer — northern limit
  sepEquinox: '♎', // Libra — sun crosses the equator southward
  decSolstice: '♑', // Capricorn — southern limit
};

/** Localized event name */
export function seasonEventName(
  dict: {
    seasonMarEquinox: string;
    seasonJunSolstice: string;
    seasonSepEquinox: string;
    seasonDecSolstice: string;
  },
  event: SeasonEvent,
): string {
  switch (event) {
    case 'marEquinox':
      return dict.seasonMarEquinox;
    case 'junSolstice':
      return dict.seasonJunSolstice;
    case 'sepEquinox':
      return dict.seasonSepEquinox;
    default:
      return dict.seasonDecSolstice;
  }
}

/** Localized note for the event (equal days / longest / shortest) */
export function seasonEventNote(
  dict: {
    seasonNoteEqual: string;
    seasonNoteLongest: string;
    seasonNoteShortest: string;
  },
  event: SeasonEvent,
): string {
  switch (event) {
    case 'marEquinox':
    case 'sepEquinox':
      return dict.seasonNoteEqual;
    case 'junSolstice':
      return dict.seasonNoteLongest;
    default:
      return dict.seasonNoteShortest;
  }
}
