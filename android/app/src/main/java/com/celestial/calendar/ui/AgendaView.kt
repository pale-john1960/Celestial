package com.celestial.calendar.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.CelestialDate
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.I18n
import com.celestial.calendar.engine.Jdn
import com.celestial.calendar.events.EventInstance
import com.celestial.calendar.ui.theme.eventColor

/**
 * Celestial — agenda view: the next 90 days as a grouped list (grouped by
 * month header in the active system), only days with visible events.
 */
@Composable
fun AgendaView(
    system: CalendarSystem,
    locale: AppLocale,
    todayIso: String,
    eventsByIso: Map<String, List<EventInstance>>,
    strings: LocalStrings,
    onOpenDay: (String) -> Unit,
) {
    val today = remember(todayIso) { Jdn.parseIso(todayIso) ?: CalendarFacade.todayGregorian() }
    val todayJdn = remember(today) { Jdn.toJdn(today) }

    val days: List<Pair<CelestialDate, List<EventInstance>>> = remember(todayIso, eventsByIso, system, locale) {
        (0 until 90).map { offset ->
            val g = Jdn.d2g(todayJdn + offset)
            val date = CalendarFacade.buildCelestialDate(g)
            date to (eventsByIso[date.iso] ?: emptyList())
        }.filter { (_, events) -> events.isNotEmpty() }
    }

    if (days.isEmpty()) {
        Column(
            Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("🗓", fontSize = 40.sp)
            Text(
                strings.noEvents,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        return
    }

    LazyColumn(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        var lastMonthKey = ""
        val grouped = ArrayList<Pair<String, Pair<CelestialDate, List<EventInstance>>>>()
        for ((date, events) in days) {
            val key = when (system) {
                CalendarSystem.GREGORIAN -> "${date.gregorian.year}-${date.gregorian.month}"
                CalendarSystem.JALALI -> "${date.jalali.year}-${date.jalali.month}"
                CalendarSystem.IMPERIAL -> "${date.imperial.year}-${date.imperial.month}"
            }
            if (key != lastMonthKey) {
                grouped.add(key to (date to emptyList()))
                lastMonthKey = key
            }
            grouped.add("" to (date to events))
        }

        items(grouped.size) { index ->
            val (key, pair) = grouped[index]
            val (date, events) = pair
            if (events.isEmpty()) {
                // month header
                val monthLabel = remember(key, date, system, locale) {
                    monthHeaderLabel(system, locale, date)
                }
                Text(
                    monthLabel,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 14.dp, bottom = 4.dp),
                )
            } else {
                AgendaDayRow(
                    date = date,
                    events = events,
                    system = system,
                    locale = locale,
                    strings = strings,
                    onOpenDay = { onOpenDay(date.iso) },
                )
            }
        }
        item { Spacer(Modifier.height(24.dp)) }
    }
}

private fun monthHeaderLabel(system: CalendarSystem, locale: AppLocale, date: CelestialDate): String =
    when (system) {
        CalendarSystem.GREGORIAN ->
            "${I18n.gregorianMonthName(locale, date.gregorian.month)} ${I18n.num(locale, date.gregorian.year)}"
        CalendarSystem.JALALI ->
            "${I18n.jalaliMonthName(locale, date.jalali.month)} ${I18n.num(locale, date.jalali.year)}"
        CalendarSystem.IMPERIAL ->
            "${I18n.jalaliMonthName(locale, date.imperial.month)} ${I18n.num(locale, date.imperial.year)}"
    }

@Composable
private fun AgendaDayRow(
    date: CelestialDate,
    events: List<EventInstance>,
    system: CalendarSystem,
    locale: AppLocale,
    strings: LocalStrings,
    onOpenDay: () -> Unit,
) {
    val isHoliday = events.any { it.isHoliday || it.holidayOnly }
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = if (isHoliday) {
            MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.18f)
        } else {
            MaterialTheme.colorScheme.surface
        },
        border = androidx.compose.foundation.BorderStroke(
            1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f),
        ),
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        onClick = onOpenDay,
    ) {
        Row(
            Modifier.padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    DateFormats.dayNumber(system, locale, date),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = if (isHoliday) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    DateFormats.weekdayShort(locale, date),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                events.forEach { event ->
                    if (!event.holidayOnly) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            // per-event color (Task 9) — mirrors the web's colored agenda rows
                            Box(
                                Modifier
                                    .size(7.dp)
                                    .background(eventColor(event), CircleShape)
                            )
                            Text(event.emoji, fontSize = 14.sp)
                            Text(
                                event.localName(locale.code),
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = if (event.isHoliday) MaterialTheme.colorScheme.error
                                else MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    }
                }
            }
        }
    }
}
