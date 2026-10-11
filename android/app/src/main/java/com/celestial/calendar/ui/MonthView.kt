package com.celestial.calendar.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
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
import com.celestial.calendar.engine.MoonEngine
import com.celestial.calendar.engine.SeasonEvent
import com.celestial.calendar.engine.SolsticeEngine
import com.celestial.calendar.engine.WeekStart
import com.celestial.calendar.engine.WeekendDay
import com.celestial.calendar.events.EventInstance

/**
 * Celestial — month view: 7-column grid, weekday header per weekStart,
 * weekend red styling (fa: Thu/Fri; others Sat/Sun), holiday cells with red
 * tint + 🌙 (weekly day-offs get the SAME styling, now driven by the
 * weekendDay setting — round 14 port of the web's isWeeklyDayOff), distinct
 * bordered surface tiles per day cell, today highlight ring, small secondary
 * date number, event dots by category color, and a tiny bottom-end glyph
 * cluster (moon phase + season marker) on major-phase / solstice / equinox
 * days.
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
    weekendDay: WeekendDay,
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

        // 6 rows x 7 columns (3dp gaps — tiles need clear separation)
        Column(
            Modifier
                .fillMaxWidth()
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(3.dp),
        ) {
            cells.chunked(7).forEach { week ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    week.forEach { cell ->
                        DayCellView(
                            cell = cell,
                            system = system,
                            locale = locale,
                            weekendDays = weekendDays,
                            weekendDay = weekendDay,
                            events = eventsByIso[cell.date.iso] ?: emptyList(),
                            isSelected = selectedIso == cell.date.iso,
                            strings = strings,
                            // always reports the tapped day — the parent decides
                            // select vs. open-day (2nd tap opens the Day view)
                            onClick = { onSelectDay(cell.date.iso) },
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
    weekendDay: WeekendDay,
    events: List<EventInstance>,
    isSelected: Boolean,
    strings: LocalStrings,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val isToday = cell.isToday
    val isHoliday = events.any { it.isHoliday || it.holidayOnly }
    // Weekly day off (round 14 — user-configurable, was the hardcoded fa
    // Friday): every weekly day-off day gets the full holiday STYLING (red
    // date number + red tint + 🌙 corner), same as event holidays. STYLING
    // ONLY: no event is fabricated, so dots / moon/season glyphs / a11y stay
    // purely event-driven (web parity).
    val weeklyDayOff = CalendarFacade.isWeeklyDayOff(weekendDay, locale, cell.date.weekday)
    val dayOff = isHoliday || weeklyDayOff
    val isWeekend = cell.date.weekday in weekendDays
    val moonMajor = remember(cell.date.iso) { MoonEngine.infoFor(cell.date.gregorian).major }
    val seasonEvent = remember(cell.date.iso) { SolsticeEngine.eventOn(cell.date.gregorian)?.event }

    val contentAlpha = if (cell.inMonth) 1f else 0.35f

    val dayText = DateFormats.dayNumber(system, locale, cell.date)
    val secondaryText = DateFormats.secondaryDayNumber(system, locale, cell.date)

    // Background precedence (explicit, like the web): today > selected >
    // day-off tint > plain tile. Every cell sits on a distinct surface tile
    // with a hairline outline so neighboring days are easy to tell apart.
    val shape = RoundedCornerShape(8.dp)
    val tileBorder = BorderStroke(0.5.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))

    Box(
        modifier
            .fillMaxHeight()
            .clip(shape)
            .background(MaterialTheme.colorScheme.surface)
            .then(
                if (dayOff && cell.inMonth && !isToday && !isSelected) {
                    Modifier.background(MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.25f))
                } else Modifier
            )
            .then(
                if (isToday) {
                    Modifier.background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f))
                } else if (isSelected) {
                    Modifier.background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f))
                } else Modifier
            )
            .border(tileBorder, shape)
            .then(
                if (isToday) {
                    Modifier.border(
                        BorderStroke(2.dp, MaterialTheme.colorScheme.primary),
                        shape,
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
                        dayOff -> MaterialTheme.colorScheme.error
                        isWeekend -> MaterialTheme.colorScheme.error.copy(alpha = 0.8f)
                        else -> MaterialTheme.colorScheme.onSurface
                    }.copy(alpha = if (cell.inMonth) 1f else contentAlpha),
                )
                if (dayOff && cell.inMonth) {
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
            Box(
                Modifier.fillMaxWidth(),
                // start-align the dots on glyph days so they never collide with
                // the bottom-end cluster (same rule as the web app)
                contentAlignment = if (moonMajor != null || seasonEvent != null) {
                    Alignment.CenterStart
                } else Alignment.Center,
            ) {
                CommonUi.EventDots(events)
            }
            Box(Modifier.height(4.dp))
        }

        // bottom-end glyph cluster: moon major-phase + season marker
        if (moonMajor != null || seasonEvent != null) {
            Row(
                Modifier
                    .align(Alignment.BottomEnd)
                    .padding(2.dp)
                    .alpha(0.6f),
                horizontalArrangement = Arrangement.spacedBy(1.dp),
            ) {
                if (moonMajor != null) {
                    Text(MoonEngine.majorGlyph(moonMajor), fontSize = 9.sp)
                }
                if (seasonEvent != null) {
                    SeasonGlyph(seasonEvent, strings)
                }
            }
        }
    }
}

/** Tiny season marker glyph with a localized content description. */
@Composable
private fun SeasonGlyph(event: SeasonEvent, strings: LocalStrings) {
    val name = strings.seasonEventName(event)
    Text(
        SolsticeEngine.glyphOf(event),
        fontSize = 9.sp,
        modifier = Modifier.semantics { contentDescription = strings.seasonGlyphDesc(name) },
    )
}
