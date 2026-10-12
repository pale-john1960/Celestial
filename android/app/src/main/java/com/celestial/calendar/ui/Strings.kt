package com.celestial.calendar.ui

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import com.celestial.calendar.R
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.SeasonEvent
import com.celestial.calendar.ui.theme.normalizeEventColor
import java.util.Locale

/**
 * Celestial — locale-scoped string provider.
 *
 * In-app language switching (en/ja/fa) works without recreating the activity:
 * a configuration-scoped [Context] is created per locale and its resources
 * serve the translated strings from `values{,-ja,-fa}/strings.xml`.
 * (Month/weekday names and engine data live in `engine/I18n.kt`, mirroring
 * the web app's architecture.)
 */
class LocalStrings(private val res: Resources) {

    fun get(@StringRes id: Int): String = res.getString(id)
    fun get(@StringRes id: Int, vararg args: Any): String = res.getString(id, *args)

    val appName get() = res.getString(R.string.app_name)
    val tagline get() = res.getString(R.string.tagline)
    val viewMonth get() = res.getString(R.string.view_month)
    val viewYear get() = res.getString(R.string.view_year)
    val viewDay get() = res.getString(R.string.view_day)
    val viewAgenda get() = res.getString(R.string.view_agenda)
    val today get() = res.getString(R.string.today)
    val search get() = res.getString(R.string.search)
    val settings get() = res.getString(R.string.settings)
    val close get() = res.getString(R.string.close)
    val save get() = res.getString(R.string.save)
    val cancel get() = res.getString(R.string.cancel)
    val remove get() = res.getString(R.string.remove)
    val retry get() = res.getString(R.string.retry)
    val clearAll get() = res.getString(R.string.clear_all)
    val download get() = res.getString(R.string.download)
    val importLabel get() = res.getString(R.string.import_label)
    val importEvents get() = res.getString(R.string.import_events)
    val imported get() = res.getString(R.string.imported)
    val loading get() = res.getString(R.string.loading)
    val errorGeneric get() = res.getString(R.string.error_generic)
    val noEvents get() = res.getString(R.string.no_events)
    val upcoming get() = res.getString(R.string.upcoming)
    val past get() = res.getString(R.string.past)
    val allDay get() = res.getString(R.string.all_day)
    val dayOff get() = res.getString(R.string.day_off)
    val dayOffNotice get() = res.getString(R.string.day_off_notice)
    val weekend get() = res.getString(R.string.weekend)
    val openDay get() = res.getString(R.string.open_day)
    val nextEvent get() = res.getString(R.string.next_event)

    fun inDays(days: Int) = res.getString(R.string.in_days, days)

    val systemGregorian get() = res.getString(R.string.system_gregorian)
    val systemJalali get() = res.getString(R.string.system_jalali)
    val systemImperial get() = res.getString(R.string.system_imperial)
    val systemImperialHint get() = res.getString(R.string.system_imperial_hint)
    val calendarSystem get() = res.getString(R.string.calendar_system)
    val language get() = res.getString(R.string.language)
    val weekStartLabel get() = res.getString(R.string.week_start)
    val weekStartSat get() = res.getString(R.string.week_start_sat)
    val weekStartSun get() = res.getString(R.string.week_start_sun)
    val weekStartMon get() = res.getString(R.string.week_start_mon)
    val themeLabel get() = res.getString(R.string.theme_label)
    val themeLight get() = res.getString(R.string.theme_light)
    val themeDark get() = res.getString(R.string.theme_dark)
    val themeSystem get() = res.getString(R.string.theme_system)

    val eventSources get() = res.getString(R.string.event_sources)
    val srcInternational get() = res.getString(R.string.src_international)
    val srcUs get() = res.getString(R.string.src_us)
    val srcJapan get() = res.getString(R.string.src_japan)
    val srcPersianCultural get() = res.getString(R.string.src_persian_cultural)
    val srcPersianReligious get() = res.getString(R.string.src_persian_religious)
    val srcPersianNational get() = res.getString(R.string.src_persian_national)
    val srcImported get() = res.getString(R.string.src_imported)
    val onlineSources get() = res.getString(R.string.online_sources)
    val onlineHint get() = res.getString(R.string.online_hint)
    val religiousHiddenHolidayNote get() = res.getString(R.string.religious_hidden_holiday_note)

