package com.celestial.calendar.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.celestial.calendar.data.SunLocation
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
import com.celestial.calendar.engine.SunEngine
import com.celestial.calendar.engine.WorldCity
import com.celestial.calendar.events.EventInstance
import kotlinx.coroutines.delay
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.roundToInt

/**
 * Celestial — day view: full date in all systems + (imperial family:
 * devotional day name) + optional Hijri row (setting), "Day off" banner for
 * holidays, the astronomy card (moon phase + solstice/equinox row), the daily
 * horoscope card (opt-in setting, round 13), the sun-times card + world
 * clock (round 14) and the event list.
 */
@Composable
fun DayView(
    system: CalendarSystem,
    locale: AppLocale,
    date: CelestialDate,
    events: List<EventInstance>,
    showHijri: Boolean,
    showHoroscope: Boolean,
    royalMonthNames: Boolean,
    sunLocation: SunLocation,
    worldClockZones: List<String>,
    strings: LocalStrings,
    onPrevDay: () -> Unit,
    onNextDay: () -> Unit,
    onSetSunLocation: (SunLocation) -> Unit,
    onSetWorldClockZones: (List<String>) -> Unit,
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
                        DateFormats.fullSystemDate(system, locale, date, royalMonthNames),
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
            AllSystemsCard(system, locale, date, showHijri, royalMonthNames, strings)
        }

        item {
            MoonCard(date, locale, strings)
        }

        // daily horoscope card (opt-in via settings) — sign of the DISPLAYED
        // day; deterministic, so revisiting a date always shows the same pick
        if (showHoroscope) {
            item { HoroscopeCard(date, locale, strings) }
        }

        // sun times + world clock (round 14 — web parity with the Day view's
        // SunTimesCard + WorldClockCard, mounted after the horoscope card)
        item {
            SunTimesCard(
                date = date,
                locale = locale,
                sunLocation = sunLocation,
                strings = strings,
                onSelectCity = { city ->
                    onSetSunLocation(
                        SunLocation(
                            label = cityByEnglishName(city),
                            lat = city.lat,
                            lng = city.lng,
                            tz = city.tz,
                        )
                    )
                },
            )
        }

        item {
            WorldClockCard(
                locale = locale,
                zones = worldClockZones,
                strings = strings,
                onRemoveZone = { tz ->
                    onSetWorldClockZones(worldClockZones.filter { it != tz })
                },
                onAddZone = { tz ->
                    onSetWorldClockZones(worldClockZones + tz)
                },
            )
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
 *  gated behind the showHijri setting, round 13). Round 14: the devotional
 *  day-name row belongs to the 12×30+Andarjah structures (imperial +
 *  ancient — NOT imperialSolar, whose Shamsi months don't carry the 30-day
 *  cycle); the Imperial row's month names follow the royal-names setting. */
@Composable
private fun AllSystemsCard(
    system: CalendarSystem,
    locale: AppLocale,
    date: CelestialDate,
    showHijri: Boolean,
    royalMonthNames: Boolean,
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
                active = system == CalendarSystem.JALALI || system == CalendarSystem.IMPERIAL_SOLAR,
            )
            SystemLine(
                label = strings.systemImperial,
                value = DateFormats.fullImperial(locale, date, royal = royalMonthNames),
                active = system == CalendarSystem.IMPERIAL || system == CalendarSystem.ANCIENT,
            )
            // devotional day name — only for the Andarjah structures
            if (CalendarFacade.hasAndarjah(system)) {
                SystemLine(
                    label = strings.dayNameLabel,
                    value = CalendarFacade.imperialDayName(locale, date.imperial),
                    active = system == CalendarSystem.IMPERIAL || system == CalendarSystem.ANCIENT,
                )
            }
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

// ----------------------------------------------------------------------------------
// Round 14: sun-times card + world clock (web parity with SunTimesCard.tsx and
// WorldClockCard.tsx). Icons are emoji (the app's established icon pattern —
// no material-icons-extended dependency, keeps the APK small); the location
// picker is preset-cities ONLY (no geolocation this round — permission-free).
// ----------------------------------------------------------------------------------

/** Canonical English city name for the persisted sun-location label (locale
 *  independent, so preset matching survives language switches). */
private fun cityByEnglishName(city: WorldCity): String = when (city.id) {
    "tehran" -> "Tehran"
    "tokyo" -> "Tokyo"
    "seoul" -> "Seoul"
    "beijing" -> "Beijing"
    "new-york" -> "New York"
    "london" -> "London"
    "paris" -> "Paris"
    "dubai" -> "Dubai"
    "sydney" -> "Sydney"
    "los-angeles" -> "Los Angeles"
    else -> city.id
}

/**
 * Sun-times card (round 14): five chronological rows — dawn / sunrise / solar
 * noon / sunset / dusk (per-event nulls skipped at high latitudes), a
 * polar-night / midnight-sun badge, and the location row with the preset-city
 * picker (10 cities). Deterministic per (day, location).
 */
