// Celestial — daily horoscope engine (round 13).
//
// DETERMINISTIC BY DESIGN: horoscopeFor(iso, signKey) hashes
// `${iso}:${signKey}` (FNV-1a 32-bit) into a mulberry32 PRNG — the same
// algorithm as SeasonalParticles.tsx — and draws mood/color/advice indices
// plus a lucky number 1..99. Same day + same zodiac sign = same result,
// forever, on server and client alike: pure function, no Math.random, no
// clock access, no storage. Recomputing for a re-render is free and stable.
//
// Locale is NOT part of the seed — the pick is locale-independent (indices
// only), so en/ja/fa show the same mood/color/advice for a given day, and
// switching language mid-day never reshuffles the cards.
//
// Pure module — no React, no Node APIs. Runs identically client & server.
// ANDROID PORT (Task 13-d): port hashString (FNV-1a) + mulberry32 + this
// draw order verbatim, then index the mirrored data tables in ./data.ts.

import type { LocaleCode } from "@/lib/i18n/types";
import {
  ADVICE,
  ADVICE_COUNT,
  COLORS,
  COLOR_COUNT,
  MOODS,
  MOOD_COUNT,
} from "./data";
import type { ColorEntry, MoodEntry } from "./data";

export { MOODS, COLORS, ADVICE } from "./data";
export type { MoodEntry, ColorEntry } from "./data";

/** mulberry32 — deterministic PRNG (same algorithm as SeasonalParticles) */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit string hash → unsigned 32-bit PRNG seed */
function hashString(s: string): number {
  let h = 2166136261; // FNV offset basis
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619); // FNV prime
  }
  return h >>> 0;
}

/** locale-independent pick — stable indices into the data banks */
export interface HoroscopePick {
  /** 0..MOOD_COUNT-1 */
  moodIndex: number;
  /** 0..COLOR_COUNT-1 */
  colorIndex: number;
  /** 0..ADVICE_COUNT-1 */
  adviceIndex: number;
  /** 1..99 */
  luckyNumber: number;
}

/**
 * The day's horoscope pick for a zodiac sign.
 * @param iso      Gregorian ISO date of the displayed day ("2026-10-11")
 * @param signKey  zodiac key from @/lib/calendar/zodiac (e.g. "leo")
 */
export function horoscopeFor(iso: string, signKey: string): HoroscopePick {
  const rand = mulberry32(hashString(`${iso}:${signKey}`));
  return {
    moodIndex: Math.floor(rand() * MOOD_COUNT),
    colorIndex: Math.floor(rand() * COLOR_COUNT),
    adviceIndex: Math.floor(rand() * ADVICE_COUNT),
    luckyNumber: 1 + Math.floor(rand() * 99),
  };
}

/** the pick resolved against one locale's phrase banks */
export interface LocalizedHoroscope {
  mood: MoodEntry;
  color: ColorEntry;
  advice: string;
  luckyNumber: number;
}

/** Resolve a pick into localized mood/color/advice + the lucky number. */
export function localizeHoroscope(
  pick: HoroscopePick,
  locale: LocaleCode,
): LocalizedHoroscope {
  return {
    mood: MOODS[locale][pick.moodIndex],
    color: COLORS[locale][pick.colorIndex],
    advice: ADVICE[locale][pick.adviceIndex],
    luckyNumber: pick.luckyNumber,
  };
}