    val importTitle get() = res.getString(R.string.import_title)
    val importHint get() = res.getString(R.string.import_hint)
    val importChooseFile get() = res.getString(R.string.import_choose_file)
    val importParsing get() = res.getString(R.string.import_parsing)
    val importInvalid get() = res.getString(R.string.import_invalid)

    fun importResult(count: Int) = res.getString(R.string.import_result, count)
    fun importErrors(count: Int) = res.getString(R.string.import_errors, count)

    val sampleFiles get() = res.getString(R.string.sample_files)
    val importFormatJson get() = res.getString(R.string.import_format_json)
    val importFormatTxt get() = res.getString(R.string.import_format_txt)
    val importFormatCsv get() = res.getString(R.string.import_format_csv)
    val importedEventsList get() = res.getString(R.string.imported_events_list)
    val noImportedEvents get() = res.getString(R.string.no_imported_events)
    val deleteImported get() = res.getString(R.string.delete_imported)
    val eventTitle get() = res.getString(R.string.event_title)
    val eventDescription get() = res.getString(R.string.event_description)
    val eventDate get() = res.getString(R.string.event_date)

    val timeSync get() = res.getString(R.string.time_sync)
    val timeSyncOk get() = res.getString(R.string.time_sync_ok)
    val timeSyncOff get() = res.getString(R.string.time_sync_off)
    val timeSyncChecking get() = res.getString(R.string.time_sync_checking)
    val timeSyncFailed get() = res.getString(R.string.time_sync_failed)
    val ntpServer get() = res.getString(R.string.ntp_server)
    val offset get() = res.getString(R.string.offset)
    val syncNow get() = res.getString(R.string.sync_now)
    val deviceClock get() = res.getString(R.string.device_clock)
    val serverClock get() = res.getString(R.string.server_clock)

    fun offsetMs(value: String) = res.getString(R.string.offset_ms, value)
    fun eventsCount(count: Int) = res.getString(R.string.events_count, count)

    val statusBarDate get() = res.getString(R.string.status_bar_date)
    val statusBarDateDesc get() = res.getString(R.string.status_bar_date_desc)
    val notifPermRationale get() = res.getString(R.string.notif_perm_rationale)

    val footerNote get() = res.getString(R.string.footer_note)
    val seasonSpring get() = res.getString(R.string.season_spring)
    val seasonSummer get() = res.getString(R.string.season_summer)
    val seasonAutumn get() = res.getString(R.string.season_autumn)
    val seasonWinter get() = res.getString(R.string.season_winter)
    val eraGregorian get() = res.getString(R.string.era_gregorian)
    val eraJalali get() = res.getString(R.string.era_jalali)
    val eraImperial get() = res.getString(R.string.era_imperial)
    val hijriLabel get() = res.getString(R.string.hijri_label)
    val secondaryDate get() = res.getString(R.string.secondary_date)
    val holidayBadge get() = res.getString(R.string.holiday_badge)
    val religiousBadge get() = res.getString(R.string.religious_badge)
    val culturalBadge get() = res.getString(R.string.cultural_badge)
    val nationalBadge get() = res.getString(R.string.national_badge)
    val categoryLabel get() = res.getString(R.string.category_label)
    val todayIs get() = res.getString(R.string.today_is)
    val quickAdd get() = res.getString(R.string.quick_add)
    val noneLabel get() = res.getString(R.string.none_label)
    val days get() = res.getString(R.string.days)
    val months get() = res.getString(R.string.months)
    val years get() = res.getString(R.string.years)
    val andarjah get() = res.getString(R.string.andarjah)
    val dayNameLabel get() = res.getString(R.string.day_name_label)
    val yearOverview get() = res.getString(R.string.year_overview)
    val goToday get() = res.getString(R.string.go_today)
    val prevMonth get() = res.getString(R.string.prev_month)
    val nextMonth get() = res.getString(R.string.next_month)
    val prevYear get() = res.getString(R.string.prev_year)
    val nextYear get() = res.getString(R.string.next_year)
    val selectDate get() = res.getString(R.string.select_date)

