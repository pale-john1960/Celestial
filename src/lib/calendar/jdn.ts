// Celestial — Gregorian <-> JDN conversions (Fourmilab / jalaali-js derived, exact)
import type { SimpleDate } from './types';

const div = (a: number, b: number): number => ~~(a / b);
const mod = (a: number, b: number): number => a - ~~(a / b) * b;

/** Gregorian y/m/d -> Julian Day Number */
export function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

/** JDN -> Gregorian y/m/d */
export function d2g(jdn: number): SimpleDate {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { year: gy, month: gm, day: gd };
}

/** weekday index (0=Sunday) for a JDN */
export function jdnWeekday(jdn: number): number {
  // JDN 0 is a Monday; 2440588 (1970-01-01) is a Thursday (4)
  return (jdn + 1) % 7;
}

export const toJdn = (d: SimpleDate): number => g2d(d.year, d.month, d.day);
export const fromJdn = (jdn: number): SimpleDate => d2g(jdn);

export function daysInMonth(gy: number, gm: number): number {
  const nxt = gm === 12 ? g2d(gy + 1, 1, 1) : g2d(gy, gm + 1, 1);
  return nxt - g2d(gy, gm, 1);
}

export function isGregorianLeap(gy: number): boolean {
  return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
}

export function gregorianMonthLengths(leap: boolean): number[] {
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
}

export function isoDate(d: SimpleDate): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.year}-${p(d.month)}-${p(d.day)}`;
}

export function parseIso(s: string): SimpleDate | null {
  const m = /^(\d{4,5})-(\d{1,2})-(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { year: y, month: mo, day: d };
}

/** ISO-8601 week number (1-53) of a Gregorian date — the "Thursday rule":
 *  a date belongs to the ISO year/week of its Thursday, and week 1 of a year
 *  is the Mon-Sun week containing that year's first Thursday. Year boundaries
 *  fall out naturally: Jan 1-3 can be week 52/53 of the previous year and
 *  Dec 29-31 can be week 1 of the next one (the ISO year is simply read off
 *  the Thursday's Gregorian year). Verified against Python's isocalendar()
 *  for every day 1970-2100 (see task 12-a worklog). */
export function isoWeekNumber(d: SimpleDate): number {
  const jdn = g2d(d.year, d.month, d.day);
  // Thursday of d's Mon-Sun week (jdnWeekday: 0=Sunday)
  const jdnThursday = jdn + 3 - ((jdnWeekday(jdn) + 6) % 7);
  // the ISO year is the Gregorian year of that Thursday
  const isoYear = d2g(jdnThursday).year;
  const jan1 = g2d(isoYear, 1, 1);
  const firstThursday = jan1 + ((4 - jdnWeekday(jan1) + 7) % 7);
  return div(jdnThursday - firstThursday, 7) + 1;
}

export { div, mod };
