package com.celestial.calendar.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.WeekStart
import com.celestial.calendar.engine.WeekendDay
import com.celestial.calendar.events.SourceSettings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

enum class ThemeMode { SYSTEM, LIGHT, DARK }

/** Hero header artwork theme (round 13) — mirrors the web's HeaderThemeCode.
 *  SEASONAL = the original season-rotating artwork; the rest are fixed
 *  rich themes (4 jpg pieces each in drawable-nodpi, round 14). */
enum class HeaderTheme {
    SEASONAL, CELESTIAL, MAGICAL, SHAHANSHAHI, JAPANESE, KOREAN, CHINESE
}

/** Sun location for the Day view's sun-times card (round 14) — mirrors the
 *  web's SunLocation. The label is the canonical English name (preset
 *  cities), so preset matching survives locale switches. */
data class SunLocation(
    val label: String,
    val lat: Double,
    val lng: Double,
    val tz: String,
) {
    companion object {
        val TEHRAN = SunLocation("Tehran", 35.6892, 51.389, "Asia/Tehran")
    }
}

/** App settings — mirrors the web's persisted Settings model. */
data class Settings(
    val system: CalendarSystem = CalendarSystem.GREGORIAN,
    val locale: AppLocale = AppLocale.EN,
    val weekStart: WeekStart = WeekStart.SUN,
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val sources: SourceSettings = SourceSettings(),
    val statusBarDate: Boolean = true,
    val showHijri: Boolean = true,
    val showHoroscope: Boolean = true,
    val headerTheme: HeaderTheme = HeaderTheme.SEASONAL,
    val weekendDay: WeekendDay = WeekendDay.AUTO,
    val royalMonthNames: Boolean = false,
    val sunLocation: SunLocation = SunLocation.TEHRAN,
    val worldClockZones: List<String> = listOf("Asia/Tehran", "Asia/Tokyo", "America/New_York"),
    val ntpOffsetMs: Long? = null,
    val ntpSyncAt: Long? = null,
    val notifPermissionAsked: Boolean = false,
)

private val Context.celestialDataStore: DataStore<Preferences> by preferencesDataStore(name = "celestial_settings")

/**
 * Celestial — settings persistence via DataStore Preferences.
 */
class SettingsDataStore(private val context: Context) {

    private object Keys {
        val SYSTEM = stringPreferencesKey("system")
        val LOCALE = stringPreferencesKey("locale")
        val WEEK_START = stringPreferencesKey("week_start")
        val THEME = stringPreferencesKey("theme_mode")
        val SRC_INTERNATIONAL = booleanPreferencesKey("src_international")
        val SRC_US = booleanPreferencesKey("src_us")
        val SRC_JAPAN = booleanPreferencesKey("src_japan")
        val SRC_PERSIAN_CULTURAL = booleanPreferencesKey("src_persian_cultural")
        val SRC_PERSIAN_RELIGIOUS = booleanPreferencesKey("src_persian_religious")
        val SRC_PERSIAN_NATIONAL = booleanPreferencesKey("src_persian_national")
        val SRC_IMPORTED = booleanPreferencesKey("src_imported")
        val STATUS_BAR_DATE = booleanPreferencesKey("status_bar_date")
        val SHOW_HIJRI = booleanPreferencesKey("show_hijri")
        val SHOW_HOROSCOPE = booleanPreferencesKey("show_horoscope")
        val HEADER_THEME = stringPreferencesKey("header_theme")
        val WEEKEND_DAY = stringPreferencesKey("weekend_day")
        val ROYAL_MONTH_NAMES = booleanPreferencesKey("royal_month_names")
        val SUN_LOCATION_LABEL = stringPreferencesKey("sun_location_label")
        val SUN_LOCATION_LAT = doublePreferencesKey("sun_location_lat")
        val SUN_LOCATION_LNG = doublePreferencesKey("sun_location_lng")
        val SUN_LOCATION_TZ = stringPreferencesKey("sun_location_tz")
        val WORLD_CLOCK_ZONES = stringPreferencesKey("world_clock_zones")
        val NTP_OFFSET = longPreferencesKey("ntp_offset_ms")
        val NTP_SYNC_AT = longPreferencesKey("ntp_sync_at")
        val NOTIF_PERM_ASKED = booleanPreferencesKey("notif_perm_asked")
    }

    private inline fun <reified E : Enum<E>> enumOrDefault(name: String?, default: E): E =
        name?.let { runCatching { enumValueOf<E>(it) }.getOrNull() } ?: default

