package com.celestial.calendar.engine

/**
 * Celestial — plain (non-Compose) date formatting helpers shared by the UI,
 * the home-screen widgets and the status-bar notification.
 *
 * Era labels live here (not only in strings.xml) because RemoteViews and the
 * notification build text outside of Compose. Values mirror the web dict keys
 * eraGregorian / eraJalali / eraImperial / hijriLabel.
 */
object DateFormats {

    private val eras: Map<AppLocale, Triple<String, String, String>> = mapOf(
        // (gregorian, jalali, imperial)
        AppLocale.EN to Triple("CE", "SH", "Imperial"),
        AppLocale.JA to Triple("西暦", "ヒジュラ太陽暦", "帝国暦"),
        AppLocale.FA to Triple("میلادی", "هجری شمسی", "شاهنشاهی"),
    )

    private val hijriLabels: Map<AppLocale, String> = mapOf(
        AppLocale.EN to "AH",
        AppLocale.JA to "ヒジュラ暦",
        AppLocale.FA to "هجری قمری",
    )

    fun eraGregorian(locale: AppLocale): String = eras[locale]?.first ?: "CE"
    fun eraJalali(locale: AppLocale): String = eras[locale]?.second ?: "SH"
    fun eraImperial(locale: AppLocale): String = eras[locale]?.third ?: "Imperial"
    fun hijriLabel(locale: AppLocale): String = hijriLabels[locale] ?: "AH"

    /** Day number in the ACTIVE system (localized digits). */
    fun dayNumber(system: CalendarSystem, locale: AppLocale, date: CelestialDate): String = when (system) {
        CalendarSystem.GREGORIAN -> I18n.num(locale, date.gregorian.day)
        CalendarSystem.JALALI -> I18n.num(locale, date.jalali.day)
        CalendarSystem.IMPERIAL -> I18n.num(locale, date.imperial.day)
    }

    /**
     * Small secondary number: jalali mode shows the Gregorian day and vice
     * versa; imperial mode shows the Jalali day.
     */
    fun secondaryDayNumber(system: CalendarSystem, locale: AppLocale, date: CelestialDate): String =
        when (system) {
            CalendarSystem.GREGORIAN -> I18n.num(locale, date.jalali.day)
            CalendarSystem.JALALI -> I18n.num(locale, date.gregorian.day)
            CalendarSystem.IMPERIAL -> I18n.num(locale, date.jalali.day)
        }

    /** "Mehr" / "October" — month name in the active system. */
    fun monthName(system: CalendarSystem, locale: AppLocale, date: CelestialDate): String = when (system) {
        CalendarSystem.GREGORIAN -> I18n.gregorianMonthName(locale, date.gregorian.month)
        CalendarSystem.JALALI -> I18n.jalaliMonthName(locale, date.jalali.month)
        CalendarSystem.IMPERIAL -> I18n.jalaliMonthName(locale, date.imperial.month)
    }

    fun monthNameOf(system: CalendarSystem, locale: AppLocale, year: Int, month: Int): String = when (system) {
        CalendarSystem.GREGORIAN -> I18n.gregorianMonthName(locale, month)
        else -> I18n.jalaliMonthName(locale, month) // Jalali + Imperial share month roots
    }

    /** "Mehr 1405" — month + year in the active system (localized digits). */
    fun systemMonthYear(system: CalendarSystem, locale: AppLocale, date: CelestialDate): String {
        val (y, m) = when (system) {
            CalendarSystem.GREGORIAN -> date.gregorian.year to date.gregorian.month
            CalendarSystem.JALALI -> date.jalali.year to date.jalali.month
            CalendarSystem.IMPERIAL -> date.imperial.year to date.imperial.month
        }
        return "${I18n.jalaliOrGregorianMonth(system, locale, m)} ${I18n.num(locale, y)}"
    }

    fun systemMonthYearEra(system: CalendarSystem, locale: AppLocale, date: CelestialDate): String {
        val era = when (system) {
            CalendarSystem.GREGORIAN -> eraGregorian(locale)
            CalendarSystem.JALALI -> eraJalali(locale)
            CalendarSystem.IMPERIAL -> eraImperial(locale)
        }
        return "${systemMonthYear(system, locale, date)} $era"
    }

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

    /** Full long date in the active system, e.g. "14 Mehr 1405 SH" or "October 12, 2026 CE". */
    fun fullSystemDate(system: CalendarSystem, locale: AppLocale, date: CelestialDate): String = when (system) {
        CalendarSystem.GREGORIAN ->
            "${I18n.gregorianMonthName(locale, date.gregorian.month)} ${I18n.num(locale, date.gregorian.day)}, " +
                    "${I18n.num(locale, date.gregorian.year)} ${eraGregorian(locale)}"
        CalendarSystem.JALALI ->
            "${I18n.num(locale, date.jalali.day)} ${I18n.jalaliMonthName(locale, date.jalali.month)} " +
                    "${I18n.num(locale, date.jalali.year)} ${eraJalali(locale)}"
        CalendarSystem.IMPERIAL ->
            "${I18n.num(locale, date.imperial.day)} ${I18n.jalaliMonthName(locale, date.imperial.month)} " +
                    "${I18n.num(locale, date.imperial.year)} ${eraImperial(locale)}"
    }

    fun fullGregorian(locale: AppLocale, date: CelestialDate): String =
        "${I18n.gregorianMonthName(locale, date.gregorian.month)} ${I18n.num(locale, date.gregorian.day)}, " +
                "${I18n.num(locale, date.gregorian.year)} ${eraGregorian(locale)}"

    fun fullJalali(locale: AppLocale, date: CelestialDate): String =
        "${I18n.num(locale, date.jalali.day)} ${I18n.jalaliMonthName(locale, date.jalali.month)} " +
                "${I18n.num(locale, date.jalali.year)} ${eraJalali(locale)}"

    fun fullImperial(locale: AppLocale, date: CelestialDate): String =
        "${I18n.num(locale, date.imperial.day)} ${I18n.jalaliMonthName(locale, date.imperial.month)} " +
                "${I18n.num(locale, date.imperial.year)} ${eraImperial(locale)}"

    fun fullHijri(locale: AppLocale, date: CelestialDate): String =
        "${I18n.num(locale, date.hijri.day)} ${I18n.hijriMonthName(locale, date.hijri.month)} " +
                "${I18n.num(locale, date.hijri.year)} ${hijriLabel(locale)}"

    fun weekdayLong(locale: AppLocale, date: CelestialDate): String =
        I18n.weekdayLong(locale, date.weekday)

    fun weekdayShort(locale: AppLocale, date: CelestialDate): String =
        I18n.weekdayShort(locale, date.weekday)
}

private fun I18n.jalaliOrGregorianMonth(system: CalendarSystem, locale: AppLocale, month: Int): String =
    when (system) {
        CalendarSystem.GREGORIAN -> gregorianMonthName(locale, month)
        else -> jalaliMonthName(locale, month)
    }
