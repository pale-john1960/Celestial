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
import com.celestial.calendar.data.AppDatabase
import com.celestial.calendar.data.Settings
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.I18n
import com.celestial.calendar.engine.Jdn
import com.celestial.calendar.events.EventRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Celestial — classic 4x2 date widget (RemoteViews).
 *
 * Big today date in the active system, secondary system lines and the next
 * upcoming event. Refreshed at midnight via the shared WorkManager job and on
 * every configuration change.
 */
class DateWidget : AppWidgetProvider() {

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
            val big = "${I18n.num(locale, dayOfMonth(settings, today))} ${DateFormats.monthName(settings.system, locale, today)}"
            val yearLine = DateFormats.systemMonthYearEra(settings.system, locale, today)
            val secondary = buildSecondaryLine(settings, today)
            val nextEvent = buildNextEventText(context, settings, today)

            val contentIntent = PendingIntent.getActivity(
                context,
                1,
                Intent(context, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            for (id in appWidgetIds) {
                val views = RemoteViews(context.packageName, R.layout.widget_date).apply {
                    setTextViewText(R.id.widget_weekday, DateFormats.weekdayLong(locale, today))
                    setTextViewText(R.id.widget_date_big, big)
                    setTextViewText(R.id.widget_date_year, yearLine)
                    setTextViewText(R.id.widget_date_secondary, secondary)
                    setTextViewText(R.id.widget_date_next, nextEvent)
                    setOnClickPendingIntent(R.id.widget_root, contentIntent)
                }
                appWidgetManager.updateAppWidget(id, views)
            }
        }

        private fun appWidgetIds(context: Context): IntArray =
            AppWidgetManager.getInstance(context)
                .getAppWidgetIds(ComponentName(context, DateWidget::class.java))

        private fun dayOfMonth(settings: Settings, today: com.celestial.calendar.engine.CelestialDate): Int =
            when (settings.system) {
                com.celestial.calendar.engine.CalendarSystem.GREGORIAN -> today.gregorian.day
                com.celestial.calendar.engine.CalendarSystem.JALALI -> today.jalali.day
                com.celestial.calendar.engine.CalendarSystem.IMPERIAL -> today.imperial.day
            }

        private fun buildSecondaryLine(
            settings: Settings,
            today: com.celestial.calendar.engine.CelestialDate,
        ): String {
            val locale = settings.locale
            return when (settings.system) {
                com.celestial.calendar.engine.CalendarSystem.GREGORIAN ->
                    DateFormats.jalaliMonthYearEra(locale, today)
                com.celestial.calendar.engine.CalendarSystem.JALALI ->
                    DateFormats.gregorianMonthYearEra(locale, today)
                com.celestial.calendar.engine.CalendarSystem.IMPERIAL ->
                    DateFormats.gregorianMonthYearEra(locale, today) + " · " +
                            DateFormats.jalaliMonthYearEra(locale, today)
            }
        }

        /** First upcoming event within the next 60 days (localized name + day distance). */
        private suspend fun buildNextEventText(
            context: Context,
            settings: Settings,
            today: com.celestial.calendar.engine.CelestialDate,
        ): String {
            val locale = settings.locale
            val res = context.resources
            val prefix = res.getString(R.string.next_event)
            return try {
                val imported = if (settings.sources.imported) {
                    AppDatabase.get(context).importedEventDao().getAll()
                } else emptyList()
                val repo = EventRepository()
                val fromIso = today.iso
                val toG = Jdn.d2g(today.jdn + 60)
                val toIso = Jdn.isoDate(toG)
                val events = repo.aggregate(fromIso, toIso, settings.sources, imported)
                    .filter { !it.holidayOnly && it.iso != today.iso }
                val next = events.firstOrNull() ?: return prefix
                val days = Jdn.g2d(next.gregorian.year, next.gregorian.month, next.gregorian.day) - today.jdn
                val inDays = res.getString(R.string.in_days, days)
                val name = next.names.forLocale(locale.code)
                "$prefix: ${next.emoji} $name · $inDays"
            } catch (_: Exception) {
                prefix
            }
        }
    }
}
