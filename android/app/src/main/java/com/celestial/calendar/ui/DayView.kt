package com.celestial.calendar.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.CelestialDate
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.events.EventInstance

/**
 * Celestial — day view: full date in all systems + hijri + (imperial:
 * devotional day name), "Day off" banner for holidays, and the event list.
 */
@Composable
fun DayView(
    system: CalendarSystem,
    locale: AppLocale,
    date: CelestialDate,
    events: List<EventInstance>,
    strings: LocalStrings,
    onPrevDay: () -> Unit,
    onNextDay: () -> Unit,
) {
    val isHoliday = events.any { it.isHoliday || it.holidayOnly }
    val visibleEvents = remember(events) { events.filter { !it.holidayOnly } }

    LazyColumn(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        item {
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(top = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = onPrevDay) {
                    Icon(Icons.Filled.KeyboardArrowLeft, contentDescription = strings.prevMonth)
                }
                Column(
                    Modifier
                        .weight(1f)
                        .padding(horizontal = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        DateFormats.weekdayLong(locale, date),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        DateFormats.fullSystemDate(system, locale, date),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                    )
                }
                IconButton(onClick = onNextDay) {
                    Icon(Icons.Filled.KeyboardArrowRight, contentDescription = strings.nextMonth)
                }
            }
        }

        if (isHoliday) {
            item { CommonUi.DayOffBanner(strings) }
        }

        item {
            AllSystemsCard(system, locale, date, strings)
        }

        item {
            Text(
                if (visibleEvents.isEmpty()) strings.noEvents else strings.upcoming,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 10.dp, bottom = 4.dp),
            )
        }

        items(visibleEvents, key = { it.id }) { event ->
            CommonUi.EventCard(event, locale, strings)
        }

        item { Spacer(Modifier.height(24.dp)) }
    }
}

/** All four calendar systems + imperial devotional day name. */
@Composable
private fun AllSystemsCard(
    system: CalendarSystem,
    locale: AppLocale,
    date: CelestialDate,
    strings: LocalStrings,
) {
    androidx.compose.material3.Surface(
        shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            SystemLine(
                label = strings.systemGregorian,
                value = DateFormats.fullGregorian(locale, date),
                active = system == CalendarSystem.GREGORIAN,
            )
            SystemLine(
                label = strings.systemJalali,
                value = DateFormats.fullJalali(locale, date),
                active = system == CalendarSystem.JALALI,
            )
            SystemLine(
                label = strings.systemImperial,
                value = DateFormats.fullImperial(locale, date),
                active = system == CalendarSystem.IMPERIAL,
            )
            if (system == CalendarSystem.IMPERIAL || date.imperial.month == 13) {
                SystemLine(
                    label = strings.dayNameLabel,
                    value = CalendarFacade.imperialDayName(locale, date.imperial),
                    active = false,
                )
            }
            SystemLine(
                label = strings.hijriLabel,
                value = DateFormats.fullHijri(locale, date),
                active = false,
            )
        }
    }
}

@Composable
private fun SystemLine(label: String, value: String, active: Boolean) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(end = 8.dp),
        )
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (active) FontWeight.Bold else FontWeight.Normal,
            color = if (active) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
        )
    }
}
