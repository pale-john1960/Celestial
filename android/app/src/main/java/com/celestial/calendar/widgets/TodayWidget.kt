package com.celestial.calendar.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.celestial.calendar.MainActivity
import com.celestial.calendar.R
import com.celestial.calendar.data.Settings
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.CelestialDate
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.I18n
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Celestial — compact 2x1 "Today" widget (RemoteViews).
 *
 * Weekday name, a huge day-of-month number and a month + year line — all in
 * the ACTIVE calendar system — over the magenta accent bar on the compact
 * card. Refreshed together with the other widgets at midnight and on every
 * configuration change (see [WidgetUpdater.updateAll]).
 */
class TodayWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val settings = WidgetUpdater.currentSettings(context)
                refresh(context, settings, appWidgetManager, appWidgetIds)
            } finally {
                pending.finish()
            }
        }
    }

    companion object {

        /** Rebuild the widget for every placed instance. */
        suspend fun refresh(
            context: Context,
            settings: Settings,
            appWidgetManager: AppWidgetManager = AppWidgetManager.getInstance(context),
            appWidgetIds: IntArray = appWidgetIds(context),
        ) {
            if (appWidgetIds.isEmpty()) return

            val today = WidgetUpdater.todayDate()
            val locale = settings.locale
            val weekday = DateFormats.weekdayLong(locale, today)
            val day = I18n.num(locale, dayOfMonth(settings, today))
            val monthYear = DateFormats.systemMonthYear(
                settings.system, locale, today, settings.royalMonthNames,
            )

            val contentIntent = PendingIntent.getActivity(
                context,
                3,
                Intent(context, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            for (id in appWidgetIds) {
                val views = RemoteViews(context.packageName, R.layout.widget_today).apply {
                    setTextViewText(R.id.widget_today_weekday, weekday)
                    setTextViewText(R.id.widget_today_day, day)
                    setTextViewText(R.id.widget_today_month, monthYear)
                    setOnClickPendingIntent(R.id.widget_today_root, contentIntent)
                }
                appWidgetManager.updateAppWidget(id, views)
            }
        }

        private fun appWidgetIds(context: Context): IntArray =
            AppWidgetManager.getInstance(context)
                .getAppWidgetIds(ComponentName(context, TodayWidget::class.java))

        /** Same rule as DateWidget: the day number of the ACTIVE system
         *  (imperialSolar rides the Jalali structure; ancient shares the
         *  Imperial 12×30 + Andarjah structure). */
        private fun dayOfMonth(settings: Settings, today: CelestialDate): Int =
            when (settings.system) {
                CalendarSystem.GREGORIAN -> today.gregorian.day
                CalendarSystem.JALALI,
                CalendarSystem.IMPERIAL_SOLAR -> today.jalali.day
                CalendarSystem.IMPERIAL,
                CalendarSystem.ANCIENT -> today.imperial.day
            }
    }
}
