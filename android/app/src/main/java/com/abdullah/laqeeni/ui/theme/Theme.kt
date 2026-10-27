package com.abdullah.laqeeni.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColors = darkColorScheme(
    primary = ElectricBlue,
    onPrimary = White,
    primaryContainer = Color(0xFF0B3E73),
    onPrimaryContainer = Ice,
    secondary = Emerald,
    onSecondary = Navy,
    secondaryContainer = Color(0xFF06483A),
    onSecondaryContainer = Color(0xFFB9FFE8),
    tertiary = Violet,
    onTertiary = White,
    error = AlertRed,
    onError = White,
    background = Navy,
    onBackground = Ice,
    surface = NavySurface,
    onSurface = Ice,
    surfaceVariant = NavyElevated,
    onSurfaceVariant = MutedText,
    outline = Color(0xFF294664),
    outlineVariant = Color(0xFF1A3552),
    inverseSurface = Ice,
    inverseOnSurface = Navy,
)

private val LightColors = lightColorScheme(
    primary = ElectricBlueDark,
    onPrimary = White,
    primaryContainer = Color(0xFFD7E9FF),
    onPrimaryContainer = Color(0xFF00264D),
    secondary = Color(0xFF00805C),
    onSecondary = White,
    secondaryContainer = Color(0xFFB9FFE8),
    onSecondaryContainer = Color(0xFF00382A),
    tertiary = Color(0xFF6A3BDB),
    onTertiary = White,
    error = Color(0xFFC52333),
    onError = White,
    background = Color(0xFFF3F8FE),
    onBackground = Color(0xFF0A1B2C),
    surface = White,
    onSurface = Color(0xFF0A1B2C),
    surfaceVariant = Color(0xFFE4EEF9),
    onSurfaceVariant = Color(0xFF476176),
    outline = Color(0xFFB4C7DA),
    outlineVariant = Color(0xFFD7E3EF),
)

@Composable
fun LaqeeniTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColors else LightColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? android.app.Activity)?.window ?: return@SideEffect
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
        }
    }
    MaterialTheme(
        colorScheme = colors,
        typography = LaqeeniTypography,
        content = content,
    )
}