    // ---- Week view / moon phases / manual events / ICS export (Task 6-b) ----
    val viewWeek get() = res.getString(R.string.view_week)
    val thisWeek get() = res.getString(R.string.this_week)
    val prevWeek get() = res.getString(R.string.prev_week)
    val nextWeek get() = res.getString(R.string.next_week)

    val moonPhaseTitle get() = res.getString(R.string.moon_phase_title)

    fun moonPhaseName(phaseIndex: Int): String = res.getString(
        when (phaseIndex) {
            0 -> R.string.moon_new
            1 -> R.string.moon_waxing_crescent
            2 -> R.string.moon_first_quarter
            3 -> R.string.moon_waxing_gibbous
            4 -> R.string.moon_full
            5 -> R.string.moon_waning_gibbous
            6 -> R.string.moon_last_quarter
            else -> R.string.moon_waning_crescent
        },
    )

    fun moonIllumination(percent: Int) = res.getString(R.string.moon_illumination, percent)
    fun moonAge(days: Int) = res.getString(R.string.moon_age, days)

    val addEvent get() = res.getString(R.string.add_event)
    val addEventTitle get() = res.getString(R.string.add_event_title)
    val addEventName get() = res.getString(R.string.add_event_name)
    val addEventDesc get() = res.getString(R.string.add_event_desc)
    val addEventHoliday get() = res.getString(R.string.add_event_holiday)
    val addEventDate get() = res.getString(R.string.add_event_date)
    val addEventSaved get() = res.getString(R.string.add_event_saved)
    val addEventInvalidDate get() = res.getString(R.string.add_event_invalid_date)
    val sourceManual get() = res.getString(R.string.source_manual)

    val exportIcs get() = res.getString(R.string.export_ics)
    fun exportIcsDone(count: Int) = res.getString(R.string.export_ics_done, count)

    // ---- Solstice / equinox / recurring events / event editing (Task 8-b) ----
    fun seasonEventName(event: SeasonEvent): String = when (event) {
        SeasonEvent.MAR_EQUINOX -> res.getString(R.string.season_mar_equinox)
        SeasonEvent.JUN_SOLSTICE -> res.getString(R.string.season_jun_solstice)
        SeasonEvent.SEP_EQUINOX -> res.getString(R.string.season_sep_equinox)
        SeasonEvent.DEC_SOLSTICE -> res.getString(R.string.season_dec_solstice)
    }

    fun seasonOccursAt(hhmm: String) = res.getString(R.string.season_occurs_at, hhmm)

    fun seasonEventNote(event: SeasonEvent): String = when (event) {
        SeasonEvent.MAR_EQUINOX, SeasonEvent.SEP_EQUINOX ->
            res.getString(R.string.season_note_equal)
        SeasonEvent.JUN_SOLSTICE -> res.getString(R.string.season_note_longest)
        SeasonEvent.DEC_SOLSTICE -> res.getString(R.string.season_note_shortest)
    }

    fun seasonGlyphDesc(name: String) = res.getString(R.string.season_glyph_desc, name)

    val recurringYearly get() = res.getString(R.string.recurring_yearly)
    val addEventYearly get() = res.getString(R.string.add_event_yearly)
    val addEventYearlyHint get() = res.getString(R.string.add_event_yearly_hint)
    fun importWarnings(count: Int) = res.getString(R.string.import_warnings, count)

    val editEvent get() = res.getString(R.string.edit_event)
    val eventUpdated get() = res.getString(R.string.event_updated)
    val deleteEvent get() = res.getString(R.string.delete_event)

    // ---- Per-event colors (Task 9) ----
    val eventColor get() = res.getString(R.string.event_color)
    val eventColorDefault get() = res.getString(R.string.event_color_default)

