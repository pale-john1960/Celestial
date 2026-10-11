// Celestial — event system types
import type { EventCategory, SimpleDate } from '@/lib/calendar/types';

export type L10n = { en: string; ja: string; fa: string };

export type RuleKind =
  | 'gregorian-fixed'      // month/day in Gregorian
  | 'gregorian-nth-weekday' // nth weekday of Gregorian month
  | 'gregorian-last-weekday' // last weekday of Gregorian month
  | 'jalali-fixed'         // month/day in Jalali
  | 'jalali-last-weekday'  // last weekday of a Jalali month
  | 'hijri-fixed'          // month/day in Hijri (lunar — shifts each year)
  | 'season-event';        // astronomical: solar longitude hits seasonTarget, day bucketed in tzOffsetMin (fixed-offset zones only)

export interface EventRule {
  id: string;
  category: EventCategory;
  kind: RuleKind;
  month: number;  // 1-12 (13 for Andarjah never used in rules; informational seed for season-event)
  day: number;    // day (or nth/weekday anchor depending on kind; informational seed for season-event)
  weekday?: number; // 0=Sun..6=Sat for weekday-based kinds
  nth?: number;     // 1-5 for nth-weekday
  /** season-event: solar longitude target in degrees (0 mar equinox, 90 jun solstice, 180 sep equinox, 270 dec solstice) */
  seasonTarget?: 0 | 90 | 180 | 270;
  /** season-event: fixed UTC offset in minutes EAST (e.g. 540 = JST). DST zones unsupported by design. */
  tzOffsetMin?: number;
  isHoliday?: boolean; // legal day off (in its country context)
  emoji: string;
  names: L10n;
  descriptions: L10n;
}

export interface EventInstance {
  id: string;           // ruleId + iso date
  ruleId: string;
  category: EventCategory;
  iso: string;          // gregorian yyyy-mm-dd
  gregorian: SimpleDate;
  isHoliday: boolean;
  emoji: string;
  names: L10n;
  descriptions: L10n;
  /** true when the source rule is a "online" fetched event */
  source: 'builtin' | 'online' | 'imported' | 'manual';
  /** for online events: provider name; for manual events: "manual" */
  provider?: string;
  /** imported event db id */
  dbId?: string;
  /** When category is hidden but it is a legal holiday: show day-off only */
  holidayOnly?: boolean;
  /** true for instances of a yearly-recurring imported event (incl. the anchor) */
  recurring?: boolean;
  /** for recurring instances: the anchor row's iso (the series' stored date) */
  anchorIso?: string;
}

export interface ImportedEventInput {
  iso: string;
  title: string;
  description?: string;
  isHoliday?: boolean;
  /** import as a yearly-recurring series (anchor = iso) */
  recurYearly?: boolean;
  sourceName?: string;
}
