package com.celestial.calendar.engine

import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.cos
import kotlin.math.sin

/**
 * Celestial — sun times for a location (round 14, Kotlin port of the web's
 * src/lib/sun.ts — task 14-b).
 *
 * Pure NOAA solar calculator — the classic "general solar position
 * calculations" spreadsheet formulas (fractional year → equation of time +
 * declination → hour angles), zero Android dependencies. Times are returned
 * as minutes after LOCAL midnight in the location's timezone.
 *
 * Per-event nulls: the 90.833° events (sunrise/sunset) and the 108° events
 * (astronomical dawn/dusk) are computed independently, so a day can have a
 * sunrise but no astronomical dawn (e.g. London on the summer solstice) — or,
 * deep in a polar night, dawn/dusk can still occur while the sun never rises.
 * [SunTimes.midnightSun]/[SunTimes.polarNight] describe the horizon events
 * only. Verified against the web implementation (291-case test suite) and
 * suncalc cross-validation; Tehran 2026-10-11 → dawn 04:42, sunrise 06:06,
 * noon 11:51, sunset 17:36, dusk 19:00.
 */
data class SunTimes(
    /** astronomical dawn (sun 18° below the horizon, zenith 108°), minutes after local midnight */
    val dawn: Double?,
    /** sunrise (zenith 90.833° = 90°50′: refraction + solar radius) */
    val sunrise: Double?,
    /** solar noon (upper culmination), always defined */
    val noon: Double,
    val sunset: Double?,
    /** astronomical dusk (zenith 108°) */
    val dusk: Double?,
    /** sun never dips below the horizon (no sunrise/sunset that day) */
    val midnightSun: Boolean,
    /** sun never climbs above the horizon (no sunrise/sunset that day) */
    val polarNight: Boolean,
)

/** One preset city (shared by the sun-times city picker and the world clock). */
data class WorldCity(
    val id: String,
    val tz: String,
    val lat: Double,
    val lng: Double,
)

object SunEngine {

    private const val RAD = PI / 180.0

    /**
     * The ten world cities offered in the sun-location picker and the world
     * clock add-menu (same coords/tz as the web's WORLD_CITIES). Localized
     * names come from res strings city_tehran … city_los_angeles.
     */
    val WORLD_CITIES: List<WorldCity> = listOf(
        WorldCity("tehran", "Asia/Tehran", 35.6892, 51.389),
        WorldCity("tokyo", "Asia/Tokyo", 35.6762, 139.6503),
        WorldCity("seoul", "Asia/Seoul", 37.5665, 126.978),
        WorldCity("beijing", "Asia/Shanghai", 39.9042, 116.4074),
        WorldCity("new-york", "America/New_York", 40.7128, -74.006),
        WorldCity("london", "Europe/London", 51.5074, -0.1278),
        WorldCity("paris", "Europe/Paris", 48.8566, 2.3522),
        WorldCity("dubai", "Asia/Dubai", 25.2048, 55.2708),
        WorldCity("sydney", "Australia/Sydney", -33.8688, 151.2093),
        WorldCity("los-angeles", "America/Los_Angeles", 34.0522, -118.2437),
    )

    fun cityById(id: String): WorldCity? = WORLD_CITIES.firstOrNull { it.id == id }

