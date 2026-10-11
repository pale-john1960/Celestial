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
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.DateFormats
import com.celestial.calendar.engine.Jdn

/**
 * Celestial — "Add event" dialog (opened from the hero header ✛ button).
 *
 * Creates a manual event (sourceName = "manual") on a Gregorian date: the
 * field is pre-filled with the currently selected day's ISO date and shows a
 * live conversion into the active calendar system. The date is validated
 * with the engine's ISO parser (+ real month length, years 1900–2100, same
 * window as the web app); an invalid date disables Save and shows a
 * supporting error text. Titles are 1–120 chars, descriptions ≤ 500.
 */
@Composable
fun AddEventDialog(
    system: CalendarSystem,
    locale: AppLocale,
    selectedIso: String,
    strings: LocalStrings,
    onSave: (title: String, description: String, isHoliday: Boolean, iso: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var isHoliday by remember { mutableStateOf(false) }
    var dateText by remember { mutableStateOf(selectedIso) }

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
        title = { Text(strings.addEventTitle) },
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
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(title.trim(), description.trim().take(500), isHoliday, dateText.trim())
                },
                enabled = titleValid && dateValid,
            ) { Text(strings.save) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(strings.cancel) }
        },
    )
}
