// Celestial — calendar engine validation harness (dev-only)
// Run: bun scripts/validate-calendar.ts
import { g2d, d2g, toJdn, jdnWeekday, isoDate } from '../src/lib/calendar/jdn';
import {
  gregorianToJalali, jalaliToGregorian, isJalaliLeap, farvardin1,
} from '../src/lib/calendar/jalali';
import { gregorianToHijri, hijriToGregorian } from '../src/lib/calendar/hijri';
import { gregorianToImperial, imperialToGregorian, ANDARJAH_LABEL } from '../src/lib/calendar/imperial';
import type { SimpleDate } from '../src/lib/calendar/types';

let pass = 0, fail = 0;
const errs: string[] = [];
function check(name: string, cond: boolean, detail?: string) {
  if (cond) pass++;
  else { fail++; errs.push(`${name}${detail ? ' — ' + detail : ''}`); }
}

// ---- 1. g2d/d2g round-trip + known JDN ----
check('JDN 2000-01-01 = 2451545', g2d(2000, 1, 1) === 2451545, `got ${g2d(2000, 1, 1)}`);
check('JDN 1970-01-01 weekday = 4 (Thu)', jdnWeekday(g2d(1970, 1, 1)) === 4);
check('Weekday 2026-10-11 = 0 (Sun)', jdnWeekday(g2d(2026, 10, 11)) === 0);
for (let y = 1900; y <= 2100; y += 7) {
  for (let m = 1; m <= 12; m += 3) {
    const d = { year: y, month: m, day: 15 } as SimpleDate;
    check(`g2d/d2g roundtrip ${y}-${m}-15`, isoDate(d2g(toJdn(d))) === isoDate(d));
  }
}

// ---- 2. Jalali engine vs ICU Intl 'persian' ----
const pFmt = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC',
});
function intlPersian(g: SimpleDate) {
  const parts = pFmt.formatToParts(new Date(Date.UTC(g.year, g.month - 1, g.day, 12)));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  return { year: get('year'), month: get('month'), day: get('day') };
}
let jalaliMismatch = 0;
const mismatchSamples: string[] = [];
for (let y = 1930; y <= 2090; y++) {
  for (let m = 1; m <= 12; m++) {
    for (let day of [1, 15, 28]) {
      const g = { year: y, month: m, day } as SimpleDate;
      const mine = gregorianToJalali(g);
      const ref = intlPersian(g);
      if (mine.year !== ref.year || mine.month !== ref.month || mine.day !== ref.day) {
        jalaliMismatch++;
        if (mismatchSamples.length < 10) mismatchSamples.push(`${isoDate(g)}: mine ${mine.year}/${mine.month}/${mine.day} vs intl ${ref.year}/${ref.month}/${ref.day}`);
      }
    }
  }
}
check('Jalali == ICU persian 1930-2090 (9036 samples)', jalaliMismatch === 0,
  `${jalaliMismatch} mismatches: ${mismatchSamples.join(' ; ')}`);

// ---- 3. Known Nowruz anchors (independent of Intl) ----
const anchors: [number, string][] = [
  [1399, '2020-03-20'], [1400, '2021-03-21'], [1403, '2024-03-20'],
  [1404, '2025-03-21'], [1405, '2026-03-21'], [1406, '2027-03-21'],
];
for (const [jy, iso] of anchors) {
  check(`Nowruz ${jy} = ${iso}`, isoDate(farvardin1(jy)) === iso, `got ${isoDate(farvardin1(jy))}`);
  check(`Nowruz ${jy} intl-eq`, isoDate(farvardin1(jy)) === iso, '');
}
check('1403 is leap', isJalaliLeap(1403) === true);
check('1405 not leap', isJalaliLeap(1405) === false);
check('1399 leap', isJalaliLeap(1399) === true);
check('1408 leap', isJalaliLeap(1408) === true);

// ---- 4. Jalali -> Gregorian roundtrip ----
for (let jy = 1340; jy <= 1480; jy += 3) {
  for (let jm = 1; jm <= 12; jm += 2) {
    const j = { year: jy, month: jm, day: 13 } as SimpleDate;
    const g = jalaliToGregorian(j);
    const back = gregorianToJalali(g);
    check(`jalali roundtrip ${jy}/${jm}/13`, back.year === jy && back.month === jm && back.day === j.day,
      `got ${back.year}/${back.month}/${back.day}`);
  }
}

