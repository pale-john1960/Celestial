// Celestial — unified calendar facade
import { toJdn, fromJdn, jdnWeekday, isoDate, daysInMonth, parseIso } from './jdn';
import {
  gregorianToJalali, jalaliToGregorian, jalaliMonthLength, jalaliMonthLengths,
  farvardin1Jdn, jalaliYearLength, isJalaliLeap,
} from './jalali';
import {
  gregorianToImperial, imperialToGregorian, IMPERIAL_DAY_NAMES, ANDARJAH_LABEL,
  ANCIENT_MONTH_NAMES, IMPERIAL_EPOCH_OFFSET,
} from './imperial';
import { gregorianToHijri } from './hijri';
import { gregorianMonthName, jalaliMonthName } from '@/lib/i18n';
import type { LocaleCode } from '@/lib/i18n';
import type { CalendarSystem, DayCell, ImperialDate, SimpleDate, WeekStart } from './types';

export * from './types';
export { isoDate, parseIso, daysInMonth, isoWeekNumber } from './jdn';
export {
  gregorianToJalali, jalaliToGregorian, jalaliMonthLength, jalaliMonthLengths,
  farvardin1Jdn, jalaliYearLength, isJalaliLeap,
} from './jalali';
export {
  gregorianToImperial, imperialToGregorian, IMPERIAL_DAY_NAMES, ANDARJAH_LABEL,
  ANCIENT_MONTH_NAMES, IMPERIAL_EPOCH_OFFSET,
} from './imperial';
export { gregorianToHijri, hijriToGregorian, hijriMode } from './hijri';
export { isWeeklyDayOff } from './weekend';
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
  // imperialSolar: Shahanshahi YEAR on the standard Jalali month structure
  if (system === 'imperialSolar') {
    return { year: j.year + IMPERIAL_EPOCH_OFFSET, month: j.month };
  }
  // imperial + ancient share the 12×30 + Andarjah structure
  const imp = gregorianToImperial(g);
  return { year: imp.year, month: imp.month };
}

/** Number of months in a system year (imperial + ancient have Andarjah = 13) */
export function systemMonthCount(system: CalendarSystem): number {
  return system === 'imperial' || system === 'ancient' ? 13 : 12;
}

/** true for the 12×30+Andarjah Fasli systems (they show devotional day names) */
export function hasAndarjah(system: CalendarSystem): boolean {
  return system === 'imperial' || system === 'ancient';
}

export function systemMonthLength(system: CalendarSystem, y: number, m: number): number {
  if (system === 'gregorian') return daysInMonth(y, m);
  // imperialSolar: standard Jalali month lengths (year is Shahanshahi → y-1180)
  if (system === 'imperialSolar') {
    return m === 13 ? 0 : jalaliMonthLength(y - IMPERIAL_EPOCH_OFFSET, m);
  }
  if (system === 'jalali') return m === 13 ? 0 : jalaliMonthLength(y, m);
  // imperial + ancient: months 1-12 = 30 days; 13 = 5 (6 in Jalali leap
  // years). y is a SHAHANSHAI year — the Andarjah leap test runs on the
  // UNDERLYING Jalali year (y - 1180): Shahanshahi = Jalali + 1180.
  if (m === 13) return isJalaliLeap(y - IMPERIAL_EPOCH_OFFSET) ? 6 : 5;
  return 30;
}

/** Convert a system-space (y/m/d) to Gregorian */
export function systemToGregorian(system: CalendarSystem, y: number, m: number, d: number): SimpleDate {
  if (system === 'gregorian') return { year: y, month: m, day: d };
  if (system === 'jalali') return jalaliToGregorian({ year: y, month: m, day: d });
  // imperialSolar: Shahanshahi year on the standard Jalali structure
  if (system === 'imperialSolar') {
    return jalaliToGregorian({ year: y - IMPERIAL_EPOCH_OFFSET, month: m, day: d });
  }
  // imperial + ancient share the conversion
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
  const count = systemMonthCount(system); // 13 for imperial + ancient, else 12
  const step = delta > 0 ? 1 : -1;
  let remaining = Math.abs(delta);
  while (remaining-- > 0) {
    if (month === 13) {
      // after Andarjah comes next year's month 1 (13-month systems only)
      if (step > 0) { year++; month = 1; } else { month = 12; }
    } else if (step > 0) {
      month++;
      if (month > count) { month = 1; year++; }
    } else {
      month--;
      if (month < 1) { month = count; year--; }
    }
  }
  return { year, month };
}

/** The 12(13) months of a system year as { index, gregorianFirst } for year view */
export function yearMonths(system: CalendarSystem, year: number): { index: number; firstG: SimpleDate }[] {
  const out: { index: number; firstG: SimpleDate }[] = [];
  const count = systemMonthCount(system);
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

/**
 * Month NAME for the ACTIVE system under the royal-names preference:
 *  - gregorian / jalali: unchanged
 *  - imperial + imperialSolar: ancient Zoroastrian names iff `royal`
 *  - ancient: ALWAYS the ancient names
 * Month 13 (Andarjah) keeps its label in every mode. Views pass the
 * royalMonthNames SETTING as `royal` — lib/calendar stays store-free.
 */
export function systemMonthName(
  system: CalendarSystem,
  locale: LocaleCode,
  month: number,
  royal: boolean,
): string {
  if (system === 'gregorian') return gregorianMonthName(locale, month);
  const useAncient =
    system === 'ancient' ||
    ((system === 'imperial' || system === 'imperialSolar') && royal);
  if (useAncient && month >= 1 && month <= 12) {
    return ANCIENT_MONTH_NAMES[locale][month - 1] ?? '';
  }
  return jalaliMonthName(locale, month); // 13 → Andarjah label
}

/**
 * (year, month, day) of a DayCell in the ACTIVE system — the display values
 * for the big day numbers / month-first markers. imperial + ancient share the
 * 12×30+Andarjah structure; imperialSolar rides the Jalali structure with a
 * Shahanshahi year number.
 */
export function systemTripleOf(system: CalendarSystem, cell: DayCell): SimpleDate {
  if (system === 'gregorian') return cell.gregorian;
  if (system === 'jalali') return cell.jalali;
  if (system === 'imperialSolar') {
    return {
      year: cell.jalali.year + IMPERIAL_EPOCH_OFFSET,
      month: cell.jalali.month,
      day: cell.jalali.day,
    };
  }
  return cell.imperial;
}
