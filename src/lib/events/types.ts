// Celestial — event system types
import type { EventCategory, SimpleDate } from '@/lib/calendar/types';

export type L10n = { en: string; ja: string; fa: string };

export type RuleKind =
  | 'gregorian-fixed'      // month/day in Gregorian
  | 'gregorian-nth-weekday' // nth weekday of Gregorian month
  | 'gregorian-last-weekday' // last weekday of Gregorian month
  | 'jalali-fixed'         // month/day in Jalali
  | 'jalali-last-weekday'  // last weekday of a Jalali month
  | 'hijri-fixed';         // month/day in Hijri (lunar — shifts each year)

export interface EventRule {
  id: string;
  category: EventCategory;
  kind: RuleKind;
  month: number;  // 1-12 (13 for Andarjah never used in rules)
  day: number;    // day (or nth/weekday anchor depending on kind)
  weekday?: number; // 0=Sun..6=Sat for weekday-based kinds
  nth?: number;     // 1-5 for nth-weekday
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
  source: 'builtin' | 'online' | 'imported';
  /** for online events: provider name */
  provider?: string;
  /** imported event db id */
  dbId?: string;
  /** When category is hidden but it is a legal holiday: show day-off only */
  holidayOnly?: boolean;
}

export interface ImportedEventInput {
  iso: string;
  title: string;
  description?: string;
  isHoliday?: boolean;
  sourceName?: string;
}
