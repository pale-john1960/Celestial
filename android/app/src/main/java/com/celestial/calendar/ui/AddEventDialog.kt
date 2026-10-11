package com.celestial.calendar.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.celestial.calendar.data.ImportedEvent
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.Jdn

/**
 * Celestial — "Add event" / "Edit event" dialog (hero header ✛ button, the
 * imported-events manager rows and the ✎ icon on imported/manual event
 * cards).
 *
 * Creates a manual event (sourceName = "manual") on a Gregorian date, or
 * edits an existing Room row when [editing] is non-null (fields prefilled).
 * The date field is pre-filled with the selected day's ISO date (or the
 * row's date in edit mode) and shows a live conversion into the active
 * calendar system. The date is validated with the engine's ISO parser (+
 * real month length, years 1900–2100, same window as the web app); an
 * invalid date disables Save and shows a supporting error text. Titles are
 * 1–120 chars, descriptions ≤ 500. "Repeats yearly" marks the row as an
 * annual series (birthdays, anniversaries — Feb 29 falls back to Feb 28 in
 * non-leap years). In edit mode a destructive Delete button runs the
 * existing delete path.
 */
@Composable
fun AddEventDialog(
    system: CalendarSystem,
    locale: AppLocale,
    selectedIso: String,
    strings: LocalStrings,
    editing: ImportedEvent? = null,
    onSave: (title: String, description: String, isHoliday: Boolean, iso: String, recurYearly: Boolean) -> Unit,
    onDelete: (() -> Unit)? = null,
    onDismiss: () -> Unit,
) {
    var title by remember(editing) { mutableStateOf(editing?.title ?: "") }
    var description by remember(editing) { mutableStateOf(editing?.description ?: "") }
    var isHoliday by remember(editing) { mutableStateOf(editing?.isHoliday ?: false) }
    var dateText by remember(editing) { mutableStateOf(editing?.iso ?: selectedIso) }
    var recurYearly by remember(editing) { mutableStateOf(editing?.recurYearly ?: false) }

    val parsedDate = Jdn.parseIso(dateText)
    val dateValid = parsedDate != null && parsedDate.let {
        it.day <= Jdn.daysInMonth(it.year, it.month) && it.year in 1900..2100
    }
    val titleValid = title.trim().length in 1..120

    // the currently selected day in the active system (caption above the fields)
    val selectedDate = remember(selectedIso) {
        Jdn.parseIso(selectedIso)?.let { CalendarFacade.buildCelestialDate(it) }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (editing != null) strings.editEvent else strings.addEventTitle) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                if (selectedDate != null) {
                    Text(
                        DateFormats.fullSystemDate(system, locale, selectedDate),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                OutlinedTextField(
                    value = title,
                    onValueChange = { if (it.length <= 120) title = it },
                    label = { Text(strings.addEventName) },
                    singleLine = true,
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { if (it.length <= 500) description = it },
                    label = { Text(strings.addEventDesc) },
                )
                OutlinedTextField(
                    value = dateText,
                    onValueChange = { dateText = it },
                    label = { Text(strings.addEventDate) },
                    singleLine = true,
                    isError = !dateValid,
                    supportingText = {
                        val g = parsedDate
                        Text(
                            if (!dateValid) {
                                strings.addEventInvalidDate
                            } else if (g != null) {
                                DateFormats.fullSystemDate(
                                    system, locale, CalendarFacade.buildCelestialDate(g),
                                )
                            } else {
                                ""
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = if (!dateValid) MaterialTheme.colorScheme.error
                            else MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    },
                )
                Row(
                    Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        strings.addEventHoliday,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.weight(1f),
                    )
                    Switch(checked = isHoliday, onCheckedChange = { isHoliday = it })
                }
                Row(
                    Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(strings.addEventYearly, style = MaterialTheme.typography.bodyMedium)
                        Text(
                            strings.addEventYearlyHint,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Switch(checked = recurYearly, onCheckedChange = { recurYearly = it })
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(
                        title.trim(),
                        description.trim().take(500),
                        isHoliday,
                        dateText.trim(),
                        recurYearly,
                    )
                },
                enabled = titleValid && dateValid,
            ) { Text(strings.save) }
        },
        dismissButton = {
            Row {
                if (editing != null && onDelete != null) {
                    TextButton(onClick = onDelete) {
                        Text(strings.deleteEvent, color = MaterialTheme.colorScheme.error)
                    }
                }
                TextButton(onClick = onDismiss) { Text(strings.cancel) }
            }
        },
    )
}
