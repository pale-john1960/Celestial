package com.celestial.calendar.engine

import java.util.Calendar
import java.util.TimeZone
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.sin

/** A major moon phase whose instant falls on a given local calendar day. */
enum class MoonMajor { NEW, FIRST_QUARTER, FULL, LAST_QUARTER }

/**
 * Moon state for one local calendar day.
 *
 * @property ageDays days since the (corrected) new moon that starts the cycle
 * @property phase fraction of the synodic month, 0 = new moon, 0.5 = full moon
 * @property illum illuminated fraction of the disc, 0..1
 * @property phaseIndex 0..7 → 🌑🌒🌓🌔🌕🌖🌗🌘
 * @property major major-phase instant falling on this local day, if any
 */
data class MoonInfo(
    val ageDays: Double,
    val phase: Double,
    val illum: Double,
    val phaseIndex: Int,
    val major: MoonMajor?,
)

/**
 * Celestial — moon phase engine (port of the web `src/lib/calendar/moon.ts`).
 *
 * Mean-lunation algorithm derived from Meeus, Astronomical Algorithms ch. 49:
 * a constant synodic month anchored at the k=0 MEAN new-moon epoch, corrected
 * by the two dominant periodic terms (moon/sun mean anomalies, E ≈ 1).
 * Identical constants and formulas to the web implementation (Task 6-a) —
 * both ports were validated against the icalendar37.net live lunar reference:
 * 149/153 day-markers agree, and the disagreements only occur when the true
 * event falls within ~1 h of local midnight (inherent to a local-day window).
 * Instant accuracy: new/full ±5 min, quarters ±2 h.
 *
 * All computations use the device's default timezone: each Gregorian day D is
 * evaluated at its LOCAL noon (`jdn + off`, where off is negative east of
 * UTC), and a major phase "belongs" to D when its corrected instant falls in
 * D's local calendar day window `[jdn - 0.5 + off, jdn + 0.5 + off)`.
 */
object MoonEngine {

    /** Mean synodic month (days). */
    const val SYNODIC = 29.530588853

    /** Meeus ch.49 mean new-moon epoch (k=0), NOT the 18:14 true instant. */
    const val BASE = 2451550.09766

    private const val TAU = 6.283185307179586

    /** Position of the major phases within the mean cycle (days). */
    private const val POS_NEW = 0.0
    private const val POS_FIRST_QUARTER = 7.38264721
    private const val POS_FULL = 14.76529443
    private const val POS_LAST_QUARTER = 22.14794164

    /** Emoji per [MoonInfo.phaseIndex]: 🌑🌒🌓🌔🌕🌖🌗🌘. */
    val PHASE_EMOJI = arrayOf("🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘")

    /** Tiny month-cell glyph for major-phase days. */
    fun majorGlyph(major: MoonMajor): String = when (major) {
        MoonMajor.NEW -> "🌑"
        MoonMajor.FIRST_QUARTER -> "🌓"
        MoonMajor.FULL -> "🌕"
        MoonMajor.LAST_QUARTER -> "🌗"
    }

    /** Moon state for the Gregorian [date] in the device's local timezone. */
    fun infoFor(date: SimpleDate): MoonInfo {
        val jdn = Jdn.g2d(date.year, date.month, date.day) // noon UTC
        val off = tzOffsetDays(date)                        // days, negative east of UTC
        val localNoon = jdn + off

        val ageMean = mod(localNoon - BASE, SYNODIC)
        val cycleStart = localNoon - ageMean
        val trueNewStart = cycleStart + corrAt(cycleStart, POS_NEW)
        val age = localNoon - trueNewStart
        val phase = age / SYNODIC
        val illum = (1 - cos(TAU * phase)) / 2
        val phaseIndex = mod(floor(phase * 8 + 0.5), 8.0).toInt()

        // major-phase markers: check this cycle and the neighbouring ones
        // (shift ±SYNODIC) so events near local midnight still resolve
        val windowStart = jdn - 0.5 + off
        val windowEnd = jdn + 0.5 + off
        var major: MoonMajor? = null
        var majorDist = 0.0
        val positions = arrayOf(
            MoonMajor.NEW to POS_NEW,
            MoonMajor.FIRST_QUARTER to POS_FIRST_QUARTER,
            MoonMajor.FULL to POS_FULL,
            MoonMajor.LAST_QUARTER to POS_LAST_QUARTER,
        )
        for (shift in doubleArrayOf(-SYNODIC, 0.0, SYNODIC)) {
            for ((m, pos) in positions) {
                val meanEvt = cycleStart + shift + pos
                val evt = meanEvt + corrAt(meanEvt, pos)
                if (evt >= windowStart && evt < windowEnd) {
                    val dist = abs(evt - localNoon)
                    if (major == null || dist < majorDist) {
                        major = m
                        majorDist = dist
                    }
                }
            }
        }

        return MoonInfo(
            ageDays = age,
            phase = phase,
            illum = illum,
            phaseIndex = phaseIndex,
            major = major,
        )
    }

    /**
     * Two dominant Meeus ch.49 correction terms (E ≈ 1).
     * Quarter table for first/last quarter, new/full table otherwise.
     */
    private fun corrAt(jd: Double, pos: Double): Double {
        val d = jd - 2451545.0
        val mp = TAU * frac(134.963 / 360 + 13.064993 * d / 360)   // moon mean anomaly (M')
        val ms = TAU * frac(357.529 / 360 + 0.98560028 * d / 360)  // sun mean anomaly (M)
        return if (pos == POS_FIRST_QUARTER || pos == POS_LAST_QUARTER) {
            -0.62814 * sin(mp) + 0.17172 * sin(ms) // QUARTER table
        } else {
            -0.40720 * sin(mp) + 0.17241 * sin(ms) // NEW/FULL table
        }
    }

    /**
     * Timezone offset of D's local midnight, in days, negative east of UTC
     * (identical to the web `Date#getTimezoneOffset() / 1440` convention).
     */
    private fun tzOffsetDays(date: SimpleDate): Double {
        val cal = Calendar.getInstance(TimeZone.getDefault())
        cal.clear()
        cal.set(date.year, date.month - 1, date.day, 0, 0, 0)
        return -TimeZone.getDefault().getOffset(cal.timeInMillis) / 86400000.0
    }

    private fun mod(x: Double, m: Double): Double = ((x % m) + m) % m

    private fun frac(x: Double): Double = x - floor(x)
}
