package com.celestial.calendar.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.celestial.calendar.MainActivity
import com.celestial.calendar.R
import com.celestial.calendar.data.Settings
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.I18n
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Celestial — 4x5 month widget: a GridView fed by [MonthWidgetService]
 * showing the current month grid with today highlighted. Tapping a day opens
 * the app on that date.
 */
class MonthWidget : AppWidgetProvider() {

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

        suspend fun refresh(
            context: Context,
            settings: Settings,
            appWidgetManager: AppWidgetManager = AppWidgetManager.getInstance(context),
            appWidgetIds: IntArray = appWidgetIds(context),
        ) {
            if (appWidgetIds.isEmpty()) return

            val today = CalendarFacade.buildCelestialDate(CalendarFacade.todayGregorian())
            val locale: AppLocale = settings.locale
            val header = DateHeaderOf(settings, today)

            // Template intent: tapping any grid cell opens the app (extras merged per cell).
            val templateIntent = Intent(context, MainActivity::class.java)
            val template = PendingIntent.getActivity(
                context,
                2,
                templateIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            for (id in appWidgetIds) {
                val views = RemoteViews(context.packageName, R.layout.widget_month).apply {
                    setTextViewText(R.id.widget_month_header, header)
                    setOnClickPendingIntent(R.id.widget_month_header, template)

                    val serviceIntent = Intent(context, MonthWidgetService::class.java).apply {
                        data = Uri.parse("widget://month/$id")
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id)
                    }
                    setRemoteAdapter(R.id.widget_grid, serviceIntent)
                    setPendingIntentTemplate(R.id.widget_grid, template)
                    setEmptyView(R.id.widget_grid, R.id.widget_grid_empty)
                }
                appWidgetManager.updateAppWidget(id, views)
                appWidgetManager.notifyAppWidgetViewDataChanged(id, R.id.widget_grid)
            }
        }

        private fun DateHeaderOf(
            settings: Settings,
            today: com.celestial.calendar.engine.CelestialDate,
        ): String {
            val (y, m) = when (settings.system) {
                com.celestial.calendar.engine.CalendarSystem.GREGORIAN ->
                    today.gregorian.year to today.gregorian.month
                com.celestial.calendar.engine.CalendarSystem.JALALI ->
                    today.jalali.year to today.jalali.month
                com.celestial.calendar.engine.CalendarSystem.IMPERIAL ->
                    today.imperial.year to today.imperial.month
            }
            val monthName = I18n.monthNameOf(settings.system, settings.locale, y, m)
            return "$monthName ${I18n.num(settings.locale, y)}"
        }

        private fun appWidgetIds(context: Context): IntArray =
            AppWidgetManager.getInstance(context)
                .getAppWidgetIds(ComponentName(context, MonthWidget::class.java))
    }
}