@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun SunTimesCard(
    date: CelestialDate,
    locale: AppLocale,
    sunLocation: SunLocation,
    strings: LocalStrings,
    onSelectCity: (WorldCity) -> Unit,
) {
    val times = remember(date.iso, sunLocation) {
        SunEngine.sunTimes(
            date.gregorian,
            sunLocation.lat,
            sunLocation.lng,
            SunEngine.tzOffsetMinutes(sunLocation.tz, date.gregorian),
        )
    }
    // does the stored location match a preset? → localized label
    val preset = remember(sunLocation) {
        SunEngine.presetFor(sunLocation.tz, sunLocation.lat, sunLocation.lng)
    }
    val locationLabel = preset?.let { strings.cityName(it) } ?: sunLocation.label

    androidx.compose.material3.Surface(
        shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            // title row — icon + card title + bold localized place
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text("☀️", fontSize = 20.sp)
                Column {
                    Text(
                        strings.sunTimesTitle,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        locationLabel,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }

            // the five events, chronological; sunrise/sunset highlighted vs
            // muted others; per-event nulls skipped (dawn/dusk may be absent)
            Column(Modifier.padding(top = 6.dp)) {
                times.dawn?.let { SunTimeRow("🌄", strings.sunDawn, SunEngine.formatHm(locale, it), false) }
                times.sunrise?.let { SunTimeRow("🌅", strings.sunSunrise, SunEngine.formatHm(locale, it), true) }
                if (times.polarNight || times.midnightSun) {
                    Surface(
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(50),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)),
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.05f),
                        modifier = Modifier.padding(vertical = 2.dp),
                    ) {
                        Text(
                            if (times.polarNight) strings.sunPolarNight else strings.sunMidnightSun,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        )
                    }
                }
                SunTimeRow("☀️", strings.sunNoon, SunEngine.formatHm(locale, times.noon), false)
                times.sunset?.let { SunTimeRow("🌇", strings.sunSunset, SunEngine.formatHm(locale, it), true) }
                times.dusk?.let { SunTimeRow("🌆", strings.sunDusk, SunEngine.formatHm(locale, it), false) }
            }

            // location controls: preset-city picker (permission-free)
            Text(
                strings.sunLocation,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 10.dp),
            )
            androidx.compose.foundation.layout.FlowRow(
                modifier = Modifier.padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                SunEngine.WORLD_CITIES.forEach { city ->
                    FilterChip(
                        selected = preset?.id == city.id,
                        onClick = { onSelectCity(city) },
                        label = { Text(strings.cityName(city), maxLines = 1) },
                    )
                }
            }
        }
    }
}

/** One event line: emoji icon + label + localized time. [primary] marks the
 *  horizon events (sunrise/sunset) — onSurface vs the muted rows. */
@Composable
private fun SunTimeRow(icon: String, label: String, value: String, primary: Boolean) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(icon, fontSize = 14.sp)
        Text(
            label,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (primary) FontWeight.SemiBold else FontWeight.Medium,
            color = if (primary) MaterialTheme.colorScheme.onSurface
            else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = if (primary) MaterialTheme.colorScheme.onSurface
            else MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

/**
 * World clock (round 14): live time per zone (30 s ticker), day-offset badge
 * (next/previous day vs the device's day), remove per row, add-city picker
 * from the 10 presets, capped at 8 zones.
 */
@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun WorldClockCard(
    locale: AppLocale,
    zones: List<String>,
    strings: LocalStrings,
    onRemoveZone: (String) -> Unit,
    onAddZone: (String) -> Unit,
) {
    // live clock: refresh every 30 s while the card is on screen
    var nowMs by remember { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(30_000)
            nowMs = System.currentTimeMillis()
        }
    }

    androidx.compose.material3.Surface(
        shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(
                "🕒 " + strings.worldClockTitle,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            if (zones.isEmpty()) {
                Text(
                    strings.worldClockEmpty,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 6.dp),
                )
            } else {
                Column(Modifier.padding(top = 6.dp)) {
                    zones.forEach { tz ->
                        WorldClockRow(
                            tz = tz,
                            nowMs = nowMs,
                            locale = locale,
                            strings = strings,
                            onRemove = { onRemoveZone(tz) },
                        )
                    }
                }
            }

            // add-city picker (hidden at the 8-zone cap / when all presets added)
            val available = SunEngine.WORLD_CITIES.filter { it.tz !in zones }
            if (zones.size < 8 && available.isNotEmpty()) {
                Text(
                    strings.worldClockAdd,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 10.dp),
                )
                androidx.compose.foundation.layout.FlowRow(
                    modifier = Modifier.padding(top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    available.forEach { city ->
                        FilterChip(
                            selected = false,
                            onClick = { onAddZone(city.tz) },
                            label = { Text("+ " + strings.cityName(city), maxLines = 1) },
                        )
                    }
                }
            }
        }
    }
}

/** One world-clock row: city label, day-offset badge, live HH:MM, remove. */
@Composable
private fun WorldClockRow(
    tz: String,
    nowMs: Long,
    locale: AppLocale,
    strings: LocalStrings,
    onRemove: () -> Unit,
) {
    val zone = remember(tz) { runCatching { ZoneId.of(tz) }.getOrNull() }
    if (zone == null) return
    val zoned = remember(nowMs, zone) { Instant.ofEpochMilli(nowMs).atZone(zone) }
    val label = SunEngine.WORLD_CITIES
        .firstOrNull { it.tz == tz }
        ?.let { strings.cityName(it) }
        ?: SunEngine.zoneLabel(tz)
    // day-offset badge vs the device's day (web parity: next day / previous day)
    val deviceDay = remember(nowMs) { LocalDate.now() }
    val dayBadge = when {
        zoned.toLocalDate().isAfter(deviceDay) -> strings.worldClockTomorrow
        zoned.toLocalDate().isBefore(deviceDay) -> strings.worldClockYesterday
        else -> null
    }
    val timeText = I18n.num(
        locale,
        "%02d:%02d".format(zoned.hour, zoned.minute),
    )

    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            label,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(1f),
        )
        if (dayBadge != null) {
            Surface(
                shape = androidx.compose.foundation.shape.RoundedCornerShape(50),
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f),
            ) {
                Text(
                    dayBadge,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                )
            }
        }
        Text(
            timeText,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
        )
        IconButton(onClick = onRemove, modifier = Modifier.size(28.dp)) {
            Icon(
                Icons.Filled.Close,
                contentDescription = "${strings.remove} $label",
                modifier = Modifier.size(16.dp),
            )
        }
    }
}
