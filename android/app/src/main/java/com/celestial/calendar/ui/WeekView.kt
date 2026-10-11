package com.celestial.calendar.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.CelestialDate
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.I18n
import com.celestial.calendar.engine.Jdn
import com.celestial.calendar.engine.MoonEngine
import com.celestial.calendar.engine.MoonMajor
import com.celestial.calendar.engine.SolsticeEngine
import com.celestial.calendar.engine.WeekStart
import com.celestial.calendar.engine.WeekendDay
import com.celestial.calendar.events.EventInstance

/**
 * Celestial — week view: the 7 days (starting at the user's weekStart) of the
 * week containing the selected day, one card per day in a vertical list
 * (mobile-first, lowest power). Each card shows the weekday, the day number
 * in the active system (+ secondary system and — behind the showHijri
 * setting — the Hijri date, tiny), holiday styling, the end-corner glyph
 * cluster (moon phase + season marker) and the day's events in the same card
 * style as the Day view.
 */
@Composable
fun WeekView(
    system: CalendarSystem,
    locale: AppLocale,
    weekStart: WeekStart,
    todayIso: String,
    selectedIso: String,
    eventsByIso: Map<String, List<EventInstance>>,
    showHijri: Boolean,
    weekendDay: WeekendDay,
    strings: LocalStrings,
    onPrevWeek: () -> Unit,
    onNextWeek: () -> Unit,
    onThisWeek: () -> Unit,
    onOpenDay: (String) -> Unit,
) {
    val anchor = remember(selectedIso) { Jdn.parseIso(selectedIso) } ?: return
    val days: List<CelestialDate> = remember(selectedIso, weekStart) {
        val anchorJdn = Jdn.toJdn(anchor)
        val offset = ((Jdn.jdnWeekday(anchorJdn) - weekStart.weekday) % 7 + 7) % 7
        val startJdn = anchorJdn - offset
        (0 until 7).map { CalendarFacade.buildCelestialDate(Jdn.d2g(startJdn + it)) }
    }
    val weekLabel = remember(days, system, locale) {
        weekLabelOf(system, locale, days.first(), days.last())
    }
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl

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
                IconButton(onClick = onPrevWeek) {
                    Icon(
                        if (rtl) Icons.Filled.KeyboardArrowRight else Icons.Filled.KeyboardArrowLeft,
                        contentDescription = strings.prevWeek,
                    )
                }
                Column(
                    Modifier
                        .weight(1f)
                        .padding(horizontal = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        weekLabel,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    )
                    TextButton(onClick = onThisWeek) {
                        Text(strings.thisWeek)
                    }
                }
                IconButton(onClick = onNextWeek) {
                    Icon(
                        if (rtl) Icons.Filled.KeyboardArrowLeft else Icons.Filled.KeyboardArrowRight,
                        contentDescription = strings.nextWeek,
                    )
                }
            }
        }

        items(days, key = { it.iso }) { date ->
            WeekDayCard(
                date = date,
                system = system,
                locale = locale,
                isToday = date.iso == todayIso,
                showHijri = showHijri,
                weekendDay = weekendDay,
                events = eventsByIso[date.iso] ?: emptyList(),
                strings = strings,
                onOpenDay = { onOpenDay(date.iso) },
            )
        }

        item { Spacer(Modifier.height(24.dp)) }
    }
}

