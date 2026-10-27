package com.abdullah.laqeeni.ui.screens

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.ui.components.GradientScreen
import com.abdullah.laqeeni.ui.components.LaqeeniLogo
import com.abdullah.laqeeni.ui.components.PrimaryButton
import com.abdullah.laqeeni.ui.theme.ElectricBlue
import com.abdullah.laqeeni.ui.theme.Emerald
import com.abdullah.laqeeni.ui.theme.Violet
import kotlinx.coroutines.launch

private data class OnboardingPage(
    val titleRes: Int,
    val textRes: Int,
    val icon: ImageVector?,
    val color: Color,
    val features: List<Int> = emptyList(),
)

@Composable
fun OnboardingScreen(onDone: () -> Unit) {
    val pages = listOf(
        OnboardingPage(
            titleRes = R.string.onboarding_title,
            textRes = R.string.onboarding_subtitle,
            icon = null,
            color = ElectricBlue,
            features = listOf(
                R.string.feature_location,
                R.string.feature_alarm,
                R.string.feature_status,
                R.string.feature_privacy,
            ),
        ),
        OnboardingPage(
            titleRes = R.string.onboarding_2_title,
            textRes = R.string.onboarding_2_text,
            icon = Icons.Filled.LocationOn,
            color = Emerald,
        ),
        OnboardingPage(
            titleRes = R.string.onboarding_3_title,
            textRes = R.string.onboarding_3_text,
            icon = Icons.Filled.Shield,
            color = Violet,
        ),
    )
    val pagerState = rememberPagerState(pageCount = { pages.size })
    val scope = rememberCoroutineScope()

    GradientScreen {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 22.dp, vertical = 12.dp),
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = onDone) {
                    Text(stringResource(R.string.skip), color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.weight(1f),
            ) { index ->
                OnboardingPageContent(pages[index])
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                pages.indices.forEach { index ->
                    Box(
                        modifier = Modifier
                            .padding(horizontal = 4.dp)
                            .size(if (index == pagerState.currentPage) 22.dp else 8.dp, 8.dp)
                            .background(
                                if (index == pagerState.currentPage) ElectricBlue
                                else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                CircleShape,
                            ),
                    )
                }
            }
            Spacer(Modifier.height(20.dp))
            PrimaryButton(
                text = stringResource(
                    if (pagerState.currentPage == pages.lastIndex) R.string.start_now else R.string.next,
                ),
                onClick = {
                    if (pagerState.currentPage == pages.lastIndex) {
                        onDone()
                    } else {
                        scope.launch {
                            pagerState.animateScrollToPage(pagerState.currentPage + 1)
                        }
                    }
                },
            )
            Spacer(Modifier.height(18.dp))
        }
    }
}

@Composable
private fun OnboardingPageContent(page: OnboardingPage) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        if (page.icon == null) {
            LaqeeniLogo(size = 176.dp)
        } else {
            Box(
                modifier = Modifier
                    .size(176.dp)
                    .background(page.color.copy(alpha = 0.10f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(112.dp)
                        .background(page.color.copy(alpha = 0.16f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = page.icon,
                        contentDescription = null,
                        tint = page.color,
                        modifier = Modifier.size(56.dp),
                    )
                }
            }
        }
        Spacer(Modifier.height(34.dp))
        Text(
            text = stringResource(page.titleRes),
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(12.dp))
        Text(
            text = stringResource(page.textRes),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        if (page.features.isNotEmpty()) {
            Spacer(Modifier.height(26.dp))
            page.features.forEach { feature ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 5.dp)
                        .background(
                            MaterialTheme.colorScheme.surface.copy(alpha = 0.7f),
                            RoundedCornerShape(14.dp),
                        )
                        .padding(horizontal = 14.dp, vertical = 11.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        Modifier
                            .size(8.dp)
                            .background(Emerald, CircleShape),
                    )
                    Spacer(Modifier.width(12.dp))
                    Text(
                        text = stringResource(feature),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.Medium,
                    )
                }
            }
        }
        Spacer(Modifier.height(20.dp))
        Text(
            text = stringResource(R.string.welcome_tagline),
            color = page.color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
        )
    }
}
