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

    fun seasonName(season: Season): String = when (season) {
        Season.SPRING -> seasonSpring
        Season.SUMMER -> seasonSummer
        Season.AUTUMN -> seasonAutumn
        Season.WINTER -> seasonWinter
    }
}

/** Season of the year (Gregorian months) + seasonal banner resources. */
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

fun seasonBannerRes(season: Season, variant: Int): Int = when (season) {
    Season.SPRING -> if (variant == 1) R.drawable.seasonal_spring_1 else R.drawable.seasonal_spring_2
    Season.SUMMER -> if (variant == 1) R.drawable.seasonal_summer_1 else R.drawable.seasonal_summer_2
    Season.AUTUMN -> if (variant == 1) R.drawable.seasonal_autumn_1 else R.drawable.seasonal_autumn_2
    Season.WINTER -> if (variant == 1) R.drawable.seasonal_winter_1 else R.drawable.seasonal_winter_2
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
