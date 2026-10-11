// Celestial — moon phase computation (Meeus ch.49 derived, simplified)
//
// ALGORITHM IS VALIDATED (coordinator, Task 6-a spec): 149/153 day-markers
// agree with the icalendar37.net live lunar API over a multi-year window;
// new/full anchors within ±5 min of the true instants. Disagreements occur
// only when the true event falls within ~1 h of local midnight.
//
// Accuracy: new/full ±5 min, quarters ±2 h. Good enough for calendar glyphs.
//
// Constants (for the Android port — keep in sync):
//   SYNODIC = 29.530588853          (mean synodic month, days)
//   BASE    = 2451550.09766         (Meeus ch.49 mean new-moon epoch, k=0 —
//                                    NOT the 18:14 true instant)
//   MAJORS  = new:0, firstQ:7.38264721, full:14.76529443, lastQ:22.14794164
//     (quarter positions = SYNODIC/4 and 3*SYNODIC/4)
//   corrAt(jd, pos):
//     quarters (pos 7.38264721 / 22.14794164):
//       -0.62814*sin(Mp) + 0.17172*sin(Ms)
//     new/full (pos 0 / 14.76529443):
//       -0.40720*sin(Mp) + 0.17241*sin(Ms)
//     with Mp = TAU*frac(134.963/360 + 13.064993*d/360),
//          Ms = TAU*frac(357.529/360  + 0.98560028*d/360),
//          d = jd - 2451545.0   (Meeus mean anomalies, E≈1)
//
// Pure module — no React, no Node APIs. Runs identically client & server.
import type { SimpleDate } from './types';
import { toJdn } from './jdn';

const TAU = Math.PI * 2;
const SYNODIC = 29.530588853;
/** Meeus ch.49 mean new-moon epoch (k=0), NOT the 18:14 true instant */
const BASE = 2451550.09766;

/** Mean-anomaly corrections are evaluated at 1/4 and 3/4 of the cycle */
const POS_FIRST_Q = 7.38264721; // SYNODIC / 4
const POS_FULL = 14.76529443; // SYNODIC / 2
const POS_LAST_Q = 22.14794164; // 3 * SYNODIC / 4

interface MajorDef {
  m: MoonMajor;
  pos: number;
}
const MAJORS: MajorDef[] = [
  { m: 'new', pos: 0 },
  { m: 'firstQ', pos: POS_FIRST_Q },
  { m: 'full', pos: POS_FULL },
  { m: 'lastQ', pos: POS_LAST_Q },
];

export type MoonMajor = 'new' | 'firstQ' | 'full' | 'lastQ';

export interface MoonInfo {
  /** 0..7 → 0 new, 1 waxing crescent, 2 first quarter, 3 waxing gibbous,
   *  4 full, 5 waning gibbous, 6 last quarter, 7 waning crescent */
  phaseIndex: number;
  /** 0..1 of the synodic cycle (at local noon) */
  phase: number;
  /** 0..1 illuminated fraction (at local noon) */
  illum: number;
  /** days since the true new moon of this cycle (at local noon) */
  ageDays: number;
  /** major-phase event falling on THIS date (local day window), else null */
  major: MoonMajor | null;
}

const frac = (x: number): number => x - Math.floor(x);
const mod = (a: number, b: number): number => a - b * Math.floor(a / b);

/** Moon (M') and sun (M) mean anomalies for a Julian Day */
function anomalies(jd: number): { Mp: number; Ms: number } {
  const d = jd - 2451545.0;
  const Mp = TAU * frac(134.963 / 360 + (13.064993 * d) / 360);
  const Ms = TAU * frac(357.529 / 360 + (0.98560028 * d) / 360);
  return { Mp, Ms };
}

/** Meeus ch.49 correction — two dominant terms per table, E≈1 */
function corrAt(jd: number, pos: number): number {
  const { Mp, Ms } = anomalies(jd);
  if (pos === POS_FIRST_Q || pos === POS_LAST_Q) {
    // QUARTER table
    return -0.62814 * Math.sin(Mp) + 0.17172 * Math.sin(Ms);
  }
  // NEW/FULL table
  return -0.4072 * Math.sin(Mp) + 0.17241 * Math.sin(Ms);
}