    /** a11y label for the "default" option ("No color, use category default"). */
    val eventColorNone get() = res.getString(R.string.event_color_none)

    /** Localized swatch name for a palette hex (falls back to the raw hex). */
    fun eventColorName(hex: String): String = when (normalizeEventColor(hex)) {
        "#c2185b" -> res.getString(R.string.event_color_magenta)
        "#d95970" -> res.getString(R.string.event_color_rose)
        "#e07b39" -> res.getString(R.string.event_color_orange)
        "#b8860b" -> res.getString(R.string.event_color_gold)
        "#2ba84a" -> res.getString(R.string.event_color_green)
        "#5b8c85" -> res.getString(R.string.event_color_teal)
        "#8e7cc3" -> res.getString(R.string.event_color_violet)
        "#64748b" -> res.getString(R.string.event_color_slate)
        else -> hex
    }

    fun seasonName(season: Season): String = when (season) {
        Season.SPRING -> seasonSpring
        Season.SUMMER -> seasonSummer
        Season.AUTUMN -> seasonAutumn
        Season.WINTER -> seasonWinter
    }

    // ---- Persian zodiac month chips (Task 10) ----

    /** Localized zodiac sign name for a Jalali month 1-12 ("" when out of range). */
    fun zodiacName(jalaliMonth: Int): String = when (jalaliMonth) {
        1 -> res.getString(R.string.zodiac_aries)
        2 -> res.getString(R.string.zodiac_taurus)
        3 -> res.getString(R.string.zodiac_gemini)
        4 -> res.getString(R.string.zodiac_cancer)
        5 -> res.getString(R.string.zodiac_leo)
        6 -> res.getString(R.string.zodiac_virgo)
        7 -> res.getString(R.string.zodiac_libra)
        8 -> res.getString(R.string.zodiac_scorpio)
        9 -> res.getString(R.string.zodiac_sagittarius)
        10 -> res.getString(R.string.zodiac_capricorn)
        11 -> res.getString(R.string.zodiac_aquarius)
        12 -> res.getString(R.string.zodiac_pisces)
        else -> ""
    }

    /** a11y label for the header zodiac chip: "Zodiac of <month>: <sign>". */
    fun zodiacChipDesc(month: String, sign: String) = res.getString(R.string.zodiac_chip_desc, month, sign)

    // ---- Header themes / Hijri toggle / daily horoscope (Task 13-d) ----

    /** Label of the header-artwork theme selector in settings. */
    val headerTheme get() = res.getString(R.string.header_theme)

    /** Localized name of a header artwork theme. */
    fun headerThemeName(theme: com.celestial.calendar.data.HeaderTheme): String = when (theme) {
        com.celestial.calendar.data.HeaderTheme.SEASONAL -> res.getString(R.string.theme_seasonal)
        com.celestial.calendar.data.HeaderTheme.CELESTIAL -> res.getString(R.string.theme_celestial)
        com.celestial.calendar.data.HeaderTheme.MAGICAL -> res.getString(R.string.theme_magical)
        com.celestial.calendar.data.HeaderTheme.SHAHANSHAHI -> res.getString(R.string.theme_shahanshahi)
        com.celestial.calendar.data.HeaderTheme.JAPANESE -> res.getString(R.string.theme_japanese)
        com.celestial.calendar.data.HeaderTheme.KOREAN -> res.getString(R.string.theme_korean)
        com.celestial.calendar.data.HeaderTheme.CHINESE -> res.getString(R.string.theme_chinese)
    }

    val showHijri get() = res.getString(R.string.show_hijri)
    val showHoroscope get() = res.getString(R.string.show_horoscope)
    val horoscopeTitle get() = res.getString(R.string.horoscope_title)
    val horoscopeMood get() = res.getString(R.string.horoscope_mood)
    val horoscopeLuckyNumber get() = res.getString(R.string.horoscope_lucky_number)
    val horoscopeLuckyColor get() = res.getString(R.string.horoscope_lucky_color)
    val horoscopeAdvice get() = res.getString(R.string.horoscope_advice)

