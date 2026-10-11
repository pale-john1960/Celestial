// Celestial — rule expansion: turn EventRules into concrete dated instances
// Strategy: scan every Gregorian day of the requested range and match rules
// (Gregorian / Jalali / Hijri all derive from the same day scan — no reverse
// lunar conversion needed).
import { toJdn, fromJdn, isoDate } from '@/lib/calendar/jdn';
import { gregorianToJalali, lastWeekdayOfJalaliMonth, nthWeekdayOfMonth, lastWeekdayOfMonth } from '@/lib/calendar/jalali';
import { gregorianToHijri } from '@/lib/calendar/hijri';
import { seasonEventsOfYear, SEASON_EVENT_TARGET } from '@/lib/calendar/solstice';
import type { SimpleDate } from '@/lib/calendar/types';
import type { EventRule, EventInstance } from './types';
import { allBuiltinRules } from './data';

const cache = new Map<string, EventInstance[]>();

/** day-of-year scan bounds for a Gregorian year */
function yearDays(gy: number): SimpleDate[] {
  const first = toJdn({ year: gy, month: 1, day: 1 });
  const last = toJdn({ year: gy + 1, month: 1, day: 1 }) - 1;
  const out: SimpleDate[] = [];
  for (let j = first; j <= last; j++) out.push(fromJdn(j));
  return out;
}

function matchesRule(rule: EventRule, g: SimpleDate): boolean {
  switch (rule.kind) {
    case 'gregorian-fixed':
      return g.month === rule.month && g.day === rule.day;
    case 'gregorian-nth-weekday':
      return g.month === rule.month && g.day === nthWeekdayOfMonth(g.year, g.month, rule.nth ?? 1, rule.weekday ?? 1);
    case 'gregorian-last-weekday':
      return g.month === rule.month && g.day === lastWeekdayOfMonth(g.year, g.month, rule.weekday ?? 1);
    case 'jalali-fixed': {
      const j = gregorianToJalali(g);
      return j.month === rule.month && j.day === rule.day;
    }
    case 'jalali-last-weekday': {
      const j = gregorianToJalali(g);
      if (j.month !== rule.month) return false;
      return j.day === lastWeekdayOfJalaliMonth(j.year, rule.month, rule.weekday ?? 2);
    }
    case 'hijri-fixed': {
      const h = gregorianToHijri(g);
      return h.month === rule.month && h.day === rule.day;
    }
    case 'season-event': {
      // astronomical rule (e.g. 春分の日 / 秋分の日): the day whose FIXED-offset
      // timezone window contains the solar-longitude event instant of g's year.
      // month/day on the rule are informational seeds only.
      const target = rule.seasonTarget ?? 0;
      const info = seasonEventsOfYear(g.year).find(
        (s) => SEASON_EVENT_TARGET[s.event] === target,
      );
      if (!info) return false;
      // days-WEST offset of a fixed tz (posix sign): JST (+540 east) → −540/1440
      const off = -(rule.tzOffsetMin ?? 0) / 1440;
      const jdn = toJdn(g);
      return info.jd >= jdn - 0.5 + off && info.jd < jdn + 0.5 + off;
    }
    default:
      return false;
  }
}

function toInstance(rule: EventRule, g: SimpleDate, source: 'builtin' | 'online' = 'builtin'): EventInstance {
  return {
    id: `${rule.id}:${isoDate(g)}`,
    ruleId: rule.id,
    category: rule.category,
    iso: isoDate(g),
    gregorian: g,
    isHoliday: !!rule.isHoliday,
    emoji: rule.emoji,
    names: rule.names,
    descriptions: rule.descriptions,
    source,
  };
}

/** Expand ALL builtin rules for a Gregorian year (cached). */
export function expandBuiltinYear(gy: number): EventInstance[] {
  const key = `y${gy}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const days = yearDays(gy);
  const out: EventInstance[] = [];
  for (const g of days) {
    for (const rule of allBuiltinRules) {
      if (matchesRule(rule, g)) out.push(toInstance(rule, g));
    }
  }
  out.sort((a, b) => a.iso.localeCompare(b.iso));
  cache.set(key, out);
  return out;
}

/** Instances whose date falls within [fromIso, toIso] (inclusive) */
export function expandBuiltinRange(fromIso: string, toIso: string): EventInstance[] {
  const y1 = Number(fromIso.slice(0, 4));
  const y2 = Number(toIso.slice(0, 4));
  const out: EventInstance[] = [];
  for (let y = y1; y <= y2; y++) {
    for (const inst of expandBuiltinYear(y)) {
      if (inst.iso >= fromIso && inst.iso <= toIso) out.push(inst);
    }
  }
  out.sort((a, b) => a.iso.localeCompare(b.iso));
  return out;
}
