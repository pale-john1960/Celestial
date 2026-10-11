package com.celestial.calendar.ui

import android.Manifest


import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable

import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.celestial.calendar.data.HeaderTheme
import com.celestial.calendar.data.ThemeMode
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.WeekStart
import com.celestial.calendar.engine.WeekendDay
import com.celestial.calendar.events.IcsBuilder
import com.celestial.calendar.events.IcsEvent
import com.celestial.calendar.events.SourceSettings
import com.celestial.calendar.statusbar.StatusBarDate
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Celestial — settings bottom sheet: calendar system, language, week start,
 * theme, header artwork theme (round 13) + Hijri/horoscope toggles, source
 * toggles (with the religious-off note), status-bar date toggle, NTP panel,
 * import panel with the imported/manual events list (per-row delete) and the
 * .ics export.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsSheet(
    viewModel: CelestialViewModel,
    settings: com.celestial.calendar.data.Settings,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    val locale = settings.locale
    val strings = rememberStrings(locale)

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp)
                .padding(bottom = 32.dp)
        ) {

            // ---------------------------------------------------- system
            // Round 14: five calendar systems — the 3-way segmented row became
            // too wide, so the selector uses the header-theme chip-grid pattern
            // (two per row) with the active system's hint below.
            CommonUi.SectionLabel(strings.calendarSystem)
            val systemPairs = listOf(
                CalendarSystem.GREGORIAN to CalendarSystem.JALALI,
                CalendarSystem.IMPERIAL to CalendarSystem.IMPERIAL_SOLAR,
                CalendarSystem.ANCIENT to null,
            )
            Column(
                Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                systemPairs.forEach { (first, second) ->
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        SystemChip(
                            selected = settings.system == first,
                            label = systemLabel(strings, first),
                            modifier = Modifier.weight(1f),
                            onClick = { viewModel.setSystem(first) },
                        )
                        if (second != null) {
                            SystemChip(
                                selected = settings.system == second,
                                label = systemLabel(strings, second),
                                modifier = Modifier.weight(1f),
                                onClick = { viewModel.setSystem(second) },
                            )
                        }
                    }
                }
            }
            Text(
                systemHint(strings, settings.system),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp),
            )

            // ---------------------------------------------------- language
            CommonUi.SectionLabel(strings.language)
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                val entries = listOf(
                    AppLocale.EN to "English",
                    AppLocale.JA to "日本語",
                    AppLocale.FA to "فارسی",
                )
                entries.forEachIndexed { i, (loc, label) ->
                    SegmentedButton(
                        selected = locale == loc,
                        onClick = { viewModel.setLocale(loc) },
                        shape = SegmentedButtonDefaults.itemShape(i, entries.size),
                    ) { Text(label, maxLines = 1) }
                }
            }

            // ---------------------------------------------------- week start
            CommonUi.SectionLabel(strings.weekStartLabel)
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                val entries = listOf(
                    WeekStart.SAT to strings.weekStartSat,
                    WeekStart.SUN to strings.weekStartSun,
                    WeekStart.MON to strings.weekStartMon,
                )
                entries.forEachIndexed { i, (ws, label) ->
                    SegmentedButton(
                        selected = settings.weekStart == ws,
                        onClick = { viewModel.setWeekStart(ws) },
                        shape = SegmentedButtonDefaults.itemShape(i, entries.size),
                    ) { Text(label, maxLines = 1) }
                }
            }

            // ---------------------------------------------------- theme
            CommonUi.SectionLabel(strings.themeLabel)
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                val entries = listOf(
                    ThemeMode.SYSTEM to strings.themeSystem,
                    ThemeMode.LIGHT to strings.themeLight,
                    ThemeMode.DARK to strings.themeDark,
                )
                entries.forEachIndexed { i, (mode, label) ->
                    SegmentedButton(
                        selected = settings.themeMode == mode,
                        onClick = { viewModel.setThemeMode(mode) },
                        shape = SegmentedButtonDefaults.itemShape(i, entries.size),
                    ) { Text(label, maxLines = 1) }
                }
            }

            // ------------------------------------------- header theme (round 13)
            // 7 artwork themes as chips, two per row (scrollable sheet — the
            // two-per-row grid keeps every label readable even in fa/ja).
            CommonUi.SectionLabel(strings.headerTheme)
            val themePairs = listOf(
                HeaderTheme.SEASONAL to HeaderTheme.CELESTIAL,
                HeaderTheme.MAGICAL to HeaderTheme.SHAHANSHAHI,
                HeaderTheme.JAPANESE to HeaderTheme.KOREAN,
                HeaderTheme.CHINESE to null,
            )
            Column(
                Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                themePairs.forEach { (first, second) ->
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        HeaderThemeChip(
                            selected = settings.headerTheme == first,
                            label = strings.headerThemeName(first),
                            modifier = Modifier.weight(1f),
                            onClick = { viewModel.setHeaderTheme(first) },
                        )
                        if (second != null) {
                            HeaderThemeChip(
                                selected = settings.headerTheme == second,
                                label = strings.headerThemeName(second),
                                modifier = Modifier.weight(1f),
                                onClick = { viewModel.setHeaderTheme(second) },
                            )
                        }
                    }
                }
            }

            // --------------------------------- weekly day off (round 14)
            // 5 options as chips, two per row (same pattern as the systems).
            CommonUi.SectionLabel(strings.weekendDayLabel)
            val weekendPairs = listOf(
                WeekendDay.AUTO to WeekendDay.NONE,
                WeekendDay.FRIDAY to WeekendDay.SATURDAY,
                WeekendDay.SUNDAY to null,
            )
            Column(
                Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                weekendPairs.forEach { (first, second) ->
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        HeaderThemeChip(
                            selected = settings.weekendDay == first,
                            label = strings.weekendDayName(first),
                            modifier = Modifier.weight(1f),
                            onClick = { viewModel.setWeekendDay(first) },
                        )
                        if (second != null) {
                            HeaderThemeChip(
                                selected = settings.weekendDay == second,
                                label = strings.weekendDayName(second),
                                modifier = Modifier.weight(1f),
                                onClick = { viewModel.setWeekendDay(second) },
                            )
                        }
                    }
                }
            }

            // --------------------------------- royal month names (round 14)
            ToggleRow(
                strings.royalMonthNames,
                settings.royalMonthNames,
                subtitle = strings.royalMonthNamesHint,
            ) { on ->
                viewModel.setRoyalMonthNames(on)
            }

            // --------------------------------- Hijri year / daily horoscope
            ToggleRow(strings.showHijri, settings.showHijri) { on ->
                viewModel.setShowHijri(on)
            }
            ToggleRow(strings.showHoroscope, settings.showHoroscope) { on ->
                viewModel.setShowHoroscope(on)
            }

            // ---------------------------------------------------- sources
            CommonUi.SectionLabel(strings.eventSources)
            val src = settings.sources
            ToggleRow(strings.srcInternational, src.international) { on ->
                viewModel.setSource { it.copy(international = on) }
            }
            ToggleRow(strings.srcUs, src.us) { on ->
                viewModel.setSource { it.copy(us = on) }
            }
            ToggleRow(strings.srcJapan, src.japan) { on ->
                viewModel.setSource { it.copy(japan = on) }
            }
            ToggleRow(strings.srcPersianCultural, src.persianCultural) { on ->
                viewModel.setSource { it.copy(persianCultural = on) }
            }
            ToggleRow(strings.srcPersianNational, src.persianNational) { on ->
                viewModel.setSource { it.copy(persianNational = on) }
            }
            ToggleRow(strings.srcPersianReligious, src.persianReligious) { on ->
                viewModel.setSource { it.copy(persianReligious = on) }
            }
            if (!src.persianReligious) {
                Text(
                    strings.religiousHiddenHolidayNote,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.tertiary,
                    modifier = Modifier.padding(top = 2.dp),
                )
            }
            ToggleRow(strings.srcImported, src.imported) { on ->
                viewModel.setSource { it.copy(imported = on) }
            }

            // ---------------------------------------------------- status bar date
            CommonUi.SectionLabel(strings.statusBarDate)
            var pendingEnable by remember { mutableStateOf(false) }
            val permLauncher = rememberLauncherForActivityResult(
                ActivityResultContracts.RequestPermission()
            ) { granted ->
                if (granted || Build.VERSION.SDK_INT < 33) {
                    viewModel.setStatusBarDate(true)
                } else {
                    viewModel.setStatusBarDate(false)
                }
                pendingEnable = false
            }
            ToggleRow(
                strings.statusBarDate,
                settings.statusBarDate,
                subtitle = strings.statusBarDateDesc,
            ) { on ->
                if (on && Build.VERSION.SDK_INT >= 33 &&
                    !StatusBarDate.hasNotificationPermission(context)
                ) {
                    pendingEnable = true
                    permLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                } else {
                    viewModel.setStatusBarDate(on)
                }
            }
            if (pendingEnable) {
                Text(
                    strings.notifPermRationale,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            // ---------------------------------------------------- NTP
            CommonUi.SectionLabel(strings.timeSync)
            val ntpSyncing by viewModel.ntpSyncing.collectAsState()
            val timeFmt = remember { SimpleDateFormat("HH:mm:ss", Locale.US) }
            val deviceTime = remember { timeFmt.format(Date()) }
            val offset = settings.ntpOffsetMs
            val celestialTime = remember(offset) {
                offset?.let { timeFmt.format(Date(System.currentTimeMillis() + it)) } ?: deviceTime
            }
            val offsetText = when {
                ntpSyncing -> strings.timeSyncChecking
                offset == null -> strings.timeSyncOff
                else -> strings.offsetMs(offset.toString())
            }
            NtpRow(strings.deviceClock, deviceTime)
            NtpRow(strings.serverClock, celestialTime)
            NtpRow(strings.offset, offsetText)
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(top = 6.dp),
                horizontalArrangement = Arrangement.End,
            ) {
                OutlinedButton(
                    onClick = { viewModel.syncNtp() },
                    enabled = !ntpSyncing,
                ) {
                    Text(if (ntpSyncing) strings.timeSyncChecking else strings.syncNow)
                }
            }

            // ---------------------------------------------------- import
            CommonUi.SectionLabel(strings.importTitle)
            Text(
                strings.importHint,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            var importResult by remember {
                mutableStateOf<CelestialViewModel.ImportOutcome?>(null)
            }
            var importError by remember { mutableStateOf<String?>(null) }
            val filePicker = rememberLauncherForActivityResult(
                ActivityResultContracts.OpenDocument()
            ) { uri: Uri? ->
                if (uri != null) {
                    try {
                        val resolver = context.contentResolver
                        val name = queryDisplayName(resolver, uri) ?: "events.txt"
                        val text = resolver.openInputStream(uri)?.use { ins ->
                            ins.readBytes().toString(Charsets.UTF_8)
                        } ?: throw IllegalStateException("empty stream")
                        val outcome = viewModel.importFromText(name, text)
                        importResult = outcome
                        importError = if (!outcome.ok) strings.importInvalid else null
                    } catch (e: Exception) {
                        importError = strings.errorGeneric
                    }
                }
            }
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Button(onClick = {
                    filePicker.launch(
                        arrayOf(
                            "application/json",
                            "text/*",
                            "text/calendar", // .ics (also matched by text/*)
                            "application/octet-stream",
                        )
                    )
                }) {
                    Text(strings.importChooseFile)
                }
            }
            importResult?.let { outcome ->
                if (outcome.ok) {
                    Text(
                        strings.importResult(outcome.imported) +
                                (if (outcome.skipped > 0) " · " + strings.importErrors(outcome.skipped) else "") +
                                (if (outcome.warnings > 0) " · " + strings.importWarnings(outcome.warnings) else ""),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.tertiary,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(top = 6.dp),
                    )
                }
            }
            importError?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(top = 6.dp),
                )
            }

            // imported events list
            val imported by viewModel.importedEvents.collectAsState()
            Text(
                strings.importedEventsList,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 14.dp, bottom = 4.dp),
            )
            if (imported.isEmpty()) {
                Text(
                    strings.noImportedEvents,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                imported.take(12).forEach { ev ->
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(
                                buildString {
                                    append(if (ev.sourceName == "manual") "✍️" else "📥")
                                    if (ev.isHoliday) append(" 🌙")
                                    if (ev.recurYearly) append(" 🔁")
                                    append("  ").append(ev.jalaliIso)
                                    ev.sourceName?.takeIf { it.isNotBlank() }?.let {
                                        append("  ·  ").append(it)
                                    }
                                },
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text(
                                "  ${ev.title}",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                        IconButton(onClick = { viewModel.beginEdit(ev) }) {
                            Icon(Icons.Outlined.Edit, contentDescription = strings.editEvent)
                        }
                        IconButton(onClick = { viewModel.deleteImported(ev.id) }) {
                            Icon(Icons.Filled.Close, contentDescription = strings.remove)
                        }
                    }
                }
                if (imported.size > 12) {
                    Text(
                        "+ ${imported.size - 12}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                TextButton(
                    onClick = { viewModel.clearImported() },
                    modifier = Modifier.padding(top = 4.dp),
                ) {
                    Text(strings.deleteImported, color = MaterialTheme.colorScheme.error)
                }
            }

            // ---------------------------------------------------- export (.ics)
            val icsLauncher = rememberLauncherForActivityResult(
                ActivityResultContracts.CreateDocument("text/calendar")
            ) { uri: Uri? ->
                if (uri != null) {
                    try {
                        val events = viewModel.exportableEvents()
                        val content = IcsBuilder.build(
                            events.map { ev ->
                                IcsEvent(
                                    uid = ev.id,
                                    iso = ev.iso,
                                    title = ev.localName(locale.code),
                                    description = ev.localDescription(locale.code),
                                    isHoliday = ev.isHoliday,
                                    sourceLabel = CommonUi.sourceLabel(ev, strings),
                                    recurYearly = ev.recurring,
                                )
                            },
                            System.currentTimeMillis(),
                        )
                        context.contentResolver.openOutputStream(uri)?.use { out ->
                            out.write(content.toByteArray(Charsets.UTF_8))
                        }
                        Toast.makeText(
                            context,
                            strings.exportIcsDone(events.size),
                            Toast.LENGTH_SHORT,
                        ).show()
                    } catch (_: Exception) {
                        Toast.makeText(context, strings.errorGeneric, Toast.LENGTH_SHORT).show()
                    }
                }
            }
            OutlinedButton(
                onClick = { icsLauncher.launch("celestial-events.ics") },
                modifier = Modifier.padding(top = 4.dp),
            ) {
                Icon(
                    Icons.Outlined.Share,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.width(8.dp))
                Text(strings.exportIcs)
            }

            HorizontalDivider(Modifier.padding(vertical = 16.dp))
            Text(
                strings.footerNote,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp,
            )
        }
    }
}

