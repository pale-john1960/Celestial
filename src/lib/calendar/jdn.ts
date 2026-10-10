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

export { div, mod };
