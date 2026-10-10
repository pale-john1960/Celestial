package com.celestial.calendar.engine

import kotlin.math.floor

/**
 * Celestial — Persian Imperial (ancient royal / Zoroastrian) calendar.
 *
 * Kotlin port of `src/lib/calendar/imperial.ts`:
 * derived from the Jalali year anchor — 12 fixed 30-day months + 5 (6 in leap
 * years) Andarjah epagomenal days at the end of the year. Each day carries one
 * of the 30 devotional day names (the cycle repeats every month).
 */
object ImperialEngine {

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
        if (offset >= 360) {
            return ImperialDate(year = jy, month = 13, day = offset - 360 + 1, dayNameIndex = null)
        }
        val month = offset / 30 + 1
        val day = offset % 30 + 1
        return ImperialDate(year = jy, month = month, day = day, dayNameIndex = day - 1)
    }

    private fun isJyLeap(jy: Int): Boolean =
        JalaliEngine.farvardin1Jdn(jy + 1) - JalaliEngine.farvardin1Jdn(jy) == 366

    /** Imperial -> Gregorian (for navigation). */
    fun imperialToGregorian(i: ImperialDate): SimpleDate {
        val anchor = JalaliEngine.farvardin1Jdn(i.year)
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
