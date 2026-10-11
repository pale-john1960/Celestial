package com.celestial.calendar.engine

/**
 * Celestial — plain (non-Compose) date formatting helpers shared by the UI,
 * the home-screen widgets and the status-bar notification.
 *
 * Round 14: every date string is composed LOCALE-AWARE (web parity with the
 * composeDate/activeDateText helpers in src/components/celestial/HeroHeader.tsx):
 *  - en: "March 21, 2026 CE" (Month Day, Year Era — unchanged)
 *  - ja: "2026年3月21日 西暦" (Gregorian months are "3月", so the 年/月/日
 *    frame comes from the composition itself; Jalali months are katakana →
 *    "1405年メフル29日 ヒジュラ太陽暦")
 *  - fa: "۲۱ مارس ۲۰۲۶ میلادی" (day BEFORE month — Persian reads day-first;
 *    digits via [I18n.num])
 *
 * Era labels live here (not only in strings.xml) because RemoteViews and the
 * notification build text outside of Compose. Values mirror the web dict keys
 * eraGregorian / eraJalali / eraImperial / eraAncient / hijriLabel.
 */
object DateFormats {

    private data class EraLabels(
        val gregorian: String,
        val jalali: String,
        val imperial: String,
        val ancient: String,
    )

    private val eras: Map<AppLocale, EraLabels> = mapOf(
        AppLocale.EN to EraLabels("CE", "SH", "Imperial", "Ancient era"),
        AppLocale.JA to EraLabels("西暦", "ヒジュラ太陽暦", "帝国暦", "古代"),
        AppLocale.FA to EraLabels("میلادی", "هجری شمسی", "شاهنشاهی", "باستان"),
    )

    private val hijriLabels: Map<AppLocale, String> = mapOf(
        AppLocale.EN to "AH",
        AppLocale.JA to "ヒジュラ暦",
        AppLocale.FA to "هجری قمری",
    )

    fun eraGregorian(locale: AppLocale): String = eras[locale]?.gregorian ?: "CE"
    fun eraJalali(locale: AppLocale): String = eras[locale]?.jalali ?: "SH"
    fun eraImperial(locale: AppLocale): String = eras[locale]?.imperial ?: "Imperial"
    fun eraAncient(locale: AppLocale): String = eras[locale]?.ancient ?: "Ancient era"
    fun hijriLabel(locale: AppLocale): String = hijriLabels[locale] ?: "AH"

    /** Era label of the ACTIVE system (imperialSolar shares eraImperial). */
    fun eraOfSystem(system: CalendarSystem, locale: AppLocale): String = when (system) {
        CalendarSystem.GREGORIAN -> eraGregorian(locale)
        CalendarSystem.JALALI -> eraJalali(locale)
        CalendarSystem.ANCIENT -> eraAncient(locale)
        CalendarSystem.IMPERIAL, CalendarSystem.IMPERIAL_SOLAR -> eraImperial(locale)
    }

    /**
     * Locale-ordered date composition (round 14) — every locale used to render
     * "Month Day, Year Era", producing e.g. "مهر ۲۹" in Persian.
     */
    private fun composeDate(
        locale: AppLocale,
        year: String,
        month: String,
        day: String,
        era: String,
    ): String = when (locale) {
        AppLocale.JA -> "${year}年${month}${day}日 $era"
        AppLocale.FA -> "$day $month $year $era"
        else -> "$month $day, $year $era"
    }

    /**
     * Locale-aware "weekday + date" composition for list headers and dialogs
     * (round 14 — the agenda used to show the truncated "چهار"):
     *  - en / fa: "چهارشنبه · ۲۹ مهر ۱۴۰۵ هجری شمسی" (weekday first, ·)
     *  - ja: "2026年10月29日（水曜日）" (date first, weekday in full-width parens)
     */
    fun weekdayDateText(locale: AppLocale, weekday: Int, dateText: String): String =
        if (locale == AppLocale.JA) {
            "$dateText（${I18n.weekdayLong(locale, weekday)}）"
        } else {
            "${I18n.weekdayLong(locale, weekday)} · $dateText"
        }

    /** Day number in the ACTIVE system (localized digits). */
    fun dayNumber(
        system: CalendarSystem,
        locale: AppLocale,
        date: CelestialDate,
    ): String = I18n.num(locale, CalendarFacade.systemTripleOf(system, date).day)

    /**
     * Small secondary number (web round-14 rule): gregorian mode shows the
     * Jalali day; every non-Gregorian system shows the Gregorian day.
     */
    fun secondaryDayNumber(system: CalendarSystem, locale: AppLocale, date: CelestialDate): String =
        when (system) {
            CalendarSystem.GREGORIAN -> I18n.num(locale, date.jalali.day)
            else -> I18n.num(locale, date.gregorian.day)
        }

    /** "Mehr" / "October" — month name in the active system (royal-names aware). */
    fun monthName(
        system: CalendarSystem,
        locale: AppLocale,
        date: CelestialDate,
        royal: Boolean = false,
    ): String {
        val triple = CalendarFacade.systemTripleOf(system, date)
        return CalendarFacade.systemMonthName(system, locale, triple.month, royal)
    }

