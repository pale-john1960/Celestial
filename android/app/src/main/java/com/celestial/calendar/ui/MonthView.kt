package com.celestial.calendar.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.DayCell
import com.celestial.calendar.engine.I18n
import com.celestial.calendar.engine.WeekStart
import com.celestial.calendar.events.EventInstance
import com.celestial.calendar.ui.theme.categoryColor

/**
 * Celestial — month view: 7-column grid, weekday header per weekStart,
 * weekend red styling (fa: Thu/Fri; others Sat/Sun), holiday cells with red
 * tint + 🌙, today highlight ring, small secondary date number, and event
 * dots by category color.
 */
@Composable
fun MonthView(
    system: CalendarSystem,
    locale: AppLocale,
    weekStart: WeekStart,
    navYear: Int,
    navMonth: Int,
    todayIso: String,
    eventsByIso: Map<String, List<EventInstance>>,
    selectedIso: String?,
    strings: LocalStrings,
    onSelectDay: (String?) -> Unit,
) {
    val cells: List<DayCell> = remember(system, locale, weekStart, navYear, navMonth, todayIso) {
        val today = CalendarFacade.todayGregorian()
        CalendarFacade.monthGrid(system, navYear, navMonth, weekStart, today)
    }
    val order = remember(weekStart) { CalendarFacade.weekdayOrder(weekStart) }
    val weekendDays = remember(locale) {
        if (locale == AppLocale.FA) setOf(4, 5) else setOf(0, 6) // fa: Thu/Fri; others Sun/Sat
    }

    Column(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 6.dp)
    ) {
        // weekday header
        Row(Modifier.fillMaxWidth()) {
            order.forEach { wd ->
                val isWeekend = wd in weekendDays
                Text(
                    I18n.weekdayShort(locale, wd),
                    modifier = Modifier
                        .weight(1f)
                        .padding(vertical = 4.dp),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelMedium,
                    color = if (isWeekend) MaterialTheme.colorScheme.error
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }

        // 6 rows x 7 columns
        Column(
            Modifier
                .fillMaxWidth()
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            cells.chunked(7).forEach { week ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    week.forEach { cell ->
                        DayCellView(
                            cell = cell,
                            system = system,
                            locale = locale,
                            weekendDays = weekendDays,
                            events = eventsByIso[cell.date.iso] ?: emptyList(),
                            isSelected = selectedIso == cell.date.iso,
                            onClick = {
                                onSelectDay(if (selectedIso == cell.date.iso) null else cell.date.iso)
                            },
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight(),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DayCellView(
    cell: DayCell,
    system: CalendarSystem,
    locale: AppLocale,
    weekendDays: Set<Int>,
    events: List<EventInstance>,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val isToday = cell.isToday
    val isHoliday = events.any { it.isHoliday || it.holidayOnly }
    val isWeekend = cell.date.weekday in weekendDays

    val contentAlpha = if (cell.inMonth) 1f else 0.35f

    val dayText = DateFormats.dayNumber(system, locale, cell.date)
    val secondaryText = DateFormats.secondaryDayNumber(system, locale, cell.date)

    val base = if (isToday) {
        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f)
    } else if (isSelected) {
        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
    } else if (isHoliday && cell.inMonth) {
        MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.25f)
    } else {
        Color.Transparent
    }

    Box(
        modifier
            .fillMaxHeight()
            .clip(RoundedCornerShape(10.dp))
            .background(base)
            .then(
                if (isToday) {
                    Modifier.border(
                        BorderStroke(2.dp, MaterialTheme.colorScheme.primary),
                        RoundedCornerShape(10.dp),
                    )
                } else Modifier
            )
            .clickable(onClick = onClick),
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .padding(top = 3.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Text(
                    dayText,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = if (isToday) FontWeight.Bold else FontWeight.Medium,
                    color = when {
                        !cell.inMonth -> MaterialTheme.colorScheme.onSurfaceVariant
                        isHoliday -> MaterialTheme.colorScheme.error
                        isWeekend -> MaterialTheme.colorScheme.error.copy(alpha = 0.8f)
                        else -> MaterialTheme.colorScheme.onSurface
                    }.copy(alpha = if (cell.inMonth) 1f else contentAlpha),
                )
                if (isHoliday && cell.inMonth) {
                    Text(
                        "🌙",
                        fontSize = 8.sp,
                        modifier = Modifier.padding(start = 1.dp),
                    )
                }
            }
            Text(
                secondaryText,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = contentAlpha),
            )
            Box(Modifier.weight(1f))
            CommonUi.EventDots(events)
            Box(Modifier.height(4.dp))
        }
    }
}
