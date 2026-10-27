package com.abdullah.laqeeni.ui.screens

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.ui.components.GradientScreen
import com.abdullah.laqeeni.ui.components.LaqeeniLogo
import com.abdullah.laqeeni.ui.theme.ElectricBlue
import com.abdullah.laqeeni.ui.theme.Emerald
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(onReady: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(1450)
        onReady()
    }
    GradientScreen {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            LaqeeniLogo(size = 158.dp)
            Spacer(Modifier.height(28.dp))
            Text(
                text = stringResource(R.string.app_name),
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = stringResource(R.string.slogan),
                style = MaterialTheme.typography.bodyLarge,
                color = Emerald,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(46.dp))
            LoadingDots()
        }
        Text(
            text = stringResource(R.string.welcome_tagline),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 38.dp),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun LoadingDots() {
    val transition = rememberInfiniteTransition(label = "dots")
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        repeat(3) { index ->
            val alpha by transition.animateFloat(
                initialValue = 0.2f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(650, delayMillis = index * 160),
                    repeatMode = RepeatMode.Reverse,
                ),
                label = "dot$index",
            )
            Box(
                Modifier
                    .size(8.dp)
                    .alpha(alpha)
                    .clip(CircleShape)
                    .background(if (index == 1) Emerald else ElectricBlue),
            )
        }
    }
}