@Composable
private fun HeaderThemeChip(
    selected: Boolean,
    label: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, maxLines = 1) },
        modifier = modifier,
    )
}

@Composable
private fun SystemChip(
    selected: Boolean,
    label: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, maxLines = 2) },
        modifier = modifier,
    )
}

/** Localized name of a calendar system (all five, round 14). */
private fun systemLabel(strings: LocalStrings, system: CalendarSystem): String = when (system) {
    CalendarSystem.GREGORIAN -> strings.systemGregorian
    CalendarSystem.JALALI -> strings.systemJalali
    CalendarSystem.IMPERIAL -> strings.systemImperial
    CalendarSystem.IMPERIAL_SOLAR -> strings.systemImperialSolar
    CalendarSystem.ANCIENT -> strings.systemAncient
}

/** Hint text of a calendar system ("" for gregorian/jalali — none exists). */
private fun systemHint(strings: LocalStrings, system: CalendarSystem): String = when (system) {
    CalendarSystem.IMPERIAL -> strings.systemImperialHint
    CalendarSystem.IMPERIAL_SOLAR -> strings.systemImperialSolarHint
    CalendarSystem.ANCIENT -> strings.systemAncientHint
    else -> ""
}

@Composable
private fun ToggleRow(
    label: String,
    checked: Boolean,
    subtitle: String? = null,
    onChange: (Boolean) -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.bodyLarge)
            if (subtitle != null) {
                Text(
                    subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Switch(checked = checked, onCheckedChange = onChange)
    }
}

@Composable
private fun NtpRow(label: String, value: String) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}

private fun queryDisplayName(resolver: android.content.ContentResolver, uri: Uri): String? =
    try {
        resolver.query(uri, null, null, null, null)?.use { cursor ->
            val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (idx >= 0 && cursor.moveToFirst()) cursor.getString(idx) else null
        }
    } catch (_: Exception) {
        null
    }
