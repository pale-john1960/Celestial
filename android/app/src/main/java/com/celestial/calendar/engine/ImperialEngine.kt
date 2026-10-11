package com.celestial.calendar.engine

import kotlin.math.floor

/**
 * Celestial — Persian Imperial (Shahanshahi) calendar.
 *
 * Shahanshahi era: Cyrus the Great's coronation 559 BCE (Wikipedia:
 * Shahanshahi calendar / Iranian calendars). Year = Jalali + 1180;
 * Farvardin 1, 1355 AP = 2535 — the official conversion introduced by the
 * 1976 Pahlavi reform (1355 AP became 2535 Imperial). So Nowruz 2026
 * (1405 AP) is Imperial year 2585.
 *
 * Month/day structure (Fasli-aligned, unchanged): 12 fixed 30-day months +
 * 5(6) Andarjah epagomenal days at the end of the year (6 in Jalali leap
 * years). Each day carries one of the 30 devotional day names (the cycle
 * repeats every month).
 *
 * Kotlin port of `src/lib/calendar/imperial.ts`.
 */
object ImperialEngine {

    /** Shahanshahi = Jalali + 1180 (Farvardin 1, 1355 AP = 2535). */
    const val IMPERIAL_EPOCH_OFFSET = 1180


    val IMPERIAL_DAY_NAMES: Map<AppLocale, List<String>> = mapOf(
        AppLocale.EN to listOf(
            "Ormazd", "Bahman", "Ardibehesht", "Shahrivar", "Esfandarmuz", "Khordad",
            "Mordad", "Dey-be-Azar", "Azar", "Aban", "Khwarshid", "Mah", "Tir", "Gush",
            "Dey-be-Mehr", "Mehr", "Srosh", "Rashn", "Farvardin", "Varahram", "Ram",
            "Bad", "Dey-be-Din", "Din", "Ard", "Ashtad", "Asman", "Zamyad",
            "Mantraspand", "Aniram",
        ),
        AppLocale.JA to listOf(
            "オルマズド", "バフマン", "アルディベヘシュト", "シャフリヴァール", "エスファンダルムズ", "ホルダード",
            "モルダード", "ディー・パー・アーザル", "アーザル", "アーバーン", "ファルシェド", "マーフ", "ティール", "グーシュ",
            "ディー・パー・ミスラ", "メフル", "スルーシュ", "ラシュヌ", "ファルヴァルディーン", "ヴァラフラーム", "ラーム",
            "ヴァード", "ディー・パー・ディーン", "ディーン", "アルド", "アシュタード", "アースマーン", "ザーミヤード",
            "マントラスペンド", "アニーラーム",
        ),
        AppLocale.FA to listOf(
            "اورمزد", "بهمن", "اردیبهشت", "شهریور", "اسفندارمذ", "خرداد",
            "مرداد", "دی‌باذکر", "آذر", "آبان", "خورشید", "ماه", "تیر", "گوش",
            "دی‌بمهر", "مهر", "سروش", "رشن", "فروردین", "ورهرام", "رام",
            "باد", "دی‌بدین", "دین", "ارد", "اشتاد", "آسمان", "زامیاد",
            "منشترسپند", "انیرام",
        ),
    )

    val ANDARJAH_LABEL: Map<AppLocale, String> = mapOf(
        AppLocale.EN to "Andarjah",
        AppLocale.JA to "アンダルジャ",
        AppLocale.FA to "اندارج",
    )

    /**
     * Ancient Zoroastrian (royal) month names — the "reformed" modern
     * spellings differ: امرداد vs مرداد (Amordad), اسپندارمذ vs اسفند
     * (Spandarmad). Used by the ANCIENT system (always) and by
     * IMPERIAL/IMPERIAL_SOLAR when the royalMonthNames setting is ON.
     * Month 13 (Andarjah) keeps its own label. (Round 14 — verbatim from the
     * web's ANCIENT_MONTH_NAMES in src/lib/calendar/imperial.ts.)
     */
    val ANCIENT_MONTH_NAMES: Map<AppLocale, List<String>> = mapOf(
        AppLocale.EN to listOf(
            "Farvardin", "Ardibehesht", "Khordad", "Tir", "Amordad", "Shahrivar",
            "Mehr", "Aban", "Azar", "Dey", "Bahman", "Spandarmad",
        ),
        AppLocale.JA to listOf(
            "ファルヴァルディーン", "アルディーベヘシュト", "ホルダード", "ティール", "アモルダード", "シャフリヴァール",
            "メフル", "アーバーン", "アーザル", "デイ", "バフマン", "スプァンダルマド",
        ),
        AppLocale.FA to listOf(
            "فروردین", "اردیبهشت", "خرداد", "تیر", "امرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسپندارمذ",
        ),
    )

    private val EPOCH_JDN = Jdn.g2d(2007, 3, 21) // Farvardin 1, 1386 AP

    /** Convert a Gregorian date to the Imperial calendar date. */
    fun gregorianToImperial(g: SimpleDate): ImperialDate {
        val jdn = Jdn.toJdn(g)
        // find Jalali year: try candidates around estimate
        var jy = floor((jdn - EPOCH_JDN) / 365.2425).toInt() + 1386
        var anchor = JalaliEngine.farvardin1Jdn(jy)
        if (jdn < anchor) {
            jy -= 1
            anchor = JalaliEngine.farvardin1Jdn(jy)
        } else if (jdn >= anchor + (if (isJyLeap(jy)) 366 else 365)) {
            jy += 1
            anchor = JalaliEngine.farvardin1Jdn(jy)
        }
        val offset = jdn - anchor // 0-based day of the Jalali year
        val iy = jy + IMPERIAL_EPOCH_OFFSET // Shahanshahi = Jalali + 1180
        if (offset >= 360) {
            return ImperialDate(year = iy, month = 13, day = offset - 360 + 1, dayNameIndex = null)
        }
        val month = offset / 30 + 1
        val day = offset % 30 + 1
        return ImperialDate(year = iy, month = month, day = day, dayNameIndex = day - 1)
    }

    private fun isJyLeap(jy: Int): Boolean =
        JalaliEngine.farvardin1Jdn(jy + 1) - JalaliEngine.farvardin1Jdn(jy) == 366

    /** Imperial -> Gregorian (for navigation). */
    fun imperialToGregorian(i: ImperialDate): SimpleDate {
        // Imperial year -> underlying Jalali year, then its Farvardin 1 anchor
        val jy = i.year - IMPERIAL_EPOCH_OFFSET
        val anchor = JalaliEngine.farvardin1Jdn(jy)
        return if (i.month == 13) {
            Jdn.d2g(anchor + 360 + i.day - 1)
        } else {
            Jdn.d2g(anchor + (i.month - 1) * 30 + i.day - 1)
        }
    }

    /** Imperial month names reuse the shared Persian month names (same roots). */
    fun imperialMonthLengths(@Suppress("UNUSED_PARAMETER") y: Int): IntArray =
        IntArray(12) { 30 }
}
