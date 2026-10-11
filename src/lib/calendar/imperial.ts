// Celestial — Persian Imperial (Shahanshahi) calendar
//
// Shahanshahi era: Cyrus the Great's coronation 559 BCE (Wikipedia: Shahanshahi
// calendar / Iranian calendars). Year = Jalali + 1180; Farvardin 1, 1355 AP =
// 2535 — the official conversion introduced by the 1976 Pahlavi reform
// (1355 AP became 2535 Imperial). So Nowruz 2026 (1405 AP) is Imperial year
// 2585.
//
// Month/day structure (unchanged, Fasli-aligned): 12 fixed 30-day months +
// 5(6) Andarjah epagomenal days at the end of the year (6 in Jalali leap
// years). Each day carries one of the 30 devotional day names (the cycle
// repeats every month).
import { farvardin1Jdn } from './jalali';
import { toJdn, d2g, g2d } from './jdn';
import type { SimpleDate, ImperialDate } from './types';

export const IMPERIAL_DAY_NAMES: Record<'en' | 'ja' | 'fa', string[]> = {
  en: [
    'Ormazd', 'Bahman', 'Ardibehesht', 'Shahrivar', 'Esfandarmuz', 'Khordad',
    'Mordad', 'Dey-be-Azar', 'Azar', 'Aban', 'Khwarshid', 'Mah', 'Tir', 'Gush',
    'Dey-be-Mehr', 'Mehr', 'Srosh', 'Rashn', 'Farvardin', 'Varahram', 'Ram',
    'Bad', 'Dey-be-Din', 'Din', 'Ard', 'Ashtad', 'Asman', 'Zamyad',
    'Mantraspand', 'Aniram',
  ],
  ja: [
    'オルマズド', 'バフマン', 'アルディベヘシュト', 'シャフリヴァール', 'エスファンダルムズ', 'ホルダード',
    'モルダード', 'ディー・パー・アーザル', 'アーザル', 'アーバーン', 'ファルシェド', 'マーフ', 'ティール', 'グーシュ',
    'ディー・パー・ミスラ', 'メフル', 'スルーシュ', 'ラシュヌ', 'ファルヴァルディーン', 'ヴァラフラーム', 'ラーム',
    'ヴァード', 'ディー・パー・ディーン', 'ディーン', 'アルド', 'アシュタード', 'アースマーン', 'ザーミヤード',
    'マントラスペンド', 'アニーラーム',
  ],
  fa: [
    'اورمزد', 'بهمن', 'اردیبهشت', 'شهریور', 'اسفندارمذ', 'خرداد',
    'مرداد', 'دی‌باذکر', 'آذر', 'آبان', 'خورشید', 'ماه', 'تیر', 'گوش',
    'دی‌بمهر', 'مهر', 'سروش', 'رشن', 'فروردین', 'ورهرام', 'رام',
    'باد', 'دی‌بدین', 'دین', 'ارد', 'اشتاد', 'آسمان', 'زامیاد',
    'منشترسپند', 'انیرام',
  ],
};

export const ANDARJAH_LABEL: Record<'en' | 'ja' | 'fa', string> = {
  en: 'Andarjah',
  ja: 'アンダルジャ',
  fa: 'اندارج',
};

/** Convert a Gregorian date to the Imperial calendar date */
export function gregorianToImperial(g: SimpleDate): ImperialDate {
  // Jalali year containing g
  const jdn = toJdn(g);
  // find Jalali year: try candidates around estimate
  const estJy = Math.floor((jdn - g2d(2007, 3, 21)) / 365.2425) + 1386;
  let jy = estJy;
  let anchor = farvardin1Jdn(jy);
  if (jdn < anchor) {
    jy -= 1;
    anchor = farvardin1Jdn(jy);
  } else if (jdn >= anchor + (isJyLeap(jy) ? 366 : 365)) {
    jy += 1;
    anchor = farvardin1Jdn(jy);
  }
  const offset = jdn - anchor; // 0-based day of the Jalali year
  const iy = jy + IMPERIAL_EPOCH_OFFSET; // Shahanshahi = Jalali + 1180
  if (offset >= 360) {
    return { year: iy, month: 13, day: offset - 360 + 1 };
  }
  const month = Math.floor(offset / 30) + 1;
  const day = (offset % 30) + 1;
  return { year: iy, month, day, dayNameIndex: day - 1 };
}

function isJyLeap(jy: number): boolean {
  const far1 = farvardin1Jdn(jy);
  return farvardin1Jdn(jy + 1) - far1 === 366;
}

/** Shahanshahi = Jalali + 1180 (Farvardin 1, 1355 AP = 2535). */
export const IMPERIAL_EPOCH_OFFSET = 1180;

/** Imperial -> Gregorian (for navigation) */
export function imperialToGregorian(i: ImperialDate): SimpleDate {
  // Imperial year -> underlying Jalali year, then its Farvardin 1 anchor
  const jy = i.year - IMPERIAL_EPOCH_OFFSET;
  const anchor = farvardin1Jdn(jy);
  if (i.month === 13) return d2g(anchor + 360 + i.day - 1);
  return d2g(anchor + (i.month - 1) * 30 + i.day - 1);
}

/** Imperial month names reuse the shared Persian month names (same roots). */
export function imperialMonthLengths(_y: number): number[] {
  return Array(12).fill(30);
}