    fun monthNameOf(
        system: CalendarSystem,
        locale: AppLocale,
        year: Int,
        month: Int,
        royal: Boolean = false,
    ): String = CalendarFacade.systemMonthName(system, locale, month, royal)

    /** "Mehr 1405" — month + year in the active system (localized digits). */
    fun systemMonthYear(
        system: CalendarSystem,
        locale: AppLocale,
        date: CelestialDate,
        royal: Boolean = false,
    ): String {
        val t = CalendarFacade.systemTripleOf(system, date)
        return "${CalendarFacade.systemMonthName(system, locale, t.month, royal)} ${I18n.num(locale, t.year)}"
    }

    fun systemMonthYearEra(
        system: CalendarSystem,
        locale: AppLocale,
        date: CelestialDate,
        royal: Boolean = false,
    ): String =
        "${systemMonthYear(system, locale, date, royal)} ${eraOfSystem(system, locale)}"

    /** "October 2026 CE" */
    fun gregorianMonthYearEra(locale: AppLocale, date: CelestialDate): String =
        "${I18n.gregorianMonthName(locale, date.gregorian.month)} ${I18n.num(locale, date.gregorian.year)} ${eraGregorian(locale)}"

    /** "Mehr 1405 SH" */
    fun jalaliMonthYearEra(locale: AppLocale, date: CelestialDate): String =
        "${I18n.jalaliMonthName(locale, date.jalali.month)} ${I18n.num(locale, date.jalali.year)} ${eraJalali(locale)}"

    /** "Mehr 1405 Imperial" */
    fun imperialMonthYearEra(locale: AppLocale, date: CelestialDate): String =
        "${I18n.jalaliMonthName(locale, date.imperial.month)} ${I18n.num(locale, date.imperial.year)} ${eraImperial(locale)}"

    /** "Rabiʿ II 1448 AH" */
    fun hijriMonthYearEra(locale: AppLocale, date: CelestialDate): String =
        "${I18n.hijriMonthName(locale, date.hijri.month)} ${I18n.num(locale, date.hijri.year)} ${hijriLabel(locale)}"

    /**
     * Full long date in the ACTIVE system, locale-ordered — the 5-system
     * formatter (web activeDateText): e.g. "October 12, 2026 CE",
     * "2026年10月12日 西暦", "۱۲ مهر ۱۴۰۵ هجری شمسی".
     * [royal] = the royalMonthNames setting (imperial/imperialSolar only).
     */
    fun fullSystemDate(
        system: CalendarSystem,
        locale: AppLocale,
        date: CelestialDate,
        royal: Boolean = false,
    ): String {
        val t = CalendarFacade.systemTripleOf(system, date)
        return composeDate(
            locale,
            I18n.num(locale, t.year),
            CalendarFacade.systemMonthName(system, locale, t.month, royal),
            I18n.num(locale, t.day),
            eraOfSystem(system, locale),
        )
    }

    fun fullGregorian(locale: AppLocale, date: CelestialDate): String =
        composeDate(
            locale,
            I18n.num(locale, date.gregorian.year),
            I18n.gregorianMonthName(locale, date.gregorian.month),
            I18n.num(locale, date.gregorian.day),
            eraGregorian(locale),
        )

    fun fullJalali(locale: AppLocale, date: CelestialDate): String =
        composeDate(
            locale,
            I18n.num(locale, date.jalali.year),
            I18n.jalaliMonthName(locale, date.jalali.month),
            I18n.num(locale, date.jalali.day),
            eraJalali(locale),
        )

    /** Imperial-family structural date (12×30 + Andarjah); [era]/[royal] let
     *  the ANCIENT system render with the ancient era + names. */
    fun fullImperial(
        locale: AppLocale,
        date: CelestialDate,
        era: String = eraImperial(locale),
        royal: Boolean = false,
    ): String {
        val month = if (royal && date.imperial.month in 1..12) {
            I18n.ancientMonthName(locale, date.imperial.month)
        } else {
            I18n.jalaliMonthName(locale, date.imperial.month) // 13 → Andarjah label
        }
        return composeDate(
            locale,
            I18n.num(locale, date.imperial.year),
            month,
            I18n.num(locale, date.imperial.day),
            era,
        )
    }

    fun fullHijri(locale: AppLocale, date: CelestialDate): String =
        composeDate(
            locale,
            I18n.num(locale, date.hijri.year),
            I18n.hijriMonthName(locale, date.hijri.month),
            I18n.num(locale, date.hijri.day),
            hijriLabel(locale),
        )

    fun weekdayLong(locale: AppLocale, date: CelestialDate): String =
        I18n.weekdayLong(locale, date.weekday)

    fun weekdayShort(locale: AppLocale, date: CelestialDate): String =
        I18n.weekdayShort(locale, date.weekday)
}
