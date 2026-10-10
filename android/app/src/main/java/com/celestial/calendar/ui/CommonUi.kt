package com.celestial.calendar.ui

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
import com.celestial.calendar.ui.theme.categoryColor

/** Shared small UI pieces (event dots, category chips, day-off banner, event card). */
object CommonUi {

    /** Category dot color (web palette). */
    @Composable
    fun dotColor(category: EventCategory): Color = categoryColor(category)

    @Composable
    fun EventDots(events: List<EventInstance>, maxDots: Int = 3) {
        val cats = events.filter { !it.holidayOnly }.map { it.category }.distinct()
        if (cats.isEmpty()) return
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            cats.take(maxDots).forEach { cat ->
                Box(
                    Modifier
                        .size(5.dp)
                        .background(categoryColor(cat), CircleShape)
                )
            }
        }
    }

    @Composable
    fun CategoryChip(category: EventCategory, locale: AppLocale, strings: LocalStrings) {
        val label = when (category) {
            EventCategory.INTERNATIONAL -> strings.srcInternational
            EventCategory.US -> strings.srcUs
            EventCategory.JAPAN -> strings.srcJapan
            EventCategory.PERSIAN_CULTURAL -> strings.culturalBadge
            EventCategory.PERSIAN_RELIGIOUS -> strings.religiousBadge
            EventCategory.PERSIAN_NATIONAL -> strings.nationalBadge
            EventCategory.IMPORTED -> strings.srcImported
        }
        Surface(
            shape = RoundedCornerShape(50),
            color = categoryColor(category).copy(alpha = 0.14f),
        ) {
            Row(
                Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Box(
                    Modifier
                        .size(6.dp)
                        .background(categoryColor(category), CircleShape)
                )
                Text(
                    label,
                    style = MaterialTheme.typography.labelSmall,
                    color = categoryColor(category),
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

    /** Full event card for the Day view. */
    @Composable
    fun EventCard(
        event: EventInstance,
        locale: AppLocale,
        strings: LocalStrings,
        onClick: () -> Unit = {},
    ) {
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = MaterialTheme.colorScheme.surface,
            border = androidx.compose.foundation.BorderStroke(
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
                    )
                    Box(Modifier.weight(1f))
                    CategoryChip(event.category, locale, strings)
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
