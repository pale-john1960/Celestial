package com.celestial.calendar.ui

import android.Manifest
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.celestial.calendar.data.Settings
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.Jdn
import com.celestial.calendar.statusbar.StatusBarDate
import com.celestial.calendar.ui.theme.CelestialTheme

/**
 * Celestial — root composable.
 *
 * Single-activity, state-driven views (like the web app): no navigation
 * library. One 300 ms alpha transition on view swap; everything else static
 * (low-power rules). Persian layout direction is forced for the FA locale so
 * in-app language switching applies RTL immediately.
 */
@Composable
fun CelestialApp(viewModel: CelestialViewModel) {
    val settings by viewModel.settings.collectAsState()
    val s: Settings = settings ?: return LoadingBox()

    val dir = if (s.locale.isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr
    CompositionLocalProvider(LocalLayoutDirection provides dir) {
        CelestialTheme(themeMode = s.themeMode) {
            val strings = rememberStrings(s.locale)
            var showSettings by remember { mutableStateOf(false) }
            var showAddEvent by remember { mutableStateOf(false) }
            val todayIso = remember { viewModel.todayIso() }
            val eventsByIso by viewModel.eventsByIso.collectAsState()

            // first-launch POST_NOTIFICATIONS request (status bar date default-on)
            val context = LocalContext.current
            val notifPermLauncher = rememberLauncherForActivityResult(
                ActivityResultContracts.RequestPermission()
            ) { granted ->
                viewModel.markNotifPermissionAsked()
                if (granted) StatusBarDate.update(context, s)
            }
            LaunchedEffect(s.notifPermissionAsked) {
                if (!s.notifPermissionAsked) {
                    viewModel.markNotifPermissionAsked()
                    if (Build.VERSION.SDK_INT >= 33 &&
                        !StatusBarDate.hasNotificationPermission(context)
                    ) {
                        notifPermLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    }
                }
            }

            // load the event years the current view needs
            LaunchedEffect(s.system, viewModel.view, viewModel.navYear, viewModel.navMonth, viewModel.selectedIso) {
                val years: Set<Int> = when (viewModel.view) {
                    ViewKind.MONTH, ViewKind.YEAR -> {
                        val months = CalendarFacade.yearMonths(s.system, viewModel.navYear)
                        setOf(months.first().second.year, months.last().second.year)
                    }
                    ViewKind.WEEK -> {
                        // load the years spanned by the displayed week
                        val base = viewModel.selectedIso?.let { Jdn.parseIso(it) }
                            ?: viewModel.todayGregorian()
                        val baseJdn = Jdn.toJdn(base)
                        val offset = ((Jdn.jdnWeekday(baseJdn) - s.weekStart.weekday) % 7 + 7) % 7
                        setOf(
                            Jdn.d2g(baseJdn - offset).year,
                            Jdn.d2g(baseJdn - offset + 6).year,
                        )
                    }
                    ViewKind.DAY -> {
                        val g = viewModel.selectedIso?.let { Jdn.parseIso(it) }
                            ?: viewModel.todayGregorian()
                        setOf(g.year, g.year + 1)
                    }
                    ViewKind.AGENDA -> {
                        val t = viewModel.todayGregorian()
                        setOf(t.year, Jdn.d2g(Jdn.toJdn(t) + 90).year)
                    }
                }
                viewModel.ensureYears(years)
            }

            Column(
                Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
            ) {
                Box(Modifier.weight(1f)) {
                    Column(Modifier.fillMaxSize()) {
                        HeroHeader(
                            system = s.system,
                            locale = s.locale,
                            today = CalendarFacade.buildCelestialDate(viewModel.todayGregorian()),
                            navYear = viewModel.navYear,
                            navMonth = viewModel.navMonth,
                            view = viewModel.view,
                            strings = strings,
                            onViewChange = { viewModel.setView(it) },
                            onPrevMonth = { viewModel.shiftMonth(-1) },
                            onNextMonth = { viewModel.shiftMonth(1) },
                            onGoToday = { viewModel.goToday() },
                            onOpenSettings = { showSettings = true },
                            onAddEvent = { showAddEvent = true },
                        )

                        // view content — single 300 ms alpha transition (no other animations)
                        AnimatedContent(
                            targetState = viewModel.view,
                            transitionSpec = {
                                fadeIn(tween(300)) togetherWith fadeOut(tween(300))
                            },
                            label = "view-swap",
                            modifier = Modifier.weight(1f),
                        ) { kind ->
                            when (kind) {
                                ViewKind.MONTH -> MonthView(
                                    system = s.system,
                                    locale = s.locale,
                                    weekStart = s.weekStart,
                                    navYear = viewModel.navYear,
                                    navMonth = viewModel.navMonth,
                                    todayIso = todayIso,
                                    eventsByIso = eventsByIso,
                                    selectedIso = viewModel.selectedIso,
                                    strings = strings,
                                    // 1st tap selects (TodayStrip), 2nd tap on the same
                                    // day opens the Day view — same UX as the web app
                                    onSelectDay = { iso ->
                                        when (iso) {
                                            null -> viewModel.selectDay(null)
                                            viewModel.selectedIso -> viewModel.openDay(iso)
                                            else -> viewModel.selectDay(iso)
                                        }
                                    },
                                )

                                ViewKind.WEEK -> WeekView(
                                    system = s.system,
                                    locale = s.locale,
                                    weekStart = s.weekStart,
                                    todayIso = todayIso,
                                    selectedIso = viewModel.selectedIso ?: todayIso,
                                    eventsByIso = eventsByIso,
                                    strings = strings,
                                    onPrevWeek = { viewModel.shiftWeek(-1) },
                                    onNextWeek = { viewModel.shiftWeek(1) },
                                    onThisWeek = { viewModel.goThisWeek() },
                                    onOpenDay = { iso -> viewModel.openDay(iso) },
                                )

                                ViewKind.YEAR -> YearView(
                                    system = s.system,
                                    locale = s.locale,
                                    weekStart = s.weekStart,
                                    navYear = viewModel.navYear,
                                    todayIso = todayIso,
                                    eventsByIso = eventsByIso,
                                    strings = strings,
                                    onOpenMonth = { m -> viewModel.goToSystemMonth(viewModel.navYear, m) },
                                    onShiftYear = { d -> viewModel.shiftYear(d) },
                                )

                                ViewKind.DAY -> {
                                    val iso = viewModel.selectedIso ?: todayIso
                                    val date = remember(iso) {
                                        Jdn.parseIso(iso)?.let { CalendarFacade.buildCelestialDate(it) }
                                    }
                                    if (date != null) {
                                        DayView(
                                            system = s.system,
                                            locale = s.locale,
                                            date = date,
                                            events = eventsByIso[iso] ?: emptyList(),
                                            strings = strings,
                                            onPrevDay = { viewModel.shiftDay(-1) },
                                            onNextDay = { viewModel.shiftDay(1) },
                                            // ✎ on imported/manual cards opens the edit dialog
                                            onEditEvent = { ev ->
                                                ev.dbId?.let { viewModel.beginEditImported(it) }
                                            },
                                        )
                                    }
                                }

                                ViewKind.AGENDA -> AgendaView(
                                    system = s.system,
                                    locale = s.locale,
                                    todayIso = todayIso,
                                    eventsByIso = eventsByIso,
                                    strings = strings,
                                    onOpenDay = { iso -> viewModel.openDay(iso) },
                                )
                            }
                        }
                    }

                    // bottom info strip for a selected day in month view
                    if (viewModel.view == ViewKind.MONTH && viewModel.selectedIso != null) {
                        SelectedDayStrip(
                            viewModel = viewModel,
                            strings = strings,
                            iso = viewModel.selectedIso!!,
                            events = eventsByIso[viewModel.selectedIso!!] ?: emptyList(),
                            onOpenDay = { viewModel.openDay(viewModel.selectedIso!!) },
                            onClear = { viewModel.selectDay(null) },
                            modifier = Modifier.align(Alignment.BottomCenter),
                        )
                    }
                }
            }

            if (showSettings) {
                SettingsSheet(
                    viewModel = viewModel,
                    settings = s,
                    onDismiss = { showSettings = false },
                )
            }

            if (showAddEvent) {
                AddEventDialog(
                    system = s.system,
                    locale = s.locale,
                    selectedIso = viewModel.selectedIso ?: todayIso,
                    strings = strings,
                    onSave = { title, description, isHoliday, iso, recurYearly, color ->
                        viewModel.addManualEvent(title, description, isHoliday, iso, recurYearly, color)
                        showAddEvent = false
                        Toast.makeText(context, strings.addEventSaved, Toast.LENGTH_SHORT).show()
                    },
                    onDismiss = { showAddEvent = false },
                )
            }

            // edit dialog (settings rows + ✎ on imported/manual event cards)
            val editingEvent by viewModel.editingEvent.collectAsState()
            editingEvent?.let { row ->
                AddEventDialog(
                    system = s.system,
                    locale = s.locale,
                    selectedIso = row.iso,
                    strings = strings,
                    editing = row,
                    onSave = { title, description, isHoliday, iso, recurYearly, color ->
                        viewModel.updateImported(
                            row.copy(
                                iso = iso,
                                title = title,
                                description = description.ifBlank { null },
                                isHoliday = isHoliday,
                                recurYearly = recurYearly,
                                color = color,
                            )
                        )
                        Toast.makeText(context, strings.eventUpdated, Toast.LENGTH_SHORT).show()
                    },
                    onDelete = {
                        viewModel.deleteImported(row.id)
                        viewModel.cancelEdit()
                    },
                    onDismiss = { viewModel.cancelEdit() },
                )
            }
        }
    }
}

@Composable
private fun LoadingBox() {
    Box(
        Modifier
            .fillMaxSize()
            .background(androidx.compose.ui.graphics.Color(0xFFFDFBF7)),
        contentAlignment = Alignment.Center,
    ) {
        Text("Celestial", color = androidx.compose.ui.graphics.Color(0xFFC2185B), fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun SelectedDayStrip(
    viewModel: CelestialViewModel,
    strings: LocalStrings,
    iso: String,
    events: List<com.celestial.calendar.events.EventInstance>,
    onOpenDay: () -> Unit,
    onClear: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val s = viewModel.settings.collectAsState().value ?: return
    val locale = s.locale
    val date = remember(iso) { Jdn.parseIso(iso)?.let { CalendarFacade.buildCelestialDate(it) } }
        ?: return
    val isHoliday = events.any { it.isHoliday || it.holidayOnly }
    val visible = events.filter { !it.holidayOnly }

    Surface(
        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.92f),
        modifier = modifier
            .fillMaxWidth()
            .padding(8.dp),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        shadowElevation = 6.dp,
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "${DateFormats.weekdayShort(locale, date)} · ${DateFormats.fullSystemDate(s.system, locale, date)}",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                    )
                    if (isHoliday) {
                        Text(
                            "  🌙 ${strings.dayOff}",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                }
                Text(
                    strings.eventsCount(visible.size),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Button(onClick = onOpenDay) {
                Text(strings.openDay)
            }
            IconButton(onClick = onClear) {
                Icon(Icons.Filled.Close, contentDescription = strings.close)
            }
        }
    }
}
