package com.celestial.calendar.engine

import android.icu.util.IslamicCalendar
import android.icu.util.TimeZone
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.GregorianCalendar

/**
 * Celestial — Hijri (Islamic lunar) conversions via `android.icu.util.IslamicCalendar`.
 *
 * The CIVIL (tabular / "Kuwaiti") variant is used — `setCalculationType(ISLAMIC_CIVIL)` —
 * which matches CLDR `islamic-civil`. Note:
 *  * The web engine uses ICU `islamic-umalqura` (Umm al-Qura tables). The two
 *    calendars occasionally differ by ±1 day around a month boundary.
 *  * Iranian official dates depend on moon sighting and may shift ±1 day
 *    from either tabular or Umm al-Qura calendars.
 * So religious-event dates shown in the app are an approximation; users
 * should confirm critical dates with an official source.
 *
 * All conversions run at 12:00 UTC of the Gregorian day to stay clear of
 * day-boundary effects; both calendars operate in UTC.
 */
object HijriEngine {

    private val utc: TimeZone by lazy { TimeZone.getTimeZone("UTC") }

    private fun newCivilCalendar(): IslamicCalendar {
        val cal = IslamicCalendar(utc)
        cal.clear()
        // CIVIL variant (tabular) — android.icu's API is setCalculationType
        // (there is no isCivil property setter on android.icu.util.IslamicCalendar)
        cal.setCalculationType(IslamicCalendar.CalculationType.ISLAMIC_CIVIL)
        return cal
    }

    /** Gregorian -> Hijri (via UTC noon to avoid boundary effects). */
    fun gregorianToHijri(g: SimpleDate): HijriDate {
        val cal = newCivilCalendar()
        cal.timeInMillis = noonUtcMillis(g)
        return HijriDate(
            year = cal.get(IslamicCalendar.YEAR),
            month = cal.get(IslamicCalendar.MONTH) + 1,
            day = cal.get(IslamicCalendar.DAY_OF_MONTH),
        )
    }

    /** Hijri -> Gregorian. */
    fun hijriToGregorian(h: HijriDate): SimpleDate {
        val cal = newCivilCalendar()
        cal.set(IslamicCalendar.YEAR, h.year)
        cal.set(IslamicCalendar.MONTH, h.month - 1)
        cal.set(IslamicCalendar.DAY_OF_MONTH, h.day)
        val millis = cal.timeInMillis
        val gc = GregorianCalendar(java.util.TimeZone.getTimeZone("UTC"))
        gc.clear()
        gc.timeInMillis = millis
        return SimpleDate(
            gc.get(GregorianCalendar.YEAR),
            gc.get(GregorianCalendar.MONTH) + 1,
            gc.get(GregorianCalendar.DAY_OF_MONTH),
        )
    }

    private fun noonUtcMillis(g: SimpleDate): Long =
        LocalDate.of(g.year, g.month, g.day)
            .atTime(12, 0)
            .toInstant(ZoneOffset.UTC)
            .toEpochMilli()

    private fun millisToUtcDate(millis: Long): SimpleDate {
        val d = Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate()
        return SimpleDate(d.year, d.monthValue, d.dayOfMonth)
    }
}
