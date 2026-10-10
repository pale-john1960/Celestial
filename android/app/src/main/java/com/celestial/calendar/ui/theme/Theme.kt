package com.celestial.calendar.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import com.celestial.calendar.data.ThemeMode

private val LightColors = lightColorScheme(
    primary = CelestialPrimary,
    onPrimary = CelestialOnPrimary,
    primaryContainer = CelestialPrimaryContainer,
    onPrimaryContainer = CelestialOnPrimaryContainer,
    secondary = CelestialSecondary,
    onSecondary = CelestialOnSecondary,
    secondaryContainer = CelestialSecondaryContainer,
    onSecondaryContainer = CelestialOnSecondaryContainer,
    tertiary = CelestialTertiary,
    onTertiary = CelestialOnTertiary,
    tertiaryContainer = CelestialTertiaryContainer,
    onTertiaryContainer = CelestialOnTertiaryContainer,
    background = CelestialBackground,
    onBackground = CelestialOnBackground,
    surface = CelestialSurface,
    onSurface = CelestialOnSurface,
    surfaceVariant = CelestialSurfaceVariant,
    onSurfaceVariant = CelestialOnSurfaceVariant,
    outline = CelestialOutline,
    error = CelestialError,
    onError = CelestialOnError,
    errorContainer = CelestialErrorContainer,
    onErrorContainer = CelestialOnErrorContainer,
)

private val DarkColors = darkColorScheme(
    primary = CelestialPrimaryDark,
    onPrimary = CelestialOnPrimaryDark,
    primaryContainer = CelestialPrimaryContainerDark,
    onPrimaryContainer = CelestialOnPrimaryContainerDark,
    secondary = CelestialSecondaryDark,
    onSecondary = CelestialOnSecondaryDark,
    secondaryContainer = CelestialSecondaryContainerDark,
    onSecondaryContainer = CelestialOnSecondaryContainerDark,
    tertiary = CelestialTertiaryDark,
    onTertiary = CelestialOnTertiaryDark,
    tertiaryContainer = CelestialTertiaryContainerDark,
    onTertiaryContainer = CelestialOnTertiaryContainerDark,
    background = CelestialBackgroundDark,
    onBackground = CelestialOnBackgroundDark,
    surface = CelestialSurfaceDark,
    onSurface = CelestialOnSurfaceDark,
    surfaceVariant = CelestialSurfaceVariantDark,
    onSurfaceVariant = CelestialOnSurfaceVariantDark,
    outline = CelestialOutlineDark,
    error = CelestialErrorDark,
    onError = CelestialOnErrorDark,
    errorContainer = CelestialErrorContainerDark,
    onErrorContainer = CelestialOnErrorContainerDark,
)

@Composable
fun CelestialTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    content: @Composable () -> Unit,
) {
    val dark = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }
    MaterialTheme(
        colorScheme = if (dark) DarkColors else LightColors,
        typography = CelestialTypography,
        content = content,
    )
}
