// Celestial — Hijri (Islamic lunar) conversions via ICU Intl
// Used server-side for expanding religious event rules into concrete dates.
// Primary: islamic-umalqura. Fallback: islamic-civil (tabular).
import { g2d, d2g } from './jdn';
import type { SimpleDate, HijriDate } from './types';

let fmt: Intl.DateTimeFormat | null = null;
let mode: 'umalqura' | 'civil' | 'none' = 'none';

function getFmt(): Intl.DateTimeFormat | null {
  if (fmt) return fmt;
  for (const cal of ['islamic-umalqura', 'islamic-civil'] as const) {
    try {
      const f = new Intl.DateTimeFormat(`en-u-ca-${cal}-nu-latn`, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'UTC',
      });
      // smoke test
      f.formatToParts(new Date(Date.UTC(2026, 2, 21, 12)));
      fmt = f;
      mode = cal === 'islamic-umalqura' ? 'umalqura' : 'civil';
      return fmt;
    } catch {
      continue;
    }
  }
  return null;
}

export function hijriMode(): string {
  getFmt();
  return mode;
}

/** Gregorian -> Hijri (via UTC noon to avoid boundary effects) */
export function gregorianToHijri(g: SimpleDate): HijriDate {
  const f = getFmt();
  if (!f) {
    // crude tabular fallback (rare): never expected in bun/node
    return tabularGregorianToHijri(g);
  }
  const utc = new Date(Date.UTC(g.year, g.month - 1, g.day, 12));
  const parts = f.formatToParts(utc);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** Hijri -> Gregorian via bounded search around the estimated date */
export function hijriToGregorian(h: HijriDate): SimpleDate {
  // estimate: 1 AH ≈ 622 CE; average year 354.367 days
  const approxJdn = g2d(622, 7, 19) + Math.round((h.year - 1) * 354.367 + (h.month - 1) * 29.53 + h.day);
  // search +/- 40 days for the day whose Hijri date matches
  for (let off = -40; off <= 40; off++) {
    const jdn = approxJdn + off;
    const g = d2g(jdn);
    const hh = gregorianToHijri(g);
    if (hh.year === h.year && hh.month === h.month && hh.day === h.day) return g;
  }
  throw new Error(`hijriToGregorian failed for ${h.year}-${h.month}-${h.day}`);
}

function tabularGregorianToHijri(g: SimpleDate): HijriDate {
  // Fāngènduo tabular civil Islamic calendar (arithmetic)
  const jdn = g2d(g.year, g.month, g.day);
  const days = jdn - g2d(622, 7, 19); // days since 1 Muharram 1 AH (July 19, 622)
  const y = Math.floor(days / 354.367) + 1;
  const base = g2d(622, 7, 19) + Math.round((y - 1) * 354.367);
  let doy = jdn - base + 1;
  let m = 1;
  while (m <= 12 && doy > 30 - (m % 2 === 0 ? 0 : 1) - (m === 12 ? 1 : 0)) {
    const len = m % 2 === 1 ? 30 : m === 12 ? 29 : 29;
    if (doy <= len) break;
    doy -= len;
    m++;
  }
  return { year: y, month: Math.min(m, 12), day: Math.max(1, doy) };
}
