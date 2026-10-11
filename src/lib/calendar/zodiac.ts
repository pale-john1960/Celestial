// Celestial — Persian zodiac month mapping (web counterpart of Android Zodiac.kt)
//
// SHARED DATA TABLE (byte-identical to the Android implementation, Task 10):
//   Jalali month 1 Farvardin    ♈ Aries       牡羊座    حمل
//                2 Ordibehesht  ♉ Taurus       牡牛座    ثور
//                3 Khordad      ♊ Gemini       双子座    جوزا
//                4 Tir          ♋ Cancer       蟹座      سرطان
//                5 Mordad       ♌ Leo          獅子座    اسد
//                6 Shahrivar    ♍ Virgo        乙女座    سنبله
//                7 Mehr         ♎ Libra        天秤座    میزان
//                8 Aban         ♏ Scorpio      蠍座      عقرب
//                9 Azar         ♐ Sagittarius  射手座    قوس
//               10 Dey          ♑ Capricorn    山羊座    جدی
//               11 Bahman       ♒ Aquarius     水瓶座    دلو
//               12 Esfand       ♓ Pisces       魚座      حوت
//
// Zodiac glyphs are the exact Unicode run U+2648..U+2653 in month order
// (♈ Aries … ♓ Pisces), always derived from code points — never hand-typed,
// so the run can never drift.
//
// Pure module — no React, no Node APIs. Runs identically client & server.

/** number of signs — guards the key table below (must stay 12) */
export const ZODIAC_COUNT = 12;

export type ZodiacKey =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

const ZODIAC_KEYS: readonly ZodiacKey[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

if (ZODIAC_KEYS.length !== ZODIAC_COUNT) {
  throw new Error(`zodiac: key table must have ${ZODIAC_COUNT} entries`);
}

export interface ZodiacInfo {
  /** zodiac glyph — U+2648 (Aries) + (month − 1) */
  glyph: string;
  /** stable key for the localized name lookup (dict.zodiac*) */
  key: ZodiacKey;
}

/**
 * Zodiac sign of a Jalali month (1-12). Returns null for out-of-range
 * months so callers can simply not render the chip (EventDots pattern).
 */
export function zodiacOf(jalaliMonth: number): ZodiacInfo | null {
  if (
    !Number.isInteger(jalaliMonth) ||
    jalaliMonth < 1 ||
    jalaliMonth > ZODIAC_COUNT
  ) {
    return null;
  }
  return {
    glyph: String.fromCodePoint(0x2647 + jalaliMonth),
    key: ZODIAC_KEYS[jalaliMonth - 1],
  };
}

/**
 * Localized sign name — moonPhaseName's structural-dict pattern (no import
 * of the full LocaleDict; any object with the 12 zodiac keys works).
 */
export function zodiacName(
  dict: {
    zodiacAries: string;
    zodiacTaurus: string;
    zodiacGemini: string;
    zodiacCancer: string;
    zodiacLeo: string;
    zodiacVirgo: string;
    zodiacLibra: string;
    zodiacScorpio: string;
    zodiacSagittarius: string;
    zodiacCapricorn: string;
    zodiacAquarius: string;
    zodiacPisces: string;
  },
  key: ZodiacKey,
): string {
  const names: Record<ZodiacKey, string> = {
    aries: dict.zodiacAries,
    taurus: dict.zodiacTaurus,
    gemini: dict.zodiacGemini,
    cancer: dict.zodiacCancer,
    leo: dict.zodiacLeo,
    virgo: dict.zodiacVirgo,
    libra: dict.zodiacLibra,
    scorpio: dict.zodiacScorpio,
    sagittarius: dict.zodiacSagittarius,
    capricorn: dict.zodiacCapricorn,
    aquarius: dict.zodiacAquarius,
    pisces: dict.zodiacPisces,
  };
  return names[key];
}
