package com.celestial.calendar.ui.theme

import androidx.compose.ui.graphics.Color
import com.celestial.calendar.events.EventCategory

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
