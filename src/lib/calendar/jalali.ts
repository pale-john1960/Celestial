// Celestial — Jalali (Shamsi / Solar Hijri) engine
// Pure JS implementation (33-year cycle, epoch Farvardin 1, 1386 AP = 2007-03-21 CE)
// Validated against ICU Intl 'persian' calendar across 1900..2100 (see scripts/validate-calendar.ts)
import { d2g, g2d, toJdn } from './jdn';
import type { SimpleDate } from './types';

/**
 * Cycle model: 33-year cycles aligned at 1386 AP.
 * Leap years at cycle offsets {1,5,9,13,17,22,26,30} (8 leap days per cycle).
 * Known to match the astronomical Jalali calendar and ICU 'persian' from
 * 1929..2058; deterministic arithmetic outside that window.
 */
const CYCLE_START_AP = 1386;
/** Farvardin 1, 1386 AP = 2007-03-21 CE (Gregorian) */
const EPOCH_G = { year: 2007, month: 3, day: 21 } as SimpleDate;
const EPOCH_JDN = g2d(2007, 3, 21);
const LEAP_OFFSETS = [1, 5, 9, 13, 17, 22, 26, 30];

function cycleOf(jy: number): { start: number; pos: number } {
  const c = Math.floor((jy - CYCLE_START_AP) / 33);
  const start = CYCLE_START_AP + c * 33;
  return { start, pos: jy - start };
}

export function isJalaliLeap(jy: number): boolean {
  const { pos } = cycleOf(jy);
  return LEAP_OFFSETS.includes(pos);
}

function leapsBeforeOffset(n: number): number {
  // number of leap years with cycle offset < n
  return LEAP_OFFSETS.filter((o) => o < n).length;
}

/** JDN of Farvardin 1 for a given Jalali year */
export function farvardin1Jdn(jy: number): number {
  const c = Math.floor((jy - CYCLE_START_AP) / 33);
  const rem = jy - (CYCLE_START_AP + c * 33);
  const leaps = c * 8 + leapsBeforeOffset(rem);
  return EPOCH_JDN + (jy - CYCLE_START_AP) * 365 + leaps;
}

export function farvardin1(jy: number): SimpleDate {
  return d2g(farvardin1Jdn(jy));
}

export function jalaliYearLength(jy: number): number {
  return isJalaliLeap(jy) ? 366 : 365;
}

/** months 1-6: 31 days; 7-11: 30; 12: 29 (30 in leap years) */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

export function jalaliMonthLengths(jy: number): number[] {
  return Array.from({ length: 12 }, (_, i) => jalaliMonthLength(jy, i + 1));
}

function dayOfJalaliYear(j: SimpleDate): number {
  if (j.month <= 6) return (j.month - 1) * 31 + j.day;
  if (j.month <= 11) return 186 + (j.month - 7) * 30 + j.day;
  return 336 + j.day;
}

export function jalaliToJdn(j: SimpleDate): number {
  return farvardin1Jdn(j.year) + dayOfJalaliYear(j) - 1;
}

export function jalaliToGregorian(j: SimpleDate): SimpleDate {
  return d2g(jalaliToJdn(j));
}

export function jdnToJalali(jdn: number): SimpleDate {
  // estimate year, then correct
  let jy = CYCLE_START_AP + Math.floor((jdn - EPOCH_JDN) / 365.2425);
  let anchor = farvardin1Jdn(jy);
  if (jdn < anchor) {
    jy -= 1;
    anchor = farvardin1Jdn(jy);
  } else if (jdn >= anchor + jalaliYearLength(jy)) {
    jy += 1;
    anchor = farvardin1Jdn(jy);
  }
  const doy = jdn - anchor + 1; // 1..366
  let jm: number;
  let jd: number;
  if (doy <= 186) {
    jm = Math.ceil(doy / 31);
    jd = doy - (jm - 1) * 31;
  } else {
    const k = doy - 186;
    jm = 7 + Math.floor((k - 1) / 30);
    jd = ((k - 1) % 30) + 1;
  }
  return { year: jy, month: jm, day: jd };
}

export function gregorianToJalali(g: SimpleDate): SimpleDate {
  return jdnToJalali(toJdn(g));
}

/** Jalali "today" for a JS Date (local time, noon-safe) */
export function jalaliToday(now = new Date()): SimpleDate {
  return gregorianToJalali({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}

/** Nth (1-based) weekday-of-month; weekday 0=Sunday */
export function nthWeekdayOfMonth(gy: number, gm: number, nth: number, weekday: number): number {
  const first = g2d(gy, gm, 1);
  const firstWd = (first + 1) % 7;
  const delta = (weekday - firstWd + 7) % 7;
  return 1 + delta + (nth - 1) * 7;
}

/** Last weekday-of-month; weekday 0=Sunday */
export function lastWeekdayOfMonth(gy: number, gm: number, weekday: number): number {
  const len = new Date(gy, gm, 0).getDate();
  const last = g2d(gy, gm, len);
  const lastWd = (last + 1) % 7;
  const delta = (lastWd - weekday + 7) % 7;
  return len - delta;
}

/** Last weekday of a Jalali month (for e.g. Charshanbe Suri) */
export function lastWeekdayOfJalaliMonth(jy: number, jm: number, weekday: number): number {
  const len = jalaliMonthLength(jy, jm);
  const lastJdn = jalaliToJdn({ year: jy, month: jm, day: len });
  const lastWd = (lastJdn + 1) % 7;
  const delta = (lastWd - weekday + 7) % 7;
  return len - delta;
}
