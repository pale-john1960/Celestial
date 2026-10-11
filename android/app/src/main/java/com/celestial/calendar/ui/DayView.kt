package com.celestial.calendar.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.CelestialDate
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.HoroscopeEngine
import com.celestial.calendar.engine.I18n
import com.celestial.calendar.engine.MoonEngine
import com.celestial.calendar.engine.SeasonInfo
import com.celestial.calendar.engine.SolsticeEngine
import com.celestial.calendar.events.EventInstance
import kotlin.math.roundToInt

/**
 * Celestial — day view: full date in all systems + (imperial: devotional day
 * name) + optional Hijri row (setting), "Day off" banner for holidays, the
 * astronomy card (moon phase + solstice/equinox row), the daily horoscope
 * card (opt-in setting, round 13) and the event list.
 */
@Composable
fun DayView(
    system: CalendarSystem,
    locale: AppLocale,
    date: CelestialDate,
    events: List<EventInstance>,
    showHijri: Boolean,
    showHoroscope: Boolean,
    strings: LocalStrings,
    onPrevDay: () -> Unit,
    onNextDay: () -> Unit,
    onEditEvent: (EventInstance) -> Unit = {},
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
            AllSystemsCard(system, locale, date, showHijri, strings)
        }

        item {
            MoonCard(date, locale, strings)
        }

        // daily horoscope card (opt-in via settings) — sign of the DISPLAYED
        // day; deterministic, so revisiting a date always shows the same pick
        if (showHoroscope) {
            item { HoroscopeCard(date, locale, strings) }
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
            CommonUi.EventCard(
                event = event,
                locale = locale,
                strings = strings,
                onEdit = if (event.dbId != null) {
                    { onEditEvent(event) }
                } else null,
            )
        }

        item { Spacer(Modifier.height(24.dp)) }
    }
}

/** All four calendar systems + imperial devotional day name (Hijri row
 *  gated behind the showHijri setting, round 13). */
@Composable
private fun AllSystemsCard(
    system: CalendarSystem,
    locale: AppLocale,
    date: CelestialDate,
    showHijri: Boolean,
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
            SystemLine(
                label = strings.dayNameLabel,
                value = CalendarFacade.imperialDayName(locale, date.imperial),
                active = system == CalendarSystem.IMPERIAL,
            )
            if (showHijri) {
                SystemLine(
                    label = strings.hijriLabel,
                    value = DateFormats.fullHijri(locale, date),
                    active = false,
                )
            }
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

/**
 * Astronomy card: moon phase (emoji, localized name, illumination % and
 * moon age) plus the season row on solstice/equinox days — zodiac glyph,
 * localized name, local "Occurs at HH:MM" and the day-length note.
 */
@Composable
private fun MoonCard(date: CelestialDate, locale: AppLocale, strings: LocalStrings) {
    val moon = remember(date.iso) { MoonEngine.infoFor(date.gregorian) }
    val season = remember(date.iso) { SolsticeEngine.eventOn(date.gregorian) }
    val illum = (moon.illum * 100).roundToInt()
    val age = moon.ageDays.roundToInt()
    androidx.compose.material3.Surface(
        shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(MoonEngine.PHASE_EMOJI[moon.phaseIndex], fontSize = 22.sp)
                Column {
                    Text(
                        strings.moonPhaseTitle,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        strings.moonPhaseName(moon.phaseIndex),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        "${strings.moonIllumination(illum)} · ${strings.moonAge(age)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            if (season != null) {
                SeasonRow(date, locale, season, strings)
            }
        }
    }
}

/** Solstice/equinox row appended to the moon card. */
@Composable
private fun SeasonRow(
    date: CelestialDate,
    locale: AppLocale,
    season: SeasonInfo,
    strings: LocalStrings,
) {
    val hhmm = remember(date.iso, season) {
        SolsticeEngine.localTimeOf(date.gregorian, season)
    }
    Row(
        Modifier.padding(top = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(SolsticeEngine.glyphOf(season.event), fontSize = 22.sp)
        Column {
            Text(
                strings.seasonEventName(season.event),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Text(
                strings.seasonOccursAt(I18n.num(locale, hhmm)) + " · " +
                        strings.seasonEventNote(season.event),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * Daily horoscope card (round 13, opt-in via the showHoroscope setting):
 * the zodiac sign of the DISPLAYED day (its Jalali month's sign) with a
 * deterministic per-(day, sign) pick — mood, lucky number, lucky color and
 * one short piece of advice. Same phrase banks + FNV-1a → mulberry32 engine
 * as the web app, so every locale shows the same pick for a given day.
 */
@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
private fun HoroscopeCard(date: CelestialDate, locale: AppLocale, strings: LocalStrings) {
    val jalaliMonth = date.jalali.month
    val signKey = zodiacKey(jalaliMonth) ?: return
    val signName = strings.zodiacName(jalaliMonth)
    val pick = remember(date.iso, signKey) { HoroscopeEngine.horoscopeFor(date.iso, signKey) }
    val horoscope = remember(pick, locale) { HoroscopeEngine.localizeHoroscope(pick, locale) }
    val luckyColor = Color(android.graphics.Color.parseColor(horoscope.color.hex))

    androidx.compose.material3.Surface(
        shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(
                    zodiacGlyph(jalaliMonth),
                    fontSize = 26.sp,
                    color = MaterialTheme.colorScheme.primary,
                )
                Column {
                    Text(
                        "${strings.horoscopeTitle} — $signName",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    androidx.compose.foundation.layout.FlowRow(
                        modifier = Modifier.padding(top = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        // mood: content emoji + label
                        HoroscopeChip {
                            Text(horoscope.mood.emoji, fontSize = 12.sp)
                            Text(
                                strings.horoscopeMood + ":",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text(
                                horoscope.mood.label,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Medium,
                            )
                        }
                        // lucky number (locale digits)
                        HoroscopeChip {
                            Text(
                                strings.horoscopeLuckyNumber + ":",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text(
                                I18n.num(locale, horoscope.luckyNumber),
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Medium,
                            )
                        }
                        // lucky color: swatch dot + label
                        HoroscopeChip {
                            Box(
                                Modifier
                                    .size(10.dp)
                                    .background(luckyColor, CircleShape)
                                    .border(
                                        BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)),
                                        CircleShape,
                                    )
                            )
                            Text(
                                strings.horoscopeLuckyColor + ":",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text(
                                horoscope.color.label,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Medium,
                            )
                        }
                    }
                }
            }
            // advice line (screen-reader prefix mirrors the web's sr-only)
            Row(
                Modifier.padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text("✨", fontSize = 13.sp, color = MaterialTheme.colorScheme.primary)
                Text(
                    horoscope.advice,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.semantics {
                        contentDescription = strings.horoscopeAdvice + ": " + horoscope.advice
                    },
                )
            }
        }
    }
}

/** Small rounded pill used by the horoscope card's mood/number/color rows. */
@Composable
private fun HoroscopeChip(content: @Composable () -> Unit) {
    androidx.compose.material3.Surface(
        shape = androidx.compose.foundation.shape.RoundedCornerShape(50),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Row(
            Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp),
        ) {
            content()
        }
    }
}