    // ---- Round 14: systems / royal names / weekend day / sun / world clock ----

    /** Labels + hints for the two round-14 calendar systems. */
    val systemImperialSolar get() = res.getString(R.string.system_imperial_solar)
    val systemImperialSolarHint get() = res.getString(R.string.system_imperial_solar_hint)
    val systemAncient get() = res.getString(R.string.system_ancient)
    val systemAncientHint get() = res.getString(R.string.system_ancient_hint)
    val royalMonthNames get() = res.getString(R.string.royal_month_names)
    val royalMonthNamesHint get() = res.getString(R.string.royal_month_names_hint)

    /** Label of the weekly-day-off selector + its five options. */
    val weekendDayLabel get() = res.getString(R.string.weekend_day)
    fun weekendDayName(day: com.celestial.calendar.engine.WeekendDay): String = when (day) {
        com.celestial.calendar.engine.WeekendDay.AUTO -> res.getString(R.string.weekend_auto)
        com.celestial.calendar.engine.WeekendDay.NONE -> res.getString(R.string.weekend_none)
        com.celestial.calendar.engine.WeekendDay.FRIDAY -> res.getString(R.string.weekend_friday)
        com.celestial.calendar.engine.WeekendDay.SATURDAY -> res.getString(R.string.weekend_saturday)
        com.celestial.calendar.engine.WeekendDay.SUNDAY -> res.getString(R.string.weekend_sunday)
    }

    /** Sun-times card labels (round 14). */
    val sunTimesTitle get() = res.getString(R.string.sun_times_title)
    val sunDawn get() = res.getString(R.string.sun_dawn)
    val sunSunrise get() = res.getString(R.string.sun_sunrise)
    val sunNoon get() = res.getString(R.string.sun_noon)
    val sunSunset get() = res.getString(R.string.sun_sunset)
    val sunDusk get() = res.getString(R.string.sun_dusk)
    val sunLocation get() = res.getString(R.string.sun_location)
    val sunPolarNight get() = res.getString(R.string.sun_polar_night)
    val sunMidnightSun get() = res.getString(R.string.sun_midnight_sun)

    /** World-clock card labels (round 14). */
    val worldClockTitle get() = res.getString(R.string.world_clock_title)
    val worldClockAdd get() = res.getString(R.string.world_clock_add)
    val worldClockEmpty get() = res.getString(R.string.world_clock_empty)
    val worldClockTomorrow get() = res.getString(R.string.world_clock_tomorrow)
    val worldClockYesterday get() = res.getString(R.string.world_clock_yesterday)

    /** Localized preset-city name (sun location + world clock). */
    fun cityName(city: com.celestial.calendar.engine.WorldCity): String = when (city.id) {
        "tehran" -> res.getString(R.string.city_tehran)
        "tokyo" -> res.getString(R.string.city_tokyo)
        "seoul" -> res.getString(R.string.city_seoul)
        "beijing" -> res.getString(R.string.city_beijing)
        "new-york" -> res.getString(R.string.city_new_york)
        "london" -> res.getString(R.string.city_london)
        "paris" -> res.getString(R.string.city_paris)
        "dubai" -> res.getString(R.string.city_dubai)
        "sydney" -> res.getString(R.string.city_sydney)
        "los-angeles" -> res.getString(R.string.city_los_angeles)
        else -> city.id
    }
}

/** Season of the year (Gregorian months). */
enum class Season {
    SPRING, SUMMER, AUTUMN, WINTER;

    companion object {
        fun ofGregorianMonth(month: Int): Season = when (month) {
            3, 4, 5 -> SPRING
            6, 7, 8 -> SUMMER
            9, 10, 11 -> AUTUMN
            else -> WINTER
        }
    }
}

