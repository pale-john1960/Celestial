package com.celestial.calendar.ui.theme

import androidx.compose.ui.graphics.Color
import com.celestial.calendar.events.EventCategory
import com.celestial.calendar.events.EventInstance

/**
 * Celestial palette — magenta primary (#C2185B), cream background (#FDFBF7),
 * white surfaces, charcoal text. NO blue / indigo anywhere.
 */
val CelestialPrimary = Color(0xFFC2185B)
val CelestialOnPrimary = Color(0xFFFFFFFF)
val CelestialPrimaryContainer = Color(0xFFFFD9E4)
val CelestialOnPrimaryContainer = Color(0xFF3F0019)

val CelestialSecondary = Color(0xFF9C4A72)
val CelestialOnSecondary = Color(0xFFFFFFFF)
val CelestialSecondaryContainer = Color(0xFFFFD6E7)
val CelestialOnSecondaryContainer = Color(0xFF3E0022)

val CelestialTertiary = Color(0xFF5B8C85)
val CelestialOnTertiary = Color(0xFFFFFFFF)
val CelestialTertiaryContainer = Color(0xFFD7EDE9)
val CelestialOnTertiaryContainer = Color(0xFF1D3531)

val CelestialBackground = Color(0xFFFDFBF7)
val CelestialOnBackground = Color(0xFF1A1A1A)
val CelestialSurface = Color(0xFFFFFFFF)
val CelestialOnSurface = Color(0xFF1A1A1A)
val CelestialSurfaceVariant = Color(0xFFF3EDE4)
val CelestialOnSurfaceVariant = Color(0xFF5C554E)
val CelestialOutline = Color(0xFFD8CFC4)

val CelestialError = Color(0xFFB3261E)
val CelestialOnError = Color(0xFFFFFFFF)
val CelestialErrorContainer = Color(0xFFF9DEDC)
val CelestialOnErrorContainer = Color(0xFF410E0B)

// Dark scheme
val CelestialPrimaryDark = Color(0xFFFF7BA9)
val CelestialOnPrimaryDark = Color(0xFF5E0030)
val CelestialPrimaryContainerDark = Color(0xFF8E0043)
val CelestialOnPrimaryContainerDark = Color(0xFFFFD9E4)

val CelestialSecondaryDark = Color(0xFFFFAECB)
val CelestialOnSecondaryDark = Color(0xFF5A1138)
val CelestialSecondaryContainerDark = Color(0xFF76284E)
val CelestialOnSecondaryContainerDark = Color(0xFFFFD6E7)

val CelestialTertiaryDark = Color(0xFFA3D2CA)
val CelestialOnTertiaryDark = Color(0xFF103833)
val CelestialTertiaryContainerDark = Color(0xFF2C4E49)
val CelestialOnTertiaryContainerDark = Color(0xFFBFEBE2)

val CelestialBackgroundDark = Color(0xFF181315)
val CelestialOnBackgroundDark = Color(0xFFF0E8E4)
val CelestialSurfaceDark = Color(0xFF201A1C)
val CelestialOnSurfaceDark = Color(0xFFF0E8E4)
val CelestialSurfaceVariantDark = Color(0xFF3A3134)
val CelestialOnSurfaceVariantDark = Color(0xFFD0C4C0)
val CelestialOutlineDark = Color(0xFF9C8F8B)

val CelestialErrorDark = Color(0xFFF2B8B5)
val CelestialOnErrorDark = Color(0xFF601410)
val CelestialErrorContainerDark = Color(0xFF8C1D18)
val CelestialOnErrorContainerDark = Color(0xFFF9DEDC)

/** Event category dot colors — same palette as the web app. */
val CategoryInternational = Color(0xFF8E7CC3)
val CategoryUs = Color(0xFFC2185B)
val CategoryJapan = Color(0xFFD95970)
val CategoryPersianCultural = Color(0xFF2BA84A)
val CategoryPersianReligious = Color(0xFFB8860B)
val CategoryPersianNational = Color(0xFFC2185B)
val CategoryImported = Color(0xFF5B8C85)

fun categoryColor(category: EventCategory): Color = when (category) {
    EventCategory.INTERNATIONAL -> CategoryInternational
    EventCategory.US -> CategoryUs
    EventCategory.JAPAN -> CategoryJapan
    EventCategory.PERSIAN_CULTURAL -> CategoryPersianCultural
    EventCategory.PERSIAN_RELIGIOUS -> CategoryPersianReligious
    EventCategory.PERSIAN_NATIONAL -> CategoryPersianNational
    EventCategory.IMPORTED -> CategoryImported
}

/**
 * User-selectable per-event color palette (Task 9 — shared spec with the web
 * app, no indigo/blue). Stored as 6-digit LOWERCASE hex, matching the web
 * storage convention; `null` means "use the category default color".
 */
val EventPaletteHexes = listOf(
    "#c2185b", // magenta
    "#d95970", // rose
    "#e07b39", // orange
    "#b8860b", // gold
    "#2ba84a", // green
    "#5b8c85", // teal
    "#8e7cc3", // violet
    "#64748b", // slate
)

/** Normalize a stored per-event color: trimmed lowercase hex; null when blank. */
fun normalizeEventColor(hex: String?): String? =
    hex?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }

/**
 * Defensive hex parse for `#rrggbb` / `#aarrggbb` — returns null for invalid
 * input instead of throwing (stored colors may come from edited rows).
 */
fun parseHexColor(hex: String): Color? = try {
    Color(android.graphics.Color.parseColor(hex.trim()))
} catch (_: IllegalArgumentException) {
    null
}

/**
 * The color an event renders with: its per-event override (Task 9) when set
 * and valid, otherwise the category default. Invalid stored hex falls back to
 * the category color too.
 */
fun eventColor(event: EventInstance): Color =
    normalizeEventColor(event.color)?.let { parseHexColor(it) } ?: categoryColor(event.category)