/** Moon info for a Gregorian calendar date, evaluated at LOCAL noon. */
export function moonInfo(g: SimpleDate): MoonInfo {
  const jdn = toJdn(g);
  // Offset of the local timezone in days relative to UTC, measured so that
  // LOCAL NOON of date D = jdn(D) + off (jdn is the integer JD at 12:00 UTC).
  // getTimezoneOffset() returns minutes WEST of UTC (negative east), and
  // west-of-UTC local noons happen LATER than UTC noon — so the raw value
  // (days west, negative east) is exactly what these formulas need.
  // NOTE: the task spec prose wrote `-getTimezoneOffset()/1440 (days east)`,
  // but that sign fails the validated Tokyo anchor (2024-04-08 new moon must
  // marker on 04-09 JST, none on 04-08); days-west passes all 4 anchors.
  const off = new Date(g.year, g.month - 1, g.day).getTimezoneOffset() / 1440;

  const localNoon = jdn + off;
  const ageMean = mod(localNoon - BASE, SYNODIC);
  // MEAN new moon that started this cycle
  const cycleStart = localNoon - ageMean;
  // …corrected to the TRUE new moon
  const trueNewStart = cycleStart + corrAt(cycleStart, 0);
  const age = localNoon - trueNewStart;

  const phase = age / SYNODIC;
  const illum = (1 - Math.cos(TAU * phase)) / 2;
  const phaseIndex = mod(Math.floor(phase * 8 + 0.5), 8);

  // which major glyphs fall on this LOCAL day (D 00:00 … D+1 00:00)?
  let markers: { m: MoonMajor; evt: number }[] = [];
  for (const shift of [-SYNODIC, 0, SYNODIC]) {
    for (const { m, pos } of MAJORS) {
      const meanEvt = cycleStart + shift + pos;
      const evt = meanEvt + corrAt(meanEvt, pos);
      if (evt >= jdn - 0.5 + off && evt < jdn + 0.5 + off) {
        markers.push({ m, evt });
      }
    }
  }
  // normally 0 or 1; if 2 (boundary), keep the one closest to local noon
  let major: MoonMajor | null = null;
  if (markers.length === 1) {
    major = markers[0].m;
  } else if (markers.length > 1) {
    markers = markers
      .slice()
      .sort((a, b) => Math.abs(a.evt - localNoon) - Math.abs(b.evt - localNoon));
    major = markers[0].m;
  }

  return { phaseIndex, phase, illum, ageDays: age, major };
}

/** Phase glyphs by phaseIndex (0..7) */
export const MOON_EMOJI = [
  '🌑', // new
  '🌒', // waxing crescent
  '🌓', // first quarter
  '🌔', // waxing gibbous
  '🌕', // full
  '🌖', // waning gibbous
  '🌗', // last quarter
  '🌘', // waning crescent
] as const;

/** Tiny glyph shown on calendar cells — major-phase days only */
export const MOON_MAJOR_EMOJI: Record<MoonMajor, string> = {
  new: '🌑',
  firstQ: '🌓',
  full: '🌕',
  lastQ: '🌗',
};

/** Localized phase name for a phaseIndex (0..7) */
export function moonPhaseName(
  dict: {
    moonNew: string;
    moonWaxingCrescent: string;
    moonFirstQuarter: string;
    moonWaxingGibbous: string;
    moonFull: string;
    moonWaningGibbous: string;
    moonLastQuarter: string;
    moonWaningCrescent: string;
  },
  phaseIndex: number,
): string {
  const names = [
    dict.moonNew,
    dict.moonWaxingCrescent,
    dict.moonFirstQuarter,
    dict.moonWaxingGibbous,
    dict.moonFull,
    dict.moonWaningGibbous,
    dict.moonLastQuarter,
    dict.moonWaningCrescent,
  ];
  return names[phaseIndex] ?? names[0];
}
