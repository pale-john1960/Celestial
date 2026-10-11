// Celestial — shared calendar types
// NOTE (task 3-a): this file was missing from the Task-2 commit while every
// engine module imports it. `import type` statements are erased at compile
// time (so scripts/validate-calendar.ts passed), but any runtime import of
// '@/lib/calendar' (index.ts does `export * from './types'`) failed with
// "Cannot find module './types'". Recreated additively from engine usage —
// no behaviour changes.

/** A plain y/m/d triple (Gregorian unless stated otherwise) */
export interface SimpleDate {
  year: number;
  month: number; // 1-12
  day: number;
}

/** Supported calendar systems (round 14 adds two Shahanshahi-era variants):
 *  - imperialSolar: Shahanshahi YEAR (Jalali + 1180) with the STANDARD Jalali
 *    month/day structure (Farvardin 1–31 … Esfand 29/30) — 12 months.
 *  - ancient: the 12×30-day Fasli structure + Andarjah (month 13, 5/6 days),
 *    same math as 'imperial' but month NAMES always use the ancient
 *    Zoroastrian set (see ANCIENT_MONTH_NAMES). */
export type CalendarSystem =
  | 'gregorian'
  | 'jalali'
  | 'imperial'
  | 'imperialSolar'
  | 'ancient';

/** Week start day (0 = Sunday … 6 = Saturday) */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Hijri (Islamic lunar) date */
export interface HijriDate {
  year: number;
  month: number; // 1-12
  day: number;
}

/** Persian Imperial date: 12×30-day months + Andarjah (month 13, 5-6 days) */
export interface ImperialDate {
  year: number;
  month: number; // 1-13 (13 = Andarjah)
  day: number;
  /** index (0-based) into the 30 devotional day names; undefined in Andarjah */
  dayNameIndex?: number;
}

/** One cell of a month grid — carries the date in every system at once */
export interface DayCell {
  jdn: number;
  gregorian: SimpleDate;
  jalali: SimpleDate;
  imperial: ImperialDate;
  hijri: HijriDate;
  weekday: number; // 0 = Sunday
  inMonth: boolean;
  isToday: boolean;
  iso: string; // gregorian yyyy-mm-dd
}

/** Event categories (dataset keys + imported) */
export type EventCategory =
  | 'international'
  | 'us'
  | 'japan'
  | 'persian-cultural'
  | 'persian-religious'
  | 'persian-national'
  | 'imported';
