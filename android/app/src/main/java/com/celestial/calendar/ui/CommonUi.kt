package com.celestial.calendar.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.events.EventCategory
import com.celestial.calendar.events.EventInstance
import com.celestial.calendar.events.EventSource
import com.celestial.calendar.ui.theme.categoryColor
import com.celestial.calendar.ui.theme.eventColor

/** Shared small UI pieces (event dots, category chips, day-off banner, event card). */
object CommonUi {

    /** Category dot color (web palette). */
    fun dotColor(category: EventCategory): Color = categoryColor(category)

    /** Per-event color: the user's override (Task 9) or the category default. */
    fun dotColor(event: EventInstance): Color = eventColor(event)

    @Composable
    fun EventDots(events: List<EventInstance>, maxDots: Int = 3) {
        val colors = events.filter { !it.holidayOnly }.map { dotColor(it) }.distinct()
        if (colors.isEmpty()) return
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            colors.take(maxDots).forEach { c ->
                Box(
                    Modifier
                        .size(5.dp)
                        .background(c, CircleShape)
                )
            }
        }
    }

    @Composable
    fun CategoryChip(
        category: EventCategory,
        locale: AppLocale,
        strings: LocalStrings,
        manual: Boolean = false,
        colorOverride: Color? = null,
    ) {
        val label = if (manual) strings.sourceManual else when (category) {
            EventCategory.INTERNATIONAL -> strings.srcInternational
            EventCategory.US -> strings.srcUs
            EventCategory.JAPAN -> strings.srcJapan
            EventCategory.PERSIAN_CULTURAL -> strings.culturalBadge
            EventCategory.PERSIAN_RELIGIOUS -> strings.religiousBadge
            EventCategory.PERSIAN_NATIONAL -> strings.nationalBadge
            EventCategory.IMPORTED -> strings.srcImported
        }
        // a per-event color (Task 9) replaces the category tint on the chip
        val color = colorOverride ?: categoryColor(category)
        Surface(
            shape = RoundedCornerShape(50),
            color = color.copy(alpha = 0.14f),
        ) {
            Row(
                Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Box(
                    Modifier
                        .size(6.dp)
                        .background(color, CircleShape)
                )
                Text(
                    label,
                    style = MaterialTheme.typography.labelSmall,
                    color = color,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }

    /** Red "Day off" banner shown for holidays in the Day view. */
    @Composable
    fun DayOffBanner(strings: LocalStrings) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.errorContainer,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("🌙", fontSize = 18.sp)
                Column {
                    Text(
                        strings.dayOff,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                    )
                    Text(
                        strings.dayOffNotice,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                    )
                }
            }
        }
    }

    /** Outlined "🔁 Repeats yearly" chip for recurring annual events. */
    @Composable
    fun RecurringChip(strings: LocalStrings, modifier: Modifier = Modifier) {
        Surface(
            shape = RoundedCornerShape(50),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)),
            color = androidx.compose.ui.graphics.Color.Transparent,
            modifier = modifier,
        ) {
            Text(
                "🔁 " + strings.recurringYearly,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            )
        }
    }

    /** Full event card for the Day view. */
    @Composable
    fun EventCard(
        event: EventInstance,
        locale: AppLocale,
        strings: LocalStrings,
        onClick: () -> Unit = {},
        onEdit: (() -> Unit)? = null,
    ) {
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(
                1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 3.dp),
            onClick = onClick,
        ) {
            Column(Modifier.padding(12.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(event.emoji, fontSize = 20.sp)
                    Text(
                        event.localName(locale.code),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.weight(1f, fill = false),
                    )
                    if (event.recurring) {
                        RecurringChip(strings)
                    }
                    if (onEdit != null) {
                        IconButton(
                            onClick = onEdit,
                            modifier = Modifier.size(30.dp),
                        ) {
                            Icon(
                                Icons.Filled.Edit,
                                contentDescription = strings.editEvent,
                                modifier = Modifier.size(16.dp),
                            )
                        }
                    }
                    CategoryChip(
                        event.category,
                        locale,
                        strings,
                        manual = event.manual,
                        colorOverride = dotColor(event),
                    )
                }
                val desc = event.localDescription(locale.code)
                if (desc.isNotBlank()) {
                    Text(
                        desc,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp, start = 28.dp),
                    )
                }
            }
        }
    }

    /** Localized source label for an event (used by the ICS export + chips). */
    fun sourceLabel(event: EventInstance, strings: LocalStrings): String = when {
        event.manual -> strings.sourceManual
        event.source == EventSource.IMPORTED -> strings.srcImported
        else -> when (event.category) {
            EventCategory.INTERNATIONAL -> strings.srcInternational
            EventCategory.US -> strings.srcUs
            EventCategory.JAPAN -> strings.srcJapan
            EventCategory.PERSIAN_CULTURAL -> strings.culturalBadge
            EventCategory.PERSIAN_RELIGIOUS -> strings.religiousBadge
            EventCategory.PERSIAN_NATIONAL -> strings.nationalBadge
            EventCategory.IMPORTED -> strings.srcImported
        }
    }

    @Composable
    fun SectionLabel(text: String, modifier: Modifier = Modifier) {
        Text(
            text,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.primary,
            modifier = modifier.padding(top = 18.dp, bottom = 6.dp),
        )
    }

    @Composable
    fun Divider() {
        Box(
            Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
        )
    }
}
