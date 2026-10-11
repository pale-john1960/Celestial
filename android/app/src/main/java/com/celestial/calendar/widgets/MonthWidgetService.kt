package com.celestial.calendar.widgets

import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.celestial.calendar.R
import com.celestial.calendar.data.AppDatabase
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.I18n
import com.celestial.calendar.engine.Jdn
import com.celestial.calendar.engine.WeekStart
import com.celestial.calendar.events.EventRepository
import kotlinx.coroutines.runBlocking

/**
 * Celestial — RemoteViewsService feeding the month widget's GridView.
 *
 * The adapter renders 49 cells: 7 weekday header labels followed by the
 * 42-cell month grid (active system + week-start, today highlighted with the
 * #C2185B accent circle, holiday days tinted red, out-of-month days dimmed).
 */
class MonthWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory =
        MonthFactory(applicationContext)
}

private class MonthFactory(private val context: android.content.Context) :
    RemoteViewsService.RemoteViewsFactory {

    private data class Cell(
        val text: String,
        val textColor: Int,
        val bold: Boolean = false,
        val today: Boolean = false,
        val iso: String? = null,
    )

    private var cells: List<Cell> = emptyList()

    override fun onCreate() = Unit

    override fun onDataSetChanged() {
        runBlocking {
            val settings = WidgetUpdater.currentSettings(context)
            val todayG = CalendarFacade.todayGregorian()
            val todayIso = Jdn.isoDate(todayG)
            val system = settings.system
            val locale = settings.locale
            val weekStart = settings.weekStart

            // current month in system space
            val sd = CalendarFacade.systemDateOf(system, todayG)
            val grid = CalendarFacade.monthGrid(system, sd.year, sd.month, weekStart, todayG)

            // holiday lookup for red tint
            val holidayIsos: Set<String> = try {
                val imported = if (settings.sources.imported) {
                    AppDatabase.get(context).importedEventDao().getAll()
                } else emptyList()
                val repo = EventRepository()
                val fromIso = grid.first().date.iso
                val toIso = grid.last().date.iso
                repo.aggregate(fromIso, toIso, settings.sources, imported)
                    .filter { it.isHoliday || it.holidayOnly }
                    .map { it.iso }
                    .toSet()
            } catch (_: Exception) {
                emptySet()
            }

            val out = ArrayList<Cell>(49)
            // weekday header row (positions 0-6)
            for (w in CalendarFacade.weekdayOrder(weekStart)) {
                out.add(Cell(I18n.weekdayShort(locale, w), Color.parseColor("#B39D9E")))
            }
            // day cells
            for (cell in grid) {
                // day number in the ACTIVE system (imperialSolar rides the
                // Jalali structure; ancient shares the Imperial structure)
                val day = CalendarFacade.systemTripleOf(system, cell.date).day
                val isToday = cell.isToday && cell.date.iso == todayIso
                val isHoliday = cell.date.iso in holidayIsos
                val color = when {
                    isToday -> Color.WHITE
                    isHoliday -> Color.parseColor("#FF8A9A")
                    cell.inMonth -> Color.parseColor("#F6EFEF")
                    else -> Color.parseColor("#6E5F62")
                }
                out.add(
                    Cell(
                        text = I18n.num(locale, day),
                        textColor = color,
                        bold = isToday,
                        today = isToday,
                        iso = cell.date.iso,
                    )
                )
            }
            cells = out
        }
    }

    override fun onDestroy() = Unit

    override fun getCount(): Int = cells.size

    override fun getViewAt(position: Int): RemoteViews {
        val rv = RemoteViews(context.packageName, R.layout.widget_month_cell)
        val cell = cells.getOrNull(position) ?: return rv
        rv.setTextViewText(R.id.cell_text, cell.text)
        rv.setTextColor(R.id.cell_text, cell.textColor)
        if (cell.today) {
            rv.setInt(R.id.cell_text, "setBackgroundResource", R.drawable.widget_today_circle)
        } else {
            rv.setInt(R.id.cell_text, "setBackgroundResource", 0)
        }
        cell.iso?.let { iso ->
            val fill = Intent()
            fill.putExtra(WidgetUpdater.EXTRA_DATE, iso)
            rv.setOnClickFillInIntent(R.id.cell_text, fill)
        }
        return rv
    }

    override fun getLoadingView(): RemoteViews? = null

    override fun getViewTypeCount(): Int = 1

    override fun getItemId(position: Int): Long = position.toLong()

    override fun hasStableIds(): Boolean = true
}