    /**
     * NOAA solar position algorithm for the given Gregorian day.
     *
     * @param lat latitude in degrees (positive north)
     * @param lng longitude in degrees (positive east)
     * @param tzOff the location's UTC offset in minutes for that date (see
     *   [tzOffsetMinutes]); all returned times are local wall-clock minutes.
     */
    fun sunTimes(date: SimpleDate, lat: Double, lng: Double, tzOff: Int): SunTimes {
        // day of year 1..366 via the existing JDN math
        val doy = Jdn.toJdn(date) - Jdn.toJdn(SimpleDate(date.year, 1, 1)) + 1
        val yearLen = if (Jdn.isGregorianLeap(date.year)) 366 else 365

        // fractional year γ at 12:00 — the NOAA spreadsheet's angle
        val g = (2.0 * PI / yearLen) * (doy - 1)

        // equation of time, minutes (NOAA coefficients)
        val eqTime = 229.18 * (
            0.000075 +
                0.001868 * cos(g) -
                0.032077 * sin(g) -
                0.014615 * cos(2 * g) -
                0.040849 * sin(2 * g)
            )

        // solar declination, radians (NOAA 6-term series)
        val decl = (
            0.006918 -
                0.399912 * cos(g) +
                0.070257 * sin(g) -
                0.006758 * cos(2 * g) +
                0.000907 * sin(2 * g) -
                0.002697 * cos(3 * g) +
                0.00148 * sin(3 * g)
            )

        val sinLat = sin(lat * RAD)
        val cosLat = cos(lat * RAD)
        val sinDecl = sin(decl)
        val cosDecl = cos(decl)

        // solar noon in local clock minutes (formula: 720 − 4·lng − eqTime + tz)
        val noon = 720 - 4 * lng - eqTime + tzOff

        // cos(hour angle) for a given zenith; |c| > 1 → the sun never crosses
        // that altitude that day. Denominator 0 only at the exact poles, where
        // Double division gives ±Infinity and the classification still works.
        fun cosH(zenithDeg: Double): Double =
            (cos(zenithDeg * RAD) - sinLat * sinDecl) / (cosLat * cosDecl)

        val cRise = cosH(90.833) // 90°50′ — refraction + solar radius
        val cAstro = cosH(108.0) // astronomical twilight

        val hRise = if (cRise in -1.0..1.0) acos(cRise) / RAD else null
        val hAstro = if (cAstro in -1.0..1.0) acos(cAstro) / RAD else null

        // horizon classification (only when the 90.833° crossing is absent):
        //  c > 1  → sun never climbs to −0.833° → never rises → polar night
        //  c < −1 → sun never dips to −0.833° → never sets → midnight sun
        val polarNight = hRise == null && cRise > 1
        val midnightSun = hRise == null && cRise < -1

        return SunTimes(
            dawn = hAstro?.let { noon - 4 * it },
            sunrise = hRise?.let { noon - 4 * it },
            noon = noon,
            sunset = hRise?.let { noon + 4 * it },
            dusk = hAstro?.let { noon + 4 * it },
            midnightSun = midnightSun,
            polarNight = polarNight,
        )
    }

    /**
     * UTC offset (minutes, east positive) of an IANA timezone on a given
     * Gregorian date — DST included. Android's java.time ZoneRules replaces
     * the web's Intl fixed-point iteration: [ZoneRules.getOffset] evaluated at
     * the date's local NOON can never hit a 02:00–03:00 DST jump. Returns 0
     * for unknown zone names (callers pass validated presets).
     */
    fun tzOffsetMinutes(tz: String, date: SimpleDate): Int = try {
        val rules = ZoneId.of(tz).rules
        val noonLocal = LocalDateTime.of(date.year, date.month, date.day, 12, 0)
        rules.getOffset(noonLocal).totalSeconds / 60
    } catch (_: Exception) {
        0
    }

    /** "06:12" (locale digits for fa); wraps out-of-range minutes into
     *  [0, 1440) and rounds to the nearest minute. */
    fun formatHm(locale: AppLocale, minutes: Double): String {
        val wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440
        val h = wrapped / 60
        val m = wrapped % 60
        return I18n.num(locale, "%02d:%02d".format(h, m))
    }

    /** Preset city matching the stored sun location (tz + coords ±0.05°),
     *  for the localized label — same tolerance as the web. */
    fun presetFor(tz: String, lat: Double, lng: Double): WorldCity? =
        WORLD_CITIES.firstOrNull {
            it.tz == tz && abs(it.lat - lat) < 0.05 && abs(it.lng - lng) < 0.05
        }

    /** Human label for an arbitrary IANA zone: the part after the last slash,
     *  underscores turned into spaces ("America/New_York" → "New York"). */
    fun zoneLabel(tz: String): String =
        tz.substringAfterLast('/').replace('_', ' ')
}
