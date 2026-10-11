package com.celestial.calendar.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding


import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Today
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CelestialDate
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.JalaliEngine

/**
 * Celestial — seasonal hero header.
 *
 * Static seasonal banner (image per season, 2 variants alternating through the
 * month — no cross-fade animation on Android, per the low-power rules), month
 * name + year in the active system, a small zodiac chip with the displayed
 * Jalali month's constellation glyph + sign name (Task 10; month view only),
 * secondary line with the other systems, and the Month/Week/Year/Day/Agenda
 * view switcher.
 */
@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun HeroHeader(
    system: CalendarSystem,
    locale: AppLocale,
    today: CelestialDate,
    navYear: Int,
    navMonth: Int,
    view: ViewKind,
    strings: LocalStrings,
    onViewChange: (ViewKind) -> Unit,
    onPrevMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onGoToday: () -> Unit,
    onOpenSettings: () -> Unit,
    onAddEvent: () -> Unit,
) {
    val season = Season.ofGregorianMonth(today.gregorian.month)
    val variant = if (today.gregorian.day >= 15) 2 else 1
    val banner = seasonBannerRes(season, variant)

    val navMonthName = DateFormats.monthNameOf(system, locale, navYear, navMonth)
    val navYearText = com.celestial.calendar.engine.I18n.num(locale, navYear)
    // Jalali month of the displayed (cursor) month regardless of the active
    // system — the middle day of the system month converted via the engine
    // facade. Drives the zodiac chip (Task 10). Sampling the middle day
    // always lands in the Jalali month covering the majority of the
    // displayed month (and agrees with the header month name for the
    // Imperial system's fixed 30-day months).
    val zodiacMonth = JalaliEngine.gregorianToJalali(
        CalendarFacade.systemToGregorian(
            system, navYear, navMonth,
            minOf(15, CalendarFacade.systemMonthLength(system, navYear, navMonth)),
        )
    ).month
    val seasonLabel = strings.seasonName(season)

    val secondary = buildString {
        when (system) {
            CalendarSystem.GREGORIAN -> {
                append(DateFormats.jalaliMonthYearEra(locale, today))
                append(" · ")
                append(DateFormats.hijriMonthYearEra(locale, today))
            }
            CalendarSystem.JALALI -> {
                append(DateFormats.gregorianMonthYearEra(locale, today))
                append(" · ")
                append(DateFormats.hijriMonthYearEra(locale, today))
            }
            CalendarSystem.IMPERIAL -> {
                append(DateFormats.gregorianMonthYearEra(locale, today))
                append(" · ")
                append(DateFormats.jalaliMonthYearEra(locale, today))
            }
        }
        append(" · ")
        append(seasonLabel)
    }

    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl

    Column(Modifier.fillMaxWidth()) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(168.dp)
        ) {
            Image(
                painter = painterResource(banner),
                contentDescription = seasonLabel,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
            // readability scrim (no animated particles on Android — battery)
            Box(
                Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            0f to Color.Black.copy(alpha = 0.45f),
                            0.6f to Color.Black.copy(alpha = 0.10f),
                            1f to Color.Black.copy(alpha = 0.35f),
                        )
                    )
            )
            Row(
                Modifier
                    .align(Alignment.TopEnd)
                    .padding(4.dp)
            ) {
                IconButton(onClick = onAddEvent) {
                    Icon(
                        Icons.Filled.Add, contentDescription = strings.addEvent,
                        tint = Color.White,
                    )
                }
                IconButton(onClick = onGoToday) {
                    Icon(
                        Icons.Filled.Today, contentDescription = strings.goToday,
                        tint = Color.White,
                    )
                }
                IconButton(onClick = onOpenSettings) {
                    Icon(
                        Icons.Filled.Settings, contentDescription = strings.settings,
                        tint = Color.White,
                    )
                }
            }
            Column(
                Modifier
                    .align(Alignment.BottomStart)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Text(
                    strings.appName.uppercase(),
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 12.sp,
                    letterSpacing = 3.sp,
                    fontWeight = FontWeight.Bold,
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    if (view == ViewKind.MONTH) {
                        IconButton(onClick = onPrevMonth) {
                            Icon(
                                if (rtl) Icons.Filled.KeyboardArrowRight else Icons.Filled.KeyboardArrowLeft,
                                contentDescription = strings.prevMonth,
                                tint = Color.White,
                            )
                        }
                    }
                    Text(
                        "$navMonthName $navYearText",
                        color = Color.White,
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                    )
                    if (view == ViewKind.MONTH) {
                        IconButton(onClick = onNextMonth) {
                            Icon(
                                if (rtl) Icons.Filled.KeyboardArrowLeft else Icons.Filled.KeyboardArrowRight,
                                contentDescription = strings.nextMonth,
                                tint = Color.White,
                            )
                        }
                    }
                    // zodiac of the displayed Jalali month (month view only)
                    if (view == ViewKind.MONTH) {
                        CommonUi.ZodiacChip(
                            strings = strings,
                            locale = locale,
                            jalaliMonth = zodiacMonth,
                            modifier = Modifier.padding(start = 2.dp),
                        )
                    }
                }
                Text(
                    secondary,
                    color = Color.White.copy(alpha = 0.92f),
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }

        // view switcher
        Surface(
            color = MaterialTheme.colorScheme.background,
            modifier = Modifier.fillMaxWidth(),
        ) {
            SingleChoiceSegmentedButtonRow(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                val entries = listOf(
                    ViewKind.MONTH to strings.viewMonth,
                    ViewKind.WEEK to strings.viewWeek,
                    ViewKind.YEAR to strings.viewYear,
                    ViewKind.DAY to strings.viewDay,
                    ViewKind.AGENDA to strings.viewAgenda,
                )
                entries.forEachIndexed { index, (kind, label) ->
                    SegmentedButton(
                        selected = view == kind,
                        onClick = { onViewChange(kind) },
                        shape = SegmentedButtonDefaults.itemShape(index = index, count = entries.size),
                    ) {
                        Text(label, maxLines = 1)
                    }
                }
            }
        }
    }
}
