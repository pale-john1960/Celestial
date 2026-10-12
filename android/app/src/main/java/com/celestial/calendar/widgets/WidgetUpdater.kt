package com.celestial.calendar.widgets

import android.app.AlarmManager
import android.appwidget.AppWidgetManager
import android.content.Context
import com.celestial.calendar.data.Settings
import com.celestial.calendar.data.SettingsDataStore
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CelestialDate
import com.celestial.calendar.statusbar.StatusBarDate
import kotlinx.coroutines.flow.first
import java.util.Calendar

/**
 * Celestial — shared widget/status-bar refresh helpers.
 *
 * Low-power policy: refreshes happen (a) when a widget is added or re-sized,
 * (b) from a single WorkManager job — a 6-hour inexact periodic pass plus a
 * one-shot pass scheduled for the next midnight — and (c) on boot / system
 * time change. No exact alarms, no polling.
 */
object WidgetUpdater {

    const val EXTRA_DATE = "extra_date"

    suspend fun currentSettings(context: Context): Settings =
        SettingsDataStore(context).settings.first()

    fun todayDate(): CelestialDate =
        CalendarFacade.buildCelestialDate(CalendarFacade.todayGregorian())

    /** Refresh the status-bar notification + all three widgets. */
    suspend fun updateAll(context: Context, settings: Settings? = null) {
        val s = settings ?: currentSettings(context)
        StatusBarDate.update(context, s)
        DateWidget.refresh(context, s)
        TodayWidget.refresh(context, s)
        MonthWidget.refresh(context, s)
    }

    /** Delay until the next local midnight, in milliseconds. */
    fun millisUntilNextMidnight(): Long {
        val now = Calendar.getInstance()
        val next = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return next.timeInMillis - now.timeInMillis
    }

    @Suppress("unused")
    fun alarmCanScheduleExactly(context: Context): Boolean {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        return am.canScheduleExactAlarms()
    }
}
