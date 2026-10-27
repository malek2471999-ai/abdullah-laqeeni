package com.abdullah.laqeeni.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.abdullah.laqeeni.ui.theme.AlertRed
import com.abdullah.laqeeni.ui.theme.ElectricBlue
import com.abdullah.laqeeni.ui.theme.Emerald
import com.abdullah.laqeeni.ui.theme.Navy
import com.abdullah.laqeeni.ui.theme.Violet

@Composable
fun GradientScreen(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit,
) {
    val background = MaterialTheme.colorScheme.background
    val surface = MaterialTheme.colorScheme.surface
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(surface, background, background))),
    ) {
        Canvas(Modifier.fillMaxSize()) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(ElectricBlue.copy(alpha = 0.16f), Color.Transparent),
                    center = Offset(size.width * 0.9f, size.height * 0.05f),
                    radius = size.minDimension * 0.7f,
                ),
                radius = size.minDimension * 0.7f,
                center = Offset(size.width * 0.9f, size.height * 0.05f),
            )
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Emerald.copy(alpha = 0.09f), Color.Transparent),
                    center = Offset(size.width * 0.05f, size.height * 0.8f),
                    radius = size.minDimension * 0.6f,
                ),
                radius = size.minDimension * 0.6f,
                center = Offset(size.width * 0.05f, size.height * 0.8f),
            )
        }
        content()
    }
}

@Composable
fun LaqeeniLogo(
    modifier: Modifier = Modifier,
    size: Dp = 128.dp,
    animated: Boolean = true,
) {
    val transition = rememberInfiniteTransition(label = "logo")
    val sweep by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(4200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "sweep",
    )
    val pulse by transition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(tween(1600), RepeatMode.Reverse),
        label = "pulse",
    )
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(
                Brush.radialGradient(
                    listOf(
                        ElectricBlue.copy(alpha = 0.32f),
                        Navy.copy(alpha = 0.85f),
                        Color.Transparent,
                    ),
                ),
            )
            .border(1.dp, ElectricBlue.copy(alpha = 0.35f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val radius = this.size.minDimension / 2f
            drawCircle(
                color = ElectricBlue.copy(alpha = 0.20f),
                radius = radius * 0.94f,
                style = Stroke(width = 1.dp.toPx()),
            )
            drawCircle(
                color = ElectricBlue.copy(alpha = 0.28f),
                radius = radius * 0.72f,
                style = Stroke(width = 1.dp.toPx()),
            )
            drawCircle(
                color = Emerald.copy(alpha = 0.22f),
                radius = radius * 0.50f,
                style = Stroke(width = 1.dp.toPx()),
            )
            if (animated) {
                rotate(sweep) {
                    drawLine(
                        brush = Brush.linearGradient(
                            listOf(Emerald.copy(alpha = 0.9f), Color.Transparent),
                            start = center,
                            end = Offset(center.x + radius, center.y),
                        ),
                        start = center,
                        end = Offset(center.x + radius * 0.9f, center.y),
                        strokeWidth = 3.dp.toPx(),
                        cap = StrokeCap.Round,
                    )
                }
            }
            drawCircle(
                color = Emerald.copy(alpha = 0.25f),
                radius = radius * 0.32f * pulse,
                style = Stroke(width = 2.dp.toPx()),
            )
        }
        Box(
            modifier = Modifier
                .size(size * 0.34f)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(listOf(ElectricBlue, Emerald)),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Filled.PhoneAndroid,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(size * 0.19f),
            )
        }
    }
}

@Composable
fun LaqeeniTopBar(
    title: String,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
    actions: @Composable () -> Unit = {},
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = MaterialTheme.colorScheme.onBackground,
                )
            }
        } else {
            Spacer(Modifier.width(8.dp))
        }
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.weight(1f),
        )
        actions()
    }
}

