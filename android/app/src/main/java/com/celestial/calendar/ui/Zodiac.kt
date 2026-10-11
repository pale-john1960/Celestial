package com.celestial.calendar.ui

/**
 * Celestial — Persian zodiac month data (Task 10 parity with the web app).
 *
 * The Jalali month names derive from the zodiac constellations the sun
 * enters during each month, so every Jalali month maps to a sign. The
 * month-view header shows a small chip with the displayed month's glyph +
 * localized sign name ([CommonUi.ZodiacChip]). Same shared data table as
 * the web implementation:
 *
 * ```
 * Jalali month 1 Farvardin    ♈ Aries       牡羊座    حمل
 *              2 Ordibehesht  ♉ Taurus       牡牛座    ثور
 *              3 Khordad      ♊ Gemini       双子座    جوزا
 *              4 Tir          ♋ Cancer       蟹座      سرطان
 *              5 Mordad       ♌ Leo          獅子座    اسد
 *              6 Shahrivar    ♍ Virgo        乙女座    سنبله
 *              7 Mehr         ♎ Libra        天秤座    میزان
 *              8 Aban         ♏ Scorpio      蠍座      عقرب
 *              9 Azar         ♐ Sagittarius  射手座    قوس
 *             10 Dey          ♑ Capricorn    山羊座    جدی
 *             11 Bahman       ♒ Aquarius     水瓶座    دلو
 *             12 Esfand       ♓ Pisces       魚座      حوت
 * ```
 *
 * The glyphs are the exact Unicode run U+2648..U+2653 (♈..♓) — the same
 * code points [com.celestial.calendar.engine.SolsticeEngine] already uses
 * for its season markers, so they render in the app's text stack.
 */
private val ZodiacGlyphs = arrayOf(
    "♈", // 1 Farvardin — Aries
    "♉", // 2 Ordibehesht — Taurus
    "♊", // 3 Khordad — Gemini
    "♋", // 4 Tir — Cancer
    "♌", // 5 Mordad — Leo
    "♍", // 6 Shahrivar — Virgo
    "♎", // 7 Mehr — Libra
    "♏", // 8 Aban — Scorpio
    "♐", // 9 Azar — Sagittarius
    "♑", // 10 Dey — Capricorn
    "♒", // 11 Bahman — Aquarius
    "♓", // 12 Esfand — Pisces
)

/** Zodiac glyph (U+2648..U+2653) for a Jalali month 1-12; "" when out of range. */
fun zodiacGlyph(jalaliMonth: Int): String = ZodiacGlyphs.getOrNull(jalaliMonth - 1) ?: ""

/** Localized zodiac sign name for a Jalali month 1-12; "" when out of range. */
fun zodiacName(strings: LocalStrings, jalaliMonth: Int): String = strings.zodiacName(jalaliMonth)
