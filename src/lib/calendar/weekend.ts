// Celestial — weekly day-off resolution (round 14)
//
// "auto" follows the locale convention (Persian → Friday; en/ja → none —
// those locales mark weekend columns in the grid but no official day off);
// the other codes force a specific weekday. Pure helper — views pass the
// weekendDay SETTING + the locale; lib/calendar never imports the store at
// runtime (type-only import below is erased at compile time).
import type { LocaleCode } from '@/lib/i18n';
import type { WeekendDayCode } from '@/store/settings';

/**
 * Is `weekday` (0 = Sunday … 5 = Friday … 6 = Saturday) a weekly day off
 * under the user's weekendDay preference for this locale?
 */
export function isWeeklyDayOff(
  weekendDay: WeekendDayCode,
  locale: LocaleCode,
  weekday: number,
): boolean {
  switch (weekendDay) {
    case 'friday':
      return weekday === 5;
    case 'saturday':
      return weekday === 6;
    case 'sunday':
      return weekday === 0;
    case 'none':
      return false;
    case 'auto':
    default:
      // Persian convention: Friday is the weekly day off
      return locale === 'fa' ? weekday === 5 : false;
  }
}
