package com.celestial.calendar.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
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

/**
 * Celestial — year overview: 12 (13 in Imperial mode, incl. Andarjah) month
 * cards with mini month grids + event dots. A compact year switcher on top;
 * tapping a card opens that month.
 */
@Composable
fun YearView(
    system: CalendarSystem,
    locale: AppLocale,
    weekStart: WeekStart,
    navYear: Int,
    todayIso: String,
    eventsByIso: Map<String, List<EventInstance>>,
    strings: LocalStrings,
    onOpenMonth: (Int) -> Unit,
    onShiftYear: (Int) -> Unit,
) {
    val today = remember(todayIso) { CalendarFacade.todayGregorian() }
    val months = remember(system, navYear) { CalendarFacade.yearMonths(system, navYear) }
    val order = remember(weekStart) { CalendarFacade.weekdayOrder(weekStart) }

    Column(Modifier.fillMaxWidth()) {
        // year switcher (‹ 1405 ›) — mirrors the web year stepper
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            IconButton(onClick = { onShiftYear(-1) }) {
                Icon(Icons.Filled.KeyboardArrowLeft, contentDescription = strings.prevYear)
            }
            Text(
                I18n.num(locale, navYear),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(horizontal = 12.dp),
            )
            IconButton(onClick = { onShiftYear(1) }) {
                Icon(Icons.Filled.KeyboardArrowRight, contentDescription = strings.nextYear)
            }
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(months) { (monthIndex, firstG) ->
                MiniMonthCard(
                    monthIndex = monthIndex,
                    firstG = firstG,
                    system = system,
                    locale = locale,
                    weekStart = weekStart,
                    order = order,
                    today = today,
                    eventsByIso = eventsByIso,
                    onOpenMonth = { onOpenMonth(monthIndex) },
                )
            }
        }
    }
}

@Composable
private fun MiniMonthCard(
    monthIndex: Int,
    firstG: com.celestial.calendar.engine.SimpleDate,
    system: CalendarSystem,
    locale: AppLocale,
    weekStart: WeekStart,
    order: List<Int>,
    today: com.celestial.calendar.engine.SimpleDate,
    eventsByIso: Map<String, List<EventInstance>>,
    onOpenMonth: () -> Unit,
) {
    val year = remember(firstG) {
        CalendarFacade.systemDateOf(system, firstG).year
    }
    val cells: List<DayCell> = remember(system, year, monthIndex, weekStart, today) {
        CalendarFacade.monthGrid(system, year, monthIndex, weekStart, today)
    }
    val monthName = DateFormats.monthNameOf(system, locale, year, monthIndex)

    Surface(
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(
            1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f),
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpenMonth),
    ) {
        Column(Modifier.padding(8.dp)) {
            Text(
                monthName,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 4.dp),
                textAlign = TextAlign.Center,
            )
            // weekday header
            Row(Modifier.fillMaxWidth()) {
                order.forEach { wd ->
                    Text(
                        I18n.weekdayShort(locale, wd).take(1),
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center,
                        fontSize = 8.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
                cells.chunked(7).forEach { week ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(1.dp)) {
                        week.forEach { cell ->
                            val events = eventsByIso[cell.date.iso]
                            val isToday = cell.isToday
                            val isHoliday = events?.any { it.isHoliday || it.holidayOnly } == true
                            val day = when (system) {
                                CalendarSystem.GREGORIAN -> cell.date.gregorian.day
                                CalendarSystem.JALALI -> cell.date.jalali.day
                                CalendarSystem.IMPERIAL -> cell.date.imperial.day
                            }
                            Column(
                                Modifier.weight(1f),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Box(
                                    Modifier
                                        .size(14.dp)
                                        .then(
                                            if (isToday) {
                                                Modifier
                                                    .clip(CircleShape)
                                                    .background(MaterialTheme.colorScheme.primary)
                                                    .border(
                                                        1.5.dp,
                                                        MaterialTheme.colorScheme.primary,
                                                        CircleShape,
                                                    )
                                            } else Modifier
                                        ),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Text(
                                        I18n.num(locale, day),
                                        fontSize = 8.sp,
                                        textAlign = TextAlign.Center,
                                        color = when {
                                            isToday -> Color.White
                                            !cell.inMonth -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.25f)
                                            isHoliday -> MaterialTheme.colorScheme.error
                                            else -> MaterialTheme.colorScheme.onSurface
                                        },
                                        fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
                                    )
                                }
                                val dots = events?.filter { !it.holidayOnly }?.map { it.category }?.distinct()
                                if (!dots.isNullOrEmpty()) {
                                    Box(
                                        Modifier
                                            .size(3.dp)
                                            .background(
                                                com.celestial.calendar.ui.theme.categoryColor(dots.first()),
                                                CircleShape,
                                            )
                                    )
                                } else {
                                    Box(Modifier.size(3.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
