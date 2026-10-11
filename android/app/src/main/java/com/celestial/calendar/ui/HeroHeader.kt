package com.celestial.calendar.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding


import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Settings
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
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.celestial.calendar.data.HeaderTheme
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CelestialDate
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.I18n
import com.celestial.calendar.engine.JalaliEngine

/**
 * Celestial — hero header with selectable artwork themes (round 13; round 14
 * adds the two new calendar systems, royal month names, the era suffix and
 * the today chip).
 *
 * Static banner image per header theme (fixed themes rotate 4 pieces by
 * Gregorian month — no cross-fade animation on Android, per the low-power
 * rules), month name + year + era in the active system (month names follow
 * the royal-names preference for the imperial family; ancient ALWAYS uses
 * the ancient names), a small zodiac chip with the displayed Jalali month's
 * constellation glyph + sign name (month view only), a secondary line with
 * the other systems (Gregorian for every non-Gregorian system, Jalali for
 * every non-Jalali one — web round-14 structure; the Hijri line is gated
 * behind the showHijri setting; the season suffix only shows for the
 * seasonal artwork theme), the today chip (round 14 — full weekday name +
 * locale-ordered day·month composition, replaces the icon-only button) and
 * the Month/Week/Year/Day/Agenda view switcher.
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
    headerTheme: HeaderTheme,
    showHijri: Boolean,
    royalMonthNames: Boolean,
    strings: LocalStrings,
    onViewChange: (ViewKind) -> Unit,
    onPrevMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onGoToday: () -> Unit,
    onOpenSettings: () -> Unit,
    onAddEvent: () -> Unit,
) {
    val season = Season.ofGregorianMonth(today.gregorian.month)
    // hero artwork: active theme's pool — the CENTRAL theme image source
    // (fixed themes rotate 4 pieces by Gregorian month)
    val banner = heroArtworkRes(headerTheme, today.gregorian.month)

    // month identity in the ACTIVE system (royal names apply to the
    // imperial-family systems; jalali/gregorian are unchanged)
    val navMonthName = DateFormats.monthNameOf(system, locale, navYear, navMonth, royalMonthNames)
    val navYearText = I18n.num(locale, navYear)
    val eraText = DateFormats.eraOfSystem(system, locale)
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

    // Secondary line: the other main system(s) of TODAY — web round-14
    // structure: Gregorian shows for every non-Gregorian system, Jalali (SH)
    // for every non-Jalali one (including the whole imperial family); the
    // Hijri (AH) year line is gated behind the showHijri setting; the season
    // suffix only shows for the seasonal artwork theme (fixed themes carry
    // their own palette — same rule as the web's season chip).
    val secondary = buildString {
        if (system != CalendarSystem.GREGORIAN) {
            append(DateFormats.gregorianMonthYearEra(locale, today))
        }
        if (system != CalendarSystem.JALALI) {
            if (isNotEmpty()) append(" · ")
            append(DateFormats.jalaliMonthYearEra(locale, today))
        }
        if (showHijri) {
            if (isNotEmpty()) append(" · ")
            append(DateFormats.hijriMonthYearEra(locale, today))
        }
        if (headerTheme == HeaderTheme.SEASONAL) {
            append(" · ")
            append(seasonLabel)
        }
    }

    // today chip (round 14): FULL weekday name + locale-ordered day·month
    // composition — en "Today · Saturday, March 21" / ja "今日 · 3月21日（土曜日）"
    // / fa "امروز · شنبه ۲۱ مارس" (web parity)
    val todayTriple = CalendarFacade.systemTripleOf(system, today)
    val todayMonthName = CalendarFacade.systemMonthName(system, locale, todayTriple.month, royalMonthNames)
    val todayDayNum = I18n.num(locale, todayTriple.day)
    val todayWeekday = I18n.weekdayLong(locale, today.weekday)
    val todayChipLabel = when (locale) {
        AppLocale.JA -> "${strings.today} · $todayMonthName${todayDayNum}日（$todayWeekday）"
        AppLocale.FA -> "${strings.today} · $todayWeekday $todayDayNum $todayMonthName"
        else -> "${strings.today} · $todayWeekday, $todayMonthName $todayDayNum"
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
                // seasonal art = the current season; fixed themes = the theme
                contentDescription = if (headerTheme == HeaderTheme.SEASONAL) {
                    seasonLabel
                } else {
                    strings.headerThemeName(headerTheme)
                },
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
                // today chip (round 14) — replaces the icon-only Today button;
                // full weekday + locale-ordered composition, web parity
                Surface(
                    shape = RoundedCornerShape(50),
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .padding(vertical = 4.dp)
                        .clickable(onClick = onGoToday),
                ) {
                    Text(
                        todayChipLabel,
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp),
                    )
                }
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
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            "$navMonthName $navYearText",
                            color = Color.White,
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                        )
                        Text(
                            " $eraText",
                            color = Color.White.copy(alpha = 0.85f),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(bottom = 4.dp),
                        )
                    }
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
