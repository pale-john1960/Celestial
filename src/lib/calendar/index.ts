// Celestial — unified calendar facade
import { toJdn, fromJdn, jdnWeekday, isoDate, daysInMonth, parseIso } from './jdn';
import {
  gregorianToJalali, jalaliToGregorian, jalaliMonthLength, jalaliMonthLengths,
  farvardin1Jdn, jalaliYearLength, isJalaliLeap,
} from './jalali';
import { gregorianToImperial, imperialToGregorian, IMPERIAL_DAY_NAMES, ANDARJAH_LABEL } from './imperial';
import { gregorianToHijri } from './hijri';
import type { CalendarSystem, DayCell, ImperialDate, SimpleDate, WeekStart } from './types';

export * from './types';
export { isoDate, parseIso, daysInMonth, isoWeekNumber } from './jdn';
export {
  gregorianToJalali, jalaliToGregorian, jalaliMonthLength, jalaliMonthLengths,
  farvardin1Jdn, jalaliYearLength, isJalaliLeap,
} from './jalali';
export { gregorianToImperial, imperialToGregorian, IMPERIAL_DAY_NAMES, ANDARJAH_LABEL } from './imperial';
export { gregorianToHijri, hijriToGregorian, hijriMode } from './hijri';
export { moonInfo, moonPhaseName, MOON_EMOJI, MOON_MAJOR_EMOJI } from './moon';
export type { MoonInfo, MoonMajor } from './moon';
export {
  seasonEventOn, seasonEventsOfYear, sunLon,
  SEASON_EVENT_EMOJI, seasonEventName, seasonEventNote,
} from './solstice';
export type { SeasonEvent, SolsticeInfo } from './solstice';

/** Position of a date in "system space" — year/month in the ACTIVE system. */
export interface SystemDate {
  year: number;
  month: number; // 1-12 (13 = Andarjah in imperial)
}

export function systemDateOf(system: CalendarSystem, g: SimpleDate): SystemDate {
  if (system === 'gregorian') return { year: g.year, month: g.month };
  const j = gregorianToJalali(g);
  if (system === 'jalali') return { year: j.year, month: j.month };
  const imp = gregorianToImperial(g);
  return { year: imp.year, month: imp.month };
}

export function systemMonthLength(system: CalendarSystem, y: number, m: number): number {
  if (system === 'gregorian') return daysInMonth(y, m);
  if (system === 'jalali') return m === 13 ? 0 : jalaliMonthLength(y, m);
  // imperial: months 1-12 = 30 days; 13 = 5 (6 in leap years)
  if (m === 13) return isJalaliLeap(y) ? 6 : 5;
  return 30;
}

/** Convert a system-space (y/m/d) to Gregorian */
export function systemToGregorian(system: CalendarSystem, y: number, m: number, d: number): SimpleDate {
  if (system === 'gregorian') return { year: y, month: m, day: d };
  if (system === 'jalali') return jalaliToGregorian({ year: y, month: m, day: d });
  // BUGFIX (task 3-a): was `{ year: y, month: m, day }` — invalid shorthand
  // (param is `d`) → ReferenceError at runtime for the imperial system.
  // Single-token fix, no behaviour change for gregorian/jalali.
  return imperialToGregorian({ year: y, month: m, day: d });
}

/** Build a full DayCell from a Gregorian date */
export function buildDayCell(g: SimpleDate, today: SimpleDate, inMonth: boolean): DayCell {
  const jdn = toJdn(g);
  const jalali = gregorianToJalali(g);
  const imperial = gregorianToImperial(g);
  const hijri = gregorianToHijri(g);
  return {
    jdn,
    gregorian: g,
    jalali,
    imperial,
    hijri,
    weekday: jdnWeekday(jdn),
    inMonth,
    isToday: isoDate(g) === isoDate(today),
    iso: isoDate(g),
  };
}

/** 42-cell grid (6 weeks) for month view in the active system + week start. */
export function monthGrid(
  system: CalendarSystem,
  year: number,
  month: number,
  weekStart: WeekStart,
  today: SimpleDate,
): DayCell[] {
  const firstG = systemToGregorian(system, year, month, 1);
  const firstJdn = toJdn(firstG);
  const firstWeekday = jdnWeekday(firstJdn); // 0=Sun
  const lead = (firstWeekday - weekStart + 7) % 7;
  const gridStartJdn = firstJdn - lead;
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const jdn = gridStartJdn + i;
    const g = fromJdn(jdn);
    const sd = systemDateOf(system, g);
    const inMonth = sd.year === year && sd.month === month;
    cells.push(buildDayCell(g, today, inMonth));
  }
  return cells;
}

/** Ordered weekday indices (0=Sun..6=Sat) based on week start */
export function weekdayOrder(weekStart: WeekStart): number[] {
  return Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7);
}

/** Navigate: next/previous month in system space (handles Andarjah) */
export function shiftMonth(system: CalendarSystem, y: number, m: number, delta: number): { year: number; month: number } {
  let year = y;
  let month = m;
  const step = delta > 0 ? 1 : -1;
  let remaining = Math.abs(delta);
  while (remaining-- > 0) {
    if (system === 'imperial' && month === 13) {
      // after Andarjah comes next year's month 1
      if (step > 0) { year++; month = 1; } else { month = 12; }
    } else if (step > 0) {
      month++;
      if (month > (system === 'imperial' ? 13 : 12)) { month = 1; year++; }
    } else {
      month--;
      if (month < 1) { month = system === 'imperial' ? 13 : 12; year--; }
    }
  }
  return { year, month };
}

/** The 12(13) months of a system year as { index, gregorianFirst } for year view */
export function yearMonths(system: CalendarSystem, year: number): { index: number; firstG: SimpleDate }[] {
  const out: { index: number; firstG: SimpleDate }[] = [];
  const count = system === 'imperial' ? 13 : 12;
  for (let m = 1; m <= count; m++) {
    out.push({ index: m, firstG: systemToGregorian(system, year, m, 1) });
  }
  return out;
}

/** Today's Gregorian date (local) */
export function todayGregorian(now = new Date()): SimpleDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** Imperial display helpers */
export function imperialDayName(locale: 'en' | 'ja' | 'fa', imp: ImperialDate): string {
  if (imp.month === 13) return `${ANDARJAH_LABEL[locale]} ${imp.day}`;
  return IMPERIAL_DAY_NAMES[locale][imp.dayNameIndex ?? imp.day - 1] ?? '';
}
