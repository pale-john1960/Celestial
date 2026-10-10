// Celestial — i18n facade
import type { LocaleCode } from './types';
import { en, enGregorianMonths, enJalaliMonths, enWeekdaysLong, enWeekdaysShort } from './en';
import { ja, jaGregorianMonths, jaJalaliMonths, jaWeekdaysLong, jaWeekdaysShort } from './ja';
import { fa, faGregorianMonths, faJalaliMonths, faWeekdaysLong, faWeekdaysShort } from './fa';
import type { LocaleDict } from './types';

export type { LocaleDict, LocaleCode } from './types';
export { en, ja, fa };

const dicts: Record<LocaleCode, LocaleDict> = { en, ja, fa };
const gMonths: Record<LocaleCode, string[]> = {
  en: enGregorianMonths, ja: jaGregorianMonths, fa: faGregorianMonths,
};
const jMonths: Record<LocaleCode, string[]> = {
  en: enJalaliMonths, ja: jaJalaliMonths, fa: faJalaliMonths,
};
const wdShort: Record<LocaleCode, string[]> = {
  en: enWeekdaysShort, ja: jaWeekdaysShort, fa: faWeekdaysShort,
};
const wdLong: Record<LocaleCode, string[]> = {
  en: enWeekdaysLong, ja: jaWeekdaysLong, fa: faWeekdaysLong,
};

export function getDict(locale: LocaleCode): LocaleDict {
  return dicts[locale] ?? en;
}

export const locales: LocaleCode[] = ['en', 'ja', 'fa'];

/** Gregorian month name in locale */
export function gregorianMonthName(locale: LocaleCode, month: number): string {
  return gMonths[locale][month - 1] ?? '';
}

/** Jalali month name in locale (also used for Imperial months — same roots) */
export function jalaliMonthName(locale: LocaleCode, month: number): string {
  if (month === 13) {
    return locale === 'fa' ? 'اندارج' : locale === 'ja' ? 'アンダルジャ' : 'Andarjah';
  }
  return jMonths[locale][month - 1] ?? '';
}

export function weekdayShort(locale: LocaleCode, weekday: number): string {
  return wdShort[locale][weekday] ?? '';
}

export function weekdayLong(locale: LocaleCode, weekday: number): string {
  return wdLong[locale][weekday] ?? '';
}

/** Localized digits (Persian uses ۰-۹) */
export function num(locale: LocaleCode, n: number | string): string {
  if (locale !== 'fa') return String(n);
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, (d) => faDigits[Number(d)]);
}

export function yearNum(locale: LocaleCode, y: number): string {
  return num(locale, y);
}