@Composable
fun SectionCard(
    modifier: Modifier = Modifier,
    title: String? = null,
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.86f),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.8f),
        ),
    ) {
        Column(Modifier.padding(18.dp)) {
            if (title != null) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(12.dp))
            }
            content()
        }
    }
}

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    icon: ImageVector? = null,
    container: Color = MaterialTheme.colorScheme.primary,
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp),
        enabled = enabled && !loading,
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = container,
            contentColor = Color.White,
        ),
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(22.dp),
                strokeWidth = 2.dp,
                color = Color.White,
            )
        } else {
            if (icon != null) {
                Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(10.dp))
            }
            Text(text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    icon: ImageVector? = null,
    contentColor: Color = MaterialTheme.colorScheme.onBackground,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp),
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline.copy(alpha = 0.7f),
        ),
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, tint = contentColor, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(10.dp))
        }
        Text(text, color = contentColor, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
fun LaqeeniField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    leadingIcon: ImageVector? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    isPassword: Boolean = false,
    singleLine: Boolean = true,
    enabled: Boolean = true,
    supportingText: String? = null,
    isError: Boolean = false,
    maxLines: Int = if (singleLine) 1 else 5,
    trailing: (@Composable () -> Unit)? = null,
) {
    var hidden by remember { mutableStateOf(isPassword) }
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        label = { Text(label) },
        singleLine = singleLine,
        maxLines = maxLines,
        enabled = enabled,
        isError = isError,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        visualTransformation = if (isPassword && hidden) {
            PasswordVisualTransformation()
        } else {
            VisualTransformation.None
        },
        leadingIcon = leadingIcon?.let {
            { Icon(it, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant) }
        },
        trailingIcon = when {
            isPassword -> {
                {
                    IconButton(onClick = { hidden = !hidden }) {
                        Icon(
                            if (hidden) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                            contentDescription = null,
                        )
                    }
                }
            }
            else -> trailing
        },
        supportingText = supportingText?.let { { Text(it) } },
        shape = RoundedCornerShape(16.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = ElectricBlue,
            unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.6f),
            focusedLabelColor = ElectricBlue,
            cursorColor = ElectricBlue,
            focusedContainerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
            unfocusedContainerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.3f),
        ),
    )
}

@Composable
fun StatusPill(
    online: Boolean,
    modifier: Modifier = Modifier,
    onlineText: String = "Online",
    offlineText: String = "Offline",
) {
    val color = if (online) Emerald else MaterialTheme.colorScheme.onSurfaceVariant
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.14f))
            .border(1.dp, color.copy(alpha = 0.35f), RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier
                .size(7.dp)
                .clip(CircleShape)
                .background(color),
        )
        Spacer(Modifier.width(6.dp))
        Text(
            text = if (online) onlineText else offlineText,
            style = MaterialTheme.typography.labelMedium,
            color = color,
        )
    }
}

@Composable
fun InfoRow(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    valueColor: Color = MaterialTheme.colorScheme.onSurface,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Icon(
                icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(18.dp),
            )
            Spacer(Modifier.width(10.dp))
        }
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = valueColor,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.End,
        )
    }
}

@Composable
fun Banner(
    message: String,
    modifier: Modifier = Modifier,
    isError: Boolean = true,
) {
    val color = if (isError) AlertRed else Emerald
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = color.copy(alpha = 0.12f),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.35f)),
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            color = color,
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 42.dp, horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(88.dp)
                .clip(CircleShape)
                .background(ElectricBlue.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = ElectricBlue, modifier = Modifier.size(40.dp))
        }
        Spacer(Modifier.height(18.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        if (actionLabel != null && onAction != null) {
            Spacer(Modifier.height(20.dp))
            Button(
                onClick = onAction,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue),
            ) {
                Text(actionLabel)
            }
        }
    }
}

@Composable
fun ConfirmDialog(
    title: String,
    message: String,
    confirmLabel: String,
    dismissLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    destructive: Boolean = false,
) {
    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(message) },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text(confirmLabel, color = if (destructive) AlertRed else ElectricBlue)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(dismissLabel) }
        },
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(24.dp),
    )
}

@Composable
fun LoadingBox(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxWidth().padding(44.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = ElectricBlue, strokeWidth = 2.5.dp)
    }
}

@Composable
fun DividerSpace() {
    HorizontalDivider(
        modifier = Modifier.padding(vertical = 10.dp),
        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f),
    )
}

@Composable
fun ActionTile(
    icon: ImageVector,
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    color: Color = ElectricBlue,
    onClick: () -> Unit,
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.7f),
        ),
    ) {
        Row(
            Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(color.copy(alpha = 0.14f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                if (subtitle.isNotBlank()) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
fun BrandGradient(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(
                Brush.linearGradient(listOf(ElectricBlue, Violet.copy(alpha = 0.9f))),
            ),
    ) {
        content()
    }
}

val BrandAccents = listOf(ElectricBlue, Emerald, Violet, AlertRed)

@Composable
fun LabelValue(label: String, value: String, color: Color = MaterialTheme.colorScheme.onSurface) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(4.dp))
        Text(value, style = MaterialTheme.typography.bodyLarge, color = color)
    }
}

@Composable
fun ScreenTitle(title: String, subtitle: String? = null) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 6.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
        if (subtitle != null) {
            Spacer(Modifier.height(6.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
fun ScreenPadding(content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        content = content,
    )
}

@Composable
fun SmallSpacer() = Spacer(Modifier.height(8.dp))

@Composable
fun TinyTag(text: String, color: Color = Emerald) {
    Text(
        text = text.uppercase(),
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.14f))
            .padding(horizontal = 8.dp, vertical = 4.dp),
        color = color,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 1.sp,
    )
}
