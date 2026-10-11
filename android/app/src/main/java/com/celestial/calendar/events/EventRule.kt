package com.celestial.calendar.events

import com.celestial.calendar.engine.SimpleDate

/** Trilingual string pair (names/descriptions in en/ja/fa). */
data class L10n(val en: String, val ja: String, val fa: String) {
    fun forLocale(code: String): String = when (code) {
        "ja" -> ja
        "fa" -> fa
        else -> en
    }
}

enum class RuleKind {
    /** month/day in Gregorian */
    GREGORIAN_FIXED,

    /** nth weekday of Gregorian month */
    GREGORIAN_NTH_WEEKDAY,

    /** last weekday of Gregorian month */
    GREGORIAN_LAST_WEEKDAY,

    /** month/day in Jalali */
    JALALI_FIXED,

    /** last weekday of a Jalali month */
    JALALI_LAST_WEEKDAY,

    /** month/day in Hijri (lunar — shifts each year) */
    HIJRI_FIXED,
}

enum class EventCategory { INTERNATIONAL, US, JAPAN, PERSIAN_CULTURAL, PERSIAN_RELIGIOUS, PERSIAN_NATIONAL, IMPORTED }

enum class EventSource { BUILTIN, ONLINE, IMPORTED }

data class EventRule(
    val id: String,
    val category: EventCategory,
    val kind: RuleKind,
    val month: Int,          // 1-12
    val day: Int = 0,        // day (or nth/weekday anchor depending on kind)
    val weekday: Int? = null, // 0 = Sun … 6 = Sat for weekday-based kinds
    val nth: Int? = null,     // 1-5 for nth-weekday
    val isHoliday: Boolean = false, // legal day off (in its country context)
    val emoji: String,
    val names: L10n,
    val descriptions: L10n,
)

data class EventInstance(
    val id: String,           // ruleId + iso date
    val ruleId: String,
    val category: EventCategory,
    val iso: String,          // gregorian yyyy-mm-dd
    val gregorian: SimpleDate,
    val isHoliday: Boolean,
    val emoji: String,
    val names: L10n,
    val descriptions: L10n,
    val source: EventSource,
    val holidayOnly: Boolean = false, // hidden category but legal holiday → day-off only
    val manual: Boolean = false, // user-created event (sourceName == "manual") → ✍️
) {
    /** Localized name (holidayOnly instances must never expose their text). */
    fun localName(localeCode: String): String = names.forLocale(localeCode)
    fun localDescription(localeCode: String): String = descriptions.forLocale(localeCode)
}

/** Source toggles (mirrors the web `SourceSettings`, minus the online layer). */
data class SourceSettings(
    val international: Boolean = true,
    val us: Boolean = true,
    val japan: Boolean = true,
    val persianCultural: Boolean = true,
    val persianReligious: Boolean = true,
    val persianNational: Boolean = true,
    val imported: Boolean = true,
)
