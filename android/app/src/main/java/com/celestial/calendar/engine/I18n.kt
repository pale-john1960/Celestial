package com.celestial.calendar.engine

/**
 * Celestial — trilingual name data used directly by the engine, widgets and UI
 * (Kotlin port of `src/lib/i18n/index.ts` arrays + Hijri month names).
 *
 * UI labels live in `res/values{,-ja,-fa}/strings.xml`; these arrays are the
 * data the engine itself needs (month/weekday names, Persian digits), mirroring
 * the web app's i18n module.
 */
object I18n {

    val gregorianMonths: Map<AppLocale, List<String>> = mapOf(
        AppLocale.EN to listOf(
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ),
        AppLocale.JA to listOf(
            "1月", "2月", "3月", "4月", "5月", "6月",
            "7月", "8月", "9月", "10月", "11月", "12月",
        ),
        AppLocale.FA to listOf(
            "ژانویه", "فوریه", "مارس", "آپریل", "مه", "ژوئن",
            "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
        ),
    )

    val jalaliMonths: Map<AppLocale, List<String>> = mapOf(
        AppLocale.EN to listOf(
            "Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar",
            "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand",
        ),
        AppLocale.JA to listOf(
            "ファルヴァルディーン", "オルディーベヘシュト", "ホルダード", "ティール", "モルダード", "シャフリヴァール",
            "メフル", "アーバーン", "アーザル", "デイ", "バフマン", "エスファンド",
        ),
        AppLocale.FA to listOf(
            "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
        ),
    )

    /** Hijri month names (for the AH secondary line — the web app formats these via Intl). */
    val hijriMonths: Map<AppLocale, List<String>> = mapOf(
        AppLocale.EN to listOf(
            "Muharram", "Safar", "Rabiʿ I", "Rabiʿ II", "Jumada I", "Jumada II",
            "Rajab", "Shaʿban", "Ramadan", "Shawwal", "Dhu al-Qiʿda", "Dhu al-Hijja",
        ),
        AppLocale.JA to listOf(
            "ムハッラム", "サファル", "ラビー・アル=アウワル", "ラビー・アッ=サーニー", "ジュマーダー・アル=ウーラー", "ジュマーダー・アッ=サーニー",
            "ラジャブ", "シャアバーン", "ラマダーン", "シャワール", "ズー・アル=カアダ", "ズー・アル=ヒッジャ",
        ),
        AppLocale.FA to listOf(
            "محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی",
            "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه",
        ),
    )

    /** Weekday names by JS index: 0 = Sunday … 6 = Saturday. */
    val weekdaysShort: Map<AppLocale, List<String>> = mapOf(
        AppLocale.EN to listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"),
        AppLocale.JA to listOf("日", "月", "火", "水", "木", "金", "土"),
        AppLocale.FA to listOf("یک", "دو", "سه", "چهار", "پنج", "جمعه", "شنبه"),
    )

    val weekdaysLong: Map<AppLocale, List<String>> = mapOf(
        AppLocale.EN to listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"),
        AppLocale.JA to listOf("日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"),
        AppLocale.FA to listOf("یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"),
    )

    private val faDigits = arrayOf('۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹')

    fun gregorianMonthName(locale: AppLocale, month: Int): String =
        gregorianMonths[locale]?.getOrNull(month - 1) ?: ""

    /** Jalali month name (also used for Imperial months — same roots; 13 = Andarjah). */
    fun jalaliMonthName(locale: AppLocale, month: Int): String = when (month) {
        13 -> andarjahLabel(locale)
        else -> jalaliMonths[locale]?.getOrNull(month - 1) ?: ""
    }

    /** Ancient Zoroastrian month name (royal names — 1..12; see
     *  [ImperialEngine.ANCIENT_MONTH_NAMES]). */
    fun ancientMonthName(locale: AppLocale, month: Int): String =
        ImperialEngine.ANCIENT_MONTH_NAMES[locale]?.getOrNull(month - 1) ?: ""

    fun hijriMonthName(locale: AppLocale, month: Int): String =
        hijriMonths[locale]?.getOrNull(month - 1) ?: ""

    fun weekdayShort(locale: AppLocale, weekday: Int): String =
        weekdaysShort[locale]?.getOrNull(weekday) ?: ""

    fun weekdayLong(locale: AppLocale, weekday: Int): String =
        weekdaysLong[locale]?.getOrNull(weekday) ?: ""

    fun imperialDayName(locale: AppLocale, index: Int): String =
        ImperialEngine.IMPERIAL_DAY_NAMES[locale]?.getOrNull(index) ?: ""

    fun andarjahLabel(locale: AppLocale): String =
        ImperialEngine.ANDARJAH_LABEL[locale] ?: "Andarjah"

    /** Localized digits (Persian uses ۰-۹). */
    fun num(locale: AppLocale, n: Int): String = num(locale, n.toString())

    fun num(locale: AppLocale, n: String): String {
        if (locale != AppLocale.FA) return n
        return n.map { c -> if (c in '0'..'9') faDigits[c - '0'] else c }.joinToString("")
    }
}