// ---- 5. Hijri sanity ----
const h2026_03_21 = gregorianToHijri({ year: 2026, month: 3, day: 21 });
check('Hijri 2026-03-21 = 10/2/1447 (Shawwal 2, Eid al-Fitr era)',
  h2026_03_21.year === 1447 && h2026_03_21.month === 10 && h2026_03_21.day === 2,
  `got ${h2026_03_21.year}/${h2026_03_21.month}/${h2026_03_21.day}`);
const hBack = hijriToGregorian({ year: 1447, month: 10, day: 2 });
check('Hijri reverse 10/2/1447 -> 2026-03-21', isoDate(hBack) === '2026-03-21', `got ${isoDate(hBack)}`);
// spot-check across years
const hijriSpot: [string, string][] = [
  ['2026-02-18', '1447/9/1'],  // Ramadan 1, 1447
  ['2024-03-11', '1445/9/1'],  // Ramadan 1, 1445
  ['2025-03-30', '1446/10/1'], // Eid al-Fitr (Shawwal 1) 1446 — Umm al-Qura
  ['2026-03-20', '1447/10/1'], // Eid al-Fitr (Shawwal 1) 1447 — Umm al-Qura
];
for (const [g, h] of hijriSpot) {
  const [yy, mm, dd] = g.split('-').map(Number);
  const [hy, hm, hd] = h.split('/').map(Number);
  const got = gregorianToHijri({ year: yy, month: mm, day: dd });
  check(`hijri spot ${g} = ${h}`, got.year === hy && got.month === hm && got.day === hd,
    `got ${got.year}/${got.month}/${got.day}`);
}

// ---- 6. Imperial calendar ----
// Nowruz 1405 = 2026-03-21 -> imperial 1/1/1405, day name Ormazd
const imp = gregorianToImperial({ year: 2026, month: 3, day: 21 });
check('Imperial 2026-03-21 = 1405/1/1 Ormazd', imp.year === 1405 && imp.month === 1 && imp.day === 1 && imp.dayNameIndex === 0,
  `got ${imp.year}/${imp.month}/${imp.day}`);
// Day 361 of the year = Andarjah 1: Nowruz 1405 = 2026-03-21; +360 days = 2027-03-16
const andar1 = gregorianToImperial({ year: 2027, month: 3, day: 16 });
check('Imperial 2027-03-16 = Andarjah 1, 1405', andar1.year === 1405 && andar1.month === 13 && andar1.day === 1,
  `got ${andar1.year}/${andar1.month}/${andar1.day}`);
// 2027-03-20 = Andarjah 5 (day before Nowruz 1406)
const andar5 = gregorianToImperial({ year: 2027, month: 3, day: 20 });
check('Imperial 2027-03-20 = Andarjah 5', andar5.month === 13 && andar5.day === 5, `got ${andar5.year}/${andar5.month}/${andar5.day}`);
// 2027-03-21 = Nowruz 1406 -> imperial 1/1/1406
const n1406 = gregorianToImperial({ year: 2027, month: 3, day: 21 });
check('Imperial 2027-03-21 = 1406/1/1', n1406.year === 1406 && n1406.month === 1 && n1406.day === 1,
  `got ${n1406.year}/${n1406.month}/${n1406.day}`);
// imperial reverse roundtrip for a few dates
for (const iso of ['2026-06-15', '2026-12-31', '2027-01-15', '2027-03-19']) {
  const [yy, mm, dd] = iso.split('-').map(Number);
  const g = { year: yy, month: mm, day: dd } as SimpleDate;
  const i = gregorianToImperial(g);
  const back = imperialToGregorian(i);
  check(`imperial roundtrip ${iso}`, isoDate(back) === iso, `got ${isoDate(back)} (imp ${i.year}/${i.month}/${i.day})`);
}

console.log(`\n=== VALIDATION: ${pass} passed, ${fail} failed ===`);
if (errs.length) {
  console.log('Failures (first 25):');
  errs.slice(0, 25).forEach((e) => console.log('  ✗', e));
  process.exit(1);
} else {
  console.log('All calendar engine checks passed ✅');
}