/**
 * Hero banner artwork resource for the active header theme (round 13;
 * 4-image fixed pools in round 14; round 15: 12 unique pieces per fixed
 * theme — every Gregorian month gets its OWN artwork, nothing is
 * duplicated across months).
 *
 * THE CENTRAL theme image source on Android (web parity with themeImageSrc)
 * shared with YearView: the hero header AND the YearView month-card artwork
 * both resolve through this one function, so they always stay in sync.
 *
 * Fixed themes: the Gregorian month maps DIRECTLY to the piece index —
 * hero_{theme}_{gMonth} (Jan → 1 … Dec → 12; 6 themes × 12 = 72 explicit
 * branches — verbose but compile-safe; no resources.getIdentifier, which
 * breaks resource shrinking). Seasonal: 3 pieces per season, one per
 * month-in-season — SPRING(Mar, Apr, May) → spring_{3,4,5}, SUMMER(Jun,
 * Jul, Aug) → summer_{3,4,5}, AUTUMN(Sep, Oct, Nov) → autumn_{1,2,3},
 * WINTER(Dec, Jan, Feb) → winter_{1,2,3}; k = (gMonth − seasonStart + 12)
 * % 12 (0 = first month of the season). All assets are the generated
 * 1344x768 jpgs in `res/drawable-nodpi/`. Static imagery — the animated
 * particle overlay lives in HeroParticles.kt.
 */
