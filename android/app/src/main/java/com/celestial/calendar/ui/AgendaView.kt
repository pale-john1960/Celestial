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
import com.celestial.calendar.engine.WeekendDay
import com.celestial.calendar.events.EventInstance
import com.celestial.calendar.ui.theme.eventColor

/**
 * Celestial — agenda view: the next 90 days as a grouped list (grouped by
 * month header in the active system), only days with visible events.
 * Round 14: day rows show the FULL weekday name (was the truncated «یک» form)
 * and the day-off styling fires on legal holidays AND the weekly day off
 * (setting-driven, web parity).
 */
@Composable
fun AgendaView(
    system: CalendarSystem,
    locale: AppLocale,
    todayIso: String,
    eventsByIso: Map<String, List<EventInstance>>,
    weekendDay: WeekendDay,
    royalMonthNames: Boolean,
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
            // month key in the ACTIVE system's display space (works for all 5)
            val t = CalendarFacade.systemTripleOf(system, date)
            val key = "${t.year}-${t.month}"
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
                // month header (royal names for the imperial family)
                val monthLabel = remember(key, date, system, locale, royalMonthNames) {
                    monthHeaderLabel(system, locale, date, royalMonthNames)
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
                    weekendDay = weekendDay,
                    strings = strings,
                    onOpenDay = { onOpenDay(date.iso) },
                )
            }
        }
        item { Spacer(Modifier.height(24.dp)) }
    }
}

private fun monthHeaderLabel(
    system: CalendarSystem,
    locale: AppLocale,
    date: CelestialDate,
    royal: Boolean,
): String {
    val t = CalendarFacade.systemTripleOf(system, date)
    return "${CalendarFacade.systemMonthName(system, locale, t.month, royal)} ${I18n.num(locale, t.year)}"
}

@Composable
private fun AgendaDayRow(
    date: CelestialDate,
    events: List<EventInstance>,
    system: CalendarSystem,
    locale: AppLocale,
    weekendDay: WeekendDay,
    strings: LocalStrings,
    onOpenDay: () -> Unit,
) {
    val isHoliday = events.any { it.isHoliday || it.holidayOnly }
    // day-off styling: legal holidays + the weekly day off (round 14,
    // setting-driven — web parity with the agenda's day-off badge)
    val isDayOff = isHoliday || CalendarFacade.isWeeklyDayOff(weekendDay, locale, date.weekday)
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = if (isDayOff) {
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
                    color = if (isDayOff) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface,
                )
                // round 14: FULL weekday name (the truncated «یک»/«دو» forms
                // were confusing outside the month-grid header row)
                Text(
                    DateFormats.weekdayLong(locale, date),
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