    val settings: Flow<Settings> = context.celestialDataStore.data.map { p ->
        Settings(
            system = enumOrDefault(p[Keys.SYSTEM], CalendarSystem.GREGORIAN),
            locale = AppLocale.fromCode(p[Keys.LOCALE] ?: "en"),
            weekStart = enumOrDefault(p[Keys.WEEK_START], WeekStart.SUN),
            themeMode = enumOrDefault(p[Keys.THEME], ThemeMode.SYSTEM),
            sources = SourceSettings(
                international = p[Keys.SRC_INTERNATIONAL] ?: true,
                us = p[Keys.SRC_US] ?: true,
                japan = p[Keys.SRC_JAPAN] ?: true,
                persianCultural = p[Keys.SRC_PERSIAN_CULTURAL] ?: true,
                persianReligious = p[Keys.SRC_PERSIAN_RELIGIOUS] ?: true,
                persianNational = p[Keys.SRC_PERSIAN_NATIONAL] ?: true,
                imported = p[Keys.SRC_IMPORTED] ?: true,
            ),
            statusBarDate = p[Keys.STATUS_BAR_DATE] ?: true,
            showHijri = p[Keys.SHOW_HIJRI] ?: true,
            showHoroscope = p[Keys.SHOW_HOROSCOPE] ?: true,
            headerTheme = enumOrDefault(p[Keys.HEADER_THEME], HeaderTheme.SEASONAL),
            weekendDay = WeekendDay.fromCode(p[Keys.WEEKEND_DAY]),
            royalMonthNames = p[Keys.ROYAL_MONTH_NAMES] ?: false,
            sunLocation = SunLocation(
                label = p[Keys.SUN_LOCATION_LABEL] ?: SunLocation.TEHRAN.label,
                lat = p[Keys.SUN_LOCATION_LAT] ?: SunLocation.TEHRAN.lat,
                lng = p[Keys.SUN_LOCATION_LNG] ?: SunLocation.TEHRAN.lng,
                tz = p[Keys.SUN_LOCATION_TZ] ?: SunLocation.TEHRAN.tz,
            ),
            worldClockZones = (p[Keys.WORLD_CLOCK_ZONES]
                ?: "Asia/Tehran,Asia/Tokyo,America/New_York")
                .split(',')
                .map { it.trim() }
                .filter { it.isNotEmpty() },
            ntpOffsetMs = p[Keys.NTP_OFFSET]?.takeIf { it != Long.MIN_VALUE },
            ntpSyncAt = p[Keys.NTP_SYNC_AT]?.takeIf { it != 0L },
            notifPermissionAsked = p[Keys.NOTIF_PERM_ASKED] ?: false,
        )
    }

    private suspend fun edit(block: (androidx.datastore.preferences.core.MutablePreferences) -> Unit) {
        context.celestialDataStore.edit(block)
    }

    suspend fun setSystem(v: CalendarSystem) = edit { it[Keys.SYSTEM] = v.name }
    suspend fun setLocale(v: AppLocale) = edit { it[Keys.LOCALE] = v.code }
    suspend fun setWeekStart(v: WeekStart) = edit { it[Keys.WEEK_START] = v.name }
    suspend fun setThemeMode(v: ThemeMode) = edit { it[Keys.THEME] = v.name }

    suspend fun setSource(transform: (SourceSettings) -> SourceSettings) = edit { p ->
        val cur = SourceSettings(
            international = p[Keys.SRC_INTERNATIONAL] ?: true,
            us = p[Keys.SRC_US] ?: true,
            japan = p[Keys.SRC_JAPAN] ?: true,
            persianCultural = p[Keys.SRC_PERSIAN_CULTURAL] ?: true,
            persianReligious = p[Keys.SRC_PERSIAN_RELIGIOUS] ?: true,
            persianNational = p[Keys.SRC_PERSIAN_NATIONAL] ?: true,
            imported = p[Keys.SRC_IMPORTED] ?: true,
        )
        val next = transform(cur)
        p[Keys.SRC_INTERNATIONAL] = next.international
        p[Keys.SRC_US] = next.us
        p[Keys.SRC_JAPAN] = next.japan
        p[Keys.SRC_PERSIAN_CULTURAL] = next.persianCultural
        p[Keys.SRC_PERSIAN_RELIGIOUS] = next.persianReligious
        p[Keys.SRC_PERSIAN_NATIONAL] = next.persianNational
        p[Keys.SRC_IMPORTED] = next.imported
    }

    suspend fun setStatusBarDate(v: Boolean) = edit { it[Keys.STATUS_BAR_DATE] = v }
    suspend fun setShowHijri(v: Boolean) = edit { it[Keys.SHOW_HIJRI] = v }
    suspend fun setShowHoroscope(v: Boolean) = edit { it[Keys.SHOW_HOROSCOPE] = v }
    suspend fun setHeaderTheme(v: HeaderTheme) = edit { it[Keys.HEADER_THEME] = v.name }
    suspend fun setWeekendDay(v: WeekendDay) = edit { it[Keys.WEEKEND_DAY] = v.code }
    suspend fun setRoyalMonthNames(v: Boolean) = edit { it[Keys.ROYAL_MONTH_NAMES] = v }
    suspend fun setSunLocation(v: SunLocation) = edit { p ->
        p[Keys.SUN_LOCATION_LABEL] = v.label
        p[Keys.SUN_LOCATION_LAT] = v.lat
        p[Keys.SUN_LOCATION_LNG] = v.lng
        p[Keys.SUN_LOCATION_TZ] = v.tz
    }

    /** World-clock zones: IANA ids joined with ',' (zone ids never contain
     *  commas — delimiter-safe round trip; fresh key, no migration issues). */
    suspend fun setWorldClockZones(v: List<String>) = edit { p ->
        val zones = v.filter { it.isNotBlank() }.distinct().take(8)
        p[Keys.WORLD_CLOCK_ZONES] = zones.joinToString(",")
    }
    suspend fun setNotifPermissionAsked() = edit { it[Keys.NOTIF_PERM_ASKED] = true }
    suspend fun setNotifPermissionAsked(v: Boolean) = edit { it[Keys.NOTIF_PERM_ASKED] = v }

    suspend fun setNtpResult(offsetMs: Long?) = edit { p ->
        if (offsetMs != null) {
            p[Keys.NTP_OFFSET] = offsetMs
            p[Keys.NTP_SYNC_AT] = System.currentTimeMillis()
        } else {
            p[Keys.NTP_OFFSET] = Long.MIN_VALUE
        }
    }
}