fun heroArtworkRes(theme: com.celestial.calendar.data.HeaderTheme, gMonth: Int): Int {
    if (theme == com.celestial.calendar.data.HeaderTheme.SEASONAL) {
        val season = Season.ofGregorianMonth(gMonth)
        val start = when (season) {
            Season.SPRING -> 3
            Season.SUMMER -> 6
            Season.AUTUMN -> 9
            Season.WINTER -> 12
        }
        // 0 = first month of the season, 1 = second, 2 = third
        val k = (gMonth - start + 12) % 12
        return when (season) {
            Season.SPRING -> when (k) {
                0 -> R.drawable.hero_seasonal_spring_3
                1 -> R.drawable.hero_seasonal_spring_4
                else -> R.drawable.hero_seasonal_spring_5
            }
            Season.SUMMER -> when (k) {
                0 -> R.drawable.hero_seasonal_summer_3
                1 -> R.drawable.hero_seasonal_summer_4
                else -> R.drawable.hero_seasonal_summer_5
            }
            Season.AUTUMN -> when (k) {
                0 -> R.drawable.hero_seasonal_autumn_1
                1 -> R.drawable.hero_seasonal_autumn_2
                else -> R.drawable.hero_seasonal_autumn_3
            }
            Season.WINTER -> when (k) {
                0 -> R.drawable.hero_seasonal_winter_1
                1 -> R.drawable.hero_seasonal_winter_2
                else -> R.drawable.hero_seasonal_winter_3
            }
        }
    }
    // fixed themes: the Gregorian month maps 1:1 onto the piece index
    // (normalized into 1..12)
    val m = ((gMonth - 1) % 12 + 12) % 12 + 1
    return when (theme) {
        com.celestial.calendar.data.HeaderTheme.CELESTIAL -> when (m) {
            1 -> R.drawable.hero_celestial_1
            2 -> R.drawable.hero_celestial_2
            3 -> R.drawable.hero_celestial_3
            4 -> R.drawable.hero_celestial_4
            5 -> R.drawable.hero_celestial_5
            6 -> R.drawable.hero_celestial_6
            7 -> R.drawable.hero_celestial_7
            8 -> R.drawable.hero_celestial_8
            9 -> R.drawable.hero_celestial_9
            10 -> R.drawable.hero_celestial_10
            11 -> R.drawable.hero_celestial_11
            else -> R.drawable.hero_celestial_12
        }
        com.celestial.calendar.data.HeaderTheme.MAGICAL -> when (m) {
            1 -> R.drawable.hero_magical_1
            2 -> R.drawable.hero_magical_2
            3 -> R.drawable.hero_magical_3
            4 -> R.drawable.hero_magical_4
            5 -> R.drawable.hero_magical_5
            6 -> R.drawable.hero_magical_6
            7 -> R.drawable.hero_magical_7
            8 -> R.drawable.hero_magical_8
            9 -> R.drawable.hero_magical_9
            10 -> R.drawable.hero_magical_10
            11 -> R.drawable.hero_magical_11
            else -> R.drawable.hero_magical_12
        }
        com.celestial.calendar.data.HeaderTheme.SHAHANSHAHI -> when (m) {
            1 -> R.drawable.hero_shahanshahi_1
            2 -> R.drawable.hero_shahanshahi_2
            3 -> R.drawable.hero_shahanshahi_3
            4 -> R.drawable.hero_shahanshahi_4
            5 -> R.drawable.hero_shahanshahi_5
            6 -> R.drawable.hero_shahanshahi_6
            7 -> R.drawable.hero_shahanshahi_7
            8 -> R.drawable.hero_shahanshahi_8
            9 -> R.drawable.hero_shahanshahi_9
            10 -> R.drawable.hero_shahanshahi_10
            11 -> R.drawable.hero_shahanshahi_11
            else -> R.drawable.hero_shahanshahi_12
        }
        com.celestial.calendar.data.HeaderTheme.JAPANESE -> when (m) {
            1 -> R.drawable.hero_japanese_1
            2 -> R.drawable.hero_japanese_2
            3 -> R.drawable.hero_japanese_3
            4 -> R.drawable.hero_japanese_4
            5 -> R.drawable.hero_japanese_5
            6 -> R.drawable.hero_japanese_6
            7 -> R.drawable.hero_japanese_7
            8 -> R.drawable.hero_japanese_8
            9 -> R.drawable.hero_japanese_9
            10 -> R.drawable.hero_japanese_10
            11 -> R.drawable.hero_japanese_11
            else -> R.drawable.hero_japanese_12
        }
        com.celestial.calendar.data.HeaderTheme.KOREAN -> when (m) {
            1 -> R.drawable.hero_korean_1
            2 -> R.drawable.hero_korean_2
            3 -> R.drawable.hero_korean_3
            4 -> R.drawable.hero_korean_4
            5 -> R.drawable.hero_korean_5
            6 -> R.drawable.hero_korean_6
            7 -> R.drawable.hero_korean_7
            8 -> R.drawable.hero_korean_8
            9 -> R.drawable.hero_korean_9
            10 -> R.drawable.hero_korean_10
            11 -> R.drawable.hero_korean_11
            else -> R.drawable.hero_korean_12
        }
        com.celestial.calendar.data.HeaderTheme.CHINESE -> when (m) {
            1 -> R.drawable.hero_chinese_1
            2 -> R.drawable.hero_chinese_2
            3 -> R.drawable.hero_chinese_3
            4 -> R.drawable.hero_chinese_4
            5 -> R.drawable.hero_chinese_5
            6 -> R.drawable.hero_chinese_6
            7 -> R.drawable.hero_chinese_7
            8 -> R.drawable.hero_chinese_8
            9 -> R.drawable.hero_chinese_9
            10 -> R.drawable.hero_chinese_10
            11 -> R.drawable.hero_chinese_11
            else -> R.drawable.hero_chinese_12
        }
        com.celestial.calendar.data.HeaderTheme.SEASONAL ->
            R.drawable.hero_seasonal_spring_3 // unreachable (handled above)
    }
}

private fun Context.withLocale(locale: AppLocale): Context {
    val javaLocale = when (locale) {
        AppLocale.EN -> Locale.ENGLISH
        AppLocale.JA -> Locale.JAPANESE
        AppLocale.FA -> Locale("fa")
    }
    Locale.setDefault(javaLocale)
    val config = Configuration(resources.configuration)
    config.setLocale(javaLocale)
    if (locale.isRtl) {
        config.setLayoutDirection(javaLocale)
    }
    return createConfigurationContext(config)
}

@Composable
fun rememberStrings(locale: AppLocale): LocalStrings {
    val context = LocalContext.current
    return remember(locale, context) {
        LocalStrings(context.withLocale(locale).resources)
    }
}
