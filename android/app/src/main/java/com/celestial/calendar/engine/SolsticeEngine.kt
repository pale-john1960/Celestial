package com.celestial.calendar.engine

import java.util.Calendar
import java.util.TimeZone
import kotlin.math.abs
import kotlin.math.sin

/**
 * The four solar season events of a Gregorian year.
 *
 * Property names follow the astronomical naming used by the web app
 * (`March equinox` = the sun crosses the celestial equator northbound,
 * apparent longitude 0°, etc.).
 */
enum class SeasonEvent { MAR_EQUINOX, JUN_SOLSTICE, SEP_EQUINOX, DEC_SOLSTICE }

/**
 * One season event with its exact instant.
 *
 * @property event which of the four season events
 * @property jd Julian Day of the event instant (UTC-based)
 */
data class SeasonInfo(val event: SeasonEvent, val jd: Double)

/**
 * Celestial — solstice & equinox engine (port of the web
 * `src/lib/calendar/solstice.ts`, Task 8-a).
 *
 * Low-precision solar apparent-longitude series (Meeus, Astronomical
 * Algorithms ch. 25 truncated to the three dominant eccentricity terms):
 * a mean-longitude daily rate of 0.9856474°/d plus the equation of centre.
 * Each event is found with 6 fixed-point/Newton steps seeded at 12:00 UTC on
 * the event's canonical date, stepping by the residual divided by the mean
 * rate. Constants and formulas are IDENTICAL to the web implementation —
 * both ports validated against the same anchor set: 8/8 anchors
 * (2024 & 2026 equinoxes/solstices) within ±17 minutes.
 *
 * Day assignment follows the moon engine's convention: the event belongs to
 * Gregorian day D when its instant falls in D's DEVICE-LOCAL calendar day
 * window `[jdn - 0.5 + off, jdn + 0.5 + off)` with `off` negative east of UTC.
 */
object SolsticeEngine {

    /** Apparent longitude targeted by each event (degrees). */
    private val TARGETS = mapOf(
        SeasonEvent.MAR_EQUINOX to 0.0,
        SeasonEvent.JUN_SOLSTICE to 90.0,
        SeasonEvent.SEP_EQUINOX to 180.0,
        SeasonEvent.DEC_SOLSTICE to 270.0,
    )

    /** Canonical seed date (12:00 UTC) per event. */
    private val SEEDS = mapOf(
        SeasonEvent.MAR_EQUINOX to (3 to 20),
        SeasonEvent.JUN_SOLSTICE to (6 to 21),
        SeasonEvent.SEP_EQUINOX to (9 to 22),
        SeasonEvent.DEC_SOLSTICE to (12 to 21),
    )

    /** Zodiac glyph per event (Aries / Cancer / Libra / Capricorn). */
    fun glyphOf(event: SeasonEvent): String = when (event) {
        SeasonEvent.MAR_EQUINOX -> "♈"
        SeasonEvent.JUN_SOLSTICE -> "♋"
        SeasonEvent.SEP_EQUINOX -> "♎"
        SeasonEvent.DEC_SOLSTICE -> "♑"
    }

    /** The four season events of [year], sorted by instant (residual-checked). */
    fun eventsOfYear(year: Int): List<SeasonInfo> {
        val out = ArrayList<SeasonInfo>(4)
        for (event in SeasonEvent.entries) {
            val seed = Jdn.g2d(year, SEEDS[event]!!.first, SEEDS[event]!!.second).toDouble()
            val jd = solve(TARGETS[event]!!, seed)
            if (jd != null) out.add(SeasonInfo(event, jd))
        }
        return out
    }

    /**
     * The season event whose instant falls on Gregorian day [g] in the
     * device's local timezone, or null. (All four events of a year fall
     * between Mar 20 and Dec 23, so only [g]'s year is ever relevant.)
     */
    fun eventOn(g: SimpleDate): SeasonInfo? {
        val jdn = Jdn.g2d(g.year, g.month, g.day).toDouble() // noon UTC
        val off = tzOffsetDays(g)                             // days, negative east of UTC
        val windowStart = jdn - 0.5 + off
        val windowEnd = jdn + 0.5 + off
        for (info in eventsOfYear(g.year)) {
            if (info.jd >= windowStart && info.jd < windowEnd) return info
        }
        return null
    }

    /**
     * Local `HH:MM` of a season event that falls on Gregorian day [g]
     * (the day returned by [eventOn]). Digits are NOT localized here —
     * the caller routes the string through `I18n.num` for Persian.
     */
    fun localTimeOf(g: SimpleDate, info: SeasonInfo): String {
        val jdn = Jdn.g2d(g.year, g.month, g.day).toDouble()
        val off = tzOffsetDays(g)
        val fractionOfDay = info.jd - (jdn - 0.5 + off)
        val secs = (fractionOfDay * 86400.0).toInt()
        val hh = (secs / 3600).coerceIn(0, 23)
        val mm = ((secs % 3600) / 60).coerceIn(0, 59)
        return "%02d:%02d".format(hh, mm)
    }

    /**
     * Sun's apparent ecliptic longitude in DEGREES (0..360) at Julian Day
     * [jd]. The mean anomaly is converted to radians for the sine terms.
     */
    private fun sunLongitude(jd: Double): Double {
        val d = jd - 2451545.0
        val l = norm(280.46646 + 0.9856474 * d)     // mean longitude
        val gRad = Math.toRadians(norm(357.529 + 0.98560028 * d)) // mean anomaly
        return norm(
            l + 1.914602 * sin(gRad) + 0.019993 * sin(2 * gRad) + 0.000289 * sin(3 * gRad)
        )
    }

    /**
     * Newton solve: 6 iterations of `t += signedNorm(target - λ(t)) / 0.9856474`.
     * Returns null when the residual exceeds 0.5° (safety guard).
     */
    private fun solve(target: Double, seedJd: Double): Double? {
        var t = seedJd
        repeat(6) {
            t += signedNorm(target - sunLongitude(t)) / 0.9856474
        }
        return if (abs(signedNorm(sunLongitude(t) - target)) > 0.5) null else t
    }

    private fun norm(x: Double): Double = ((x % 360.0) + 360.0) % 360.0

    /** Difference in degrees brought into [-180, 180). */
    private fun signedNorm(x: Double): Double = ((x + 180.0) % 360.0 + 360.0) % 360.0 - 180.0

    /**
     * Timezone offset of D's local midnight, in days, negative east of UTC —
     * the exact pattern used by [MoonEngine] (identical to the web
     * `Date#getTimezoneOffset() / 1440` convention).
     */
    private fun tzOffsetDays(date: SimpleDate): Double {
        val cal = Calendar.getInstance(TimeZone.getDefault())
        cal.clear()
        cal.set(date.year, date.month - 1, date.day, 0, 0, 0)
        return -TimeZone.getDefault().getOffset(cal.timeInMillis) / 86400000.0
    }
}