@Composable
private fun WeekDayCard(
    date: CelestialDate,
    system: CalendarSystem,
    locale: AppLocale,
    isToday: Boolean,
    showHijri: Boolean,
    weekendDay: WeekendDay,
    events: List<EventInstance>,
    strings: LocalStrings,
    onOpenDay: () -> Unit,
) {
    val isHoliday = events.any { it.isHoliday || it.holidayOnly }
    val visible = remember(events) { events.filter { !it.holidayOnly } }
    val dayOffOnly = remember(events) { events.any { it.holidayOnly } }
    val moonMajor = remember(date.iso) { MoonEngine.infoFor(date.gregorian).major }
    val seasonEvent = remember(date.iso) { SolsticeEngine.eventOn(date.gregorian)?.event }
    // weekly day off (round 14, user-configurable) — soft red weekday label
    // (the full holiday treatment stays event-driven below)
    val weeklyDayOff = CalendarFacade.isWeeklyDayOff(weekendDay, locale, date.weekday)

    Surface(
        shape = RoundedCornerShape(14.dp),
        color = when {
            isToday -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
            isHoliday -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.18f)
            else -> MaterialTheme.colorScheme.surface
        },
        border = BorderStroke(
            if (isToday) 2.dp else 1.dp,
            if (isToday) MaterialTheme.colorScheme.primary
            else MaterialTheme.colorScheme.outline.copy(alpha = 0.4f),
        ),
        modifier = Modifier.fillMaxWidth(),
        onClick = onOpenDay,
    ) {
        Column(Modifier.padding(12.dp)) {
            // header: weekday + big active-system number + secondary/Hijri tiny
            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Column(Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text(
                            DateFormats.weekdayLong(locale, date),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = when {
                                isToday -> MaterialTheme.colorScheme.primary
                                isHoliday -> MaterialTheme.colorScheme.error
                                // weekly day off (setting-driven) — soft red
                                weeklyDayOff -> MaterialTheme.colorScheme.error.copy(alpha = 0.8f)
                                else -> MaterialTheme.colorScheme.onSurfaceVariant
                            },
                        )
                        Text(
                            DateFormats.dayNumber(system, locale, date),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = when {
                                isToday -> MaterialTheme.colorScheme.primary
                                isHoliday -> MaterialTheme.colorScheme.error
                                else -> MaterialTheme.colorScheme.onSurface
                            },
                        )
                        if (isHoliday) {
                            Text("🌙", fontSize = 12.sp)
                        }
                    }
                    Text(
                        secondaryLine(system, locale, date, showHijri),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                // end-corner glyph cluster: moon phase + season marker
                if (moonMajor != null || seasonEvent != null) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.alpha(0.6f),
                    ) {
                        if (moonMajor != null) {
                            Text(MoonEngine.majorGlyph(moonMajor), fontSize = 14.sp)
                        }
                        if (seasonEvent != null) {
                            val seasonName = strings.seasonEventName(seasonEvent)
                            Text(
                                SolsticeEngine.glyphOf(seasonEvent),
                                fontSize = 14.sp,
                                modifier = Modifier.semantics {
                                    contentDescription = strings.seasonGlyphDesc(seasonName)
                                },
                            )
                        }
                    }
                }
            }

            // events (same card style as the Day view)
            if (dayOffOnly) {
                DayOffChip(strings, Modifier.padding(top = 8.dp))
            }
            if (visible.isEmpty() && !dayOffOnly) {
                Text(
                    strings.noEvents,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
            visible.forEach { event ->
                CommonUi.EventCard(event, locale, strings)
            }
        }
    }
}

/** Compact "day off" chip for holidayOnly days (event text stays hidden). */
@Composable
private fun DayOffChip(strings: LocalStrings, modifier: Modifier = Modifier) {
    Surface(
        shape = RoundedCornerShape(50),
        color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f),
        modifier = modifier,
    ) {
        Text(
            "🌙 " + strings.dayOff,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.error,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
        )
    }
}

/** Secondary-system date + Hijri date (Hijri gated behind showHijri) —
 *  round 14 web parity: every NON-Gregorian system shows the Gregorian date,
 *  Gregorian shows the Jalali one, e.g. "12 October" / "12 Mehr · 4 Rabiʿ II". */
private fun secondaryLine(
    system: CalendarSystem,
    locale: AppLocale,
    date: CelestialDate,
    showHijri: Boolean,
): String {
    val secondary = if (system == CalendarSystem.GREGORIAN) {
        "${I18n.num(locale, date.jalali.day)} ${I18n.jalaliMonthName(locale, date.jalali.month)}"
    } else {
        "${I18n.num(locale, date.gregorian.day)} ${I18n.gregorianMonthName(locale, date.gregorian.month)}"
    }
    if (!showHijri) return secondary
    val hijri = "${I18n.num(locale, date.hijri.day)} ${I18n.hijriMonthName(locale, date.hijri.month)}"
    return "$secondary · $hijri"
}

/** (year, month) of a day in the ACTIVE system (works for all 5). */
private fun systemYearMonth(system: CalendarSystem, date: CelestialDate): Pair<Int, Int> {
    val t = CalendarFacade.systemTripleOf(system, date)
    return t.year to t.month
}

/** Week label in the active system, e.g. "Mehr 24 – 30, 1405". */
private fun weekLabelOf(
    system: CalendarSystem,
    locale: AppLocale,
    first: CelestialDate,
    last: CelestialDate,
): String {
    val (y1, m1) = systemYearMonth(system, first)
    val (y2, m2) = systemYearMonth(system, last)
    val name1 = DateFormats.monthNameOf(system, locale, y1, m1)
    val name2 = DateFormats.monthNameOf(system, locale, y2, m2)
    val d1 = DateFormats.dayNumber(system, locale, first)
    val d2 = DateFormats.dayNumber(system, locale, last)
    val year = I18n.num(locale, y2)
    return if (m1 == m2 && y1 == y2) {
        "$name1 $d1 – $d2, $year"
    } else {
        "$name1 $d1 – $name2 $d2, $year"
    }
}
