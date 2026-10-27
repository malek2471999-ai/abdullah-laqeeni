package com.abdullah.laqeeni.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Directions
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LocationOff
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.ReportProblem
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.network.DeviceDto
import com.abdullah.laqeeni.ui.components.Banner
import com.abdullah.laqeeni.ui.components.ConfirmDialog
import com.abdullah.laqeeni.ui.components.GradientScreen
import com.abdullah.laqeeni.ui.components.InfoRow
import com.abdullah.laqeeni.ui.components.LaqeeniField
import com.abdullah.laqeeni.ui.components.LaqeeniMap
import com.abdullah.laqeeni.ui.components.LaqeeniTopBar
import com.abdullah.laqeeni.ui.components.LoadingBox
import com.abdullah.laqeeni.ui.components.PrimaryButton
import com.abdullah.laqeeni.ui.components.SecondaryButton
import com.abdullah.laqeeni.ui.components.SectionCard
import com.abdullah.laqeeni.ui.components.StatusPill
import com.abdullah.laqeeni.ui.components.TinyTag
import com.abdullah.laqeeni.ui.theme.AlertRed
import com.abdullah.laqeeni.ui.theme.ElectricBlue
import com.abdullah.laqeeni.ui.theme.Emerald
import com.abdullah.laqeeni.ui.theme.Violet
import com.abdullah.laqeeni.ui.util.batteryLabel
import com.abdullah.laqeeni.ui.util.formatDateTime
import com.abdullah.laqeeni.ui.util.networkLabel
import com.abdullah.laqeeni.ui.util.relativeTime
import com.abdullah.laqeeni.ui.viewmodel.AppViewModel
import com.abdullah.laqeeni.ui.viewmodel.DeviceViewModel

@Composable
fun DeviceScreen(
    appViewModel: AppViewModel,
    onBack: () -> Unit,
    onDeleted: () -> Unit,
) {
    val viewModel: DeviceViewModel = hiltViewModel()
    val state = viewModel.state
    val device = state.device
    val context = LocalContext.current
    val snackbar = remember { SnackbarHostState() }

    var renameOpen by remember { mutableStateOf(false) }
    var lostOpen by remember { mutableStateOf(false) }
    var messageOpen by remember { mutableStateOf(false) }
    var deleteOpen by remember { mutableStateOf(false) }

    LaunchedEffect(state.message, state.error) {
        val text = state.message ?: state.error ?: return@LaunchedEffect
        snackbar.showSnackbar(text)
        viewModel.clearMessages()
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        containerColor = Color.Transparent,
    ) { padding ->
        GradientScreen {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
            ) {
                LaqeeniTopBar(
                    title = device?.name ?: stringResource(R.string.device_details),
                    onBack = onBack,
                    actions = {
                        IconButton(onClick = { viewModel.load() }, enabled = !state.busy) {
                            Icon(
                                Icons.Filled.Refresh,
                                contentDescription = stringResource(R.string.refresh),
                                tint = ElectricBlue,
                            )
                        }
                    },
                )
                if (state.loading && device == null) {
                    LoadingBox()
                } else if (device == null) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Banner(state.error ?: stringResource(R.string.error_generic))
                        Spacer(Modifier.height(16.dp))
                        PrimaryButton(
                            text = stringResource(R.string.retry),
                            onClick = { viewModel.load() },
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(
                            start = 16.dp,
                            end = 16.dp,
                            bottom = 30.dp,
                        ),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        item { DeviceHero(device) }

                        if (state.error != null) {
                            item { Banner(state.error) }
                        }

                        item {
                            LocationCard(
                                device = device,
                                busy = state.busy,
                                onLocate = viewModel::locate,
                            )
                        }

                        item {
                            SectionCard(title = stringResource(R.string.quick_actions)) {
                                PrimaryButton(
                                    text = stringResource(R.string.ring_now),
                                    icon = Icons.Filled.VolumeUp,
                                    container = AlertRed,
                                    loading = state.busy,
                                    onClick = viewModel::ring,
                                )
                                Spacer(Modifier.height(10.dp))
                                SecondaryButton(
                                    text = stringResource(R.string.stop_alarm),
                                    icon = Icons.Filled.Stop,
                                    enabled = !state.busy,
                                    onClick = viewModel::stop,
                                )
                                Spacer(Modifier.height(10.dp))
                                SecondaryButton(
                                    text = stringResource(R.string.send_message),
                                    icon = Icons.Filled.Send,
                                    enabled = !state.busy,
                                    onClick = { messageOpen = true },
                                )
                            }
                        }

                        item {
                            ActionSummary(device)
                        }

                        item {
                            LostModeCard(
                                device = device,
                                busy = state.busy,
                                onEnable = { lostOpen = true },
                                onDisable = { viewModel.setLostMode(false, null, null) },
                            )
                        }

                        item {
                            HistoryCard(
                                enabled = state.historyEnabled,
                                days = state.retentionDays,
                                points = state.history.size,
                                busy = state.busy,
                                onToggle = { enabled ->
                                    viewModel.updateHistory(enabled, state.retentionDays)
                                },
                                onDaysSelected = { days ->
                                    viewModel.updateHistory(state.historyEnabled, days)
                                },
                            )
                        }

                        item {
                            SectionCard(title = stringResource(R.string.device_details)) {
                                InfoRow(
                                    label = stringResource(R.string.manufacturer),
                                    value = device.manufacturer,
                                )
                                InfoRow(label = stringResource(R.string.model), value = device.model)
                                InfoRow(
                                    label = stringResource(R.string.android_version),
                                    value = device.androidVersion,
                                )
                                InfoRow(
                                    label = stringResource(R.string.battery),
                                    value = batteryLabel(device.batteryLevel, device.charging),
                                )
                                InfoRow(
                                    label = stringResource(R.string.network),
                                    value = networkLabel(device.networkType),
                                )
                                InfoRow(
                                    label = stringResource(R.string.paired_at),
                                    value = formatDateTime(device.pairedAt),
                                )
                                InfoRow(
                                    label = stringResource(R.string.last_update),
                                    value = formatDateTime(device.lastSyncAt ?: device.lastSeenAt),
                                )
                                Spacer(Modifier.height(10.dp))
                                SecondaryButton(
                                    text = stringResource(R.string.rename),
                                    icon = Icons.Filled.Edit,
                                    onClick = { renameOpen = true },
                                )
                            }
                        }

                        item {
                            SectionCard(title = stringResource(R.string.danger_zone)) {
                                Text(
                                    text = stringResource(R.string.delete_confirm),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                                Spacer(Modifier.height(12.dp))
                                PrimaryButton(
                                    text = stringResource(R.string.delete_device),
                                    icon = Icons.Filled.Delete,
                                    container = AlertRed,
                                    loading = state.busy,
                                    onClick = { deleteOpen = true },
                                )
                            }
                        }

                        item {
                            Text(
                                text = stringResource(R.string.security_note),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 6.dp),
                            )
                        }
                    }
                }
            }
        }
    }

    if (renameOpen && device != null) {
        RenameDialog(
            initial = device.name,
            loading = state.busy,
            onDismiss = { renameOpen = false },
            onSave = {
                renameOpen = false
                viewModel.rename(it)
            },
        )
    }

    if (lostOpen && device != null) {
        LostModeDialog(
            initialMessage = device.lostMessage.orEmpty(),
            initialContact = device.contactPhone.orEmpty(),
            loading = state.busy,
            onDismiss = { lostOpen = false },
            onEnable = { message, contact ->
                lostOpen = false
                viewModel.setLostMode(true, message.ifBlank { null }, contact.ifBlank { null })
            },
        )
    }

    if (messageOpen) {
        MessageDialog(
            initialContact = device?.contactPhone.orEmpty(),
            loading = state.busy,
            onDismiss = { messageOpen = false },
            onSend = { message, contact ->
                messageOpen = false
                viewModel.sendMessage(message, contact.ifBlank { null })
            },
        )
    }

    if (deleteOpen && device != null) {
        ConfirmDialog(
            title = stringResource(R.string.delete_device),
            message = stringResource(R.string.delete_confirm),
            confirmLabel = stringResource(R.string.confirm),
            dismissLabel = stringResource(R.string.cancel),
            destructive = true,
            onConfirm = {
                deleteOpen = false
                viewModel.delete {
                    appViewModel.refresh()
                    onDeleted()
                }
            },
            onDismiss = { deleteOpen = false },
        )
    }
}

@Composable
private fun DeviceHero(device: DeviceDto) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(
                androidx.compose.ui.graphics.Brush.linearGradient(
                    listOf(
                        if (device.lostMode) AlertRed.copy(alpha = 0.85f) else ElectricBlue.copy(alpha = 0.9f),
                        if (device.lostMode) Violet.copy(alpha = 0.7f) else Violet.copy(alpha = 0.78f),
                    ),
                ),
            )
            .padding(18.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(52.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.18f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                Icons.Filled.PhoneAndroid,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(28.dp),
            )
        }
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = device.name,
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false),
                )
                if (device.lostMode) {
                    Spacer(Modifier.width(8.dp))
                    TinyTag(stringResource(R.string.lost_mode), Color.White)
                }
            }
            Text(
                text = "${device.manufacturer} ${device.model}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.White.copy(alpha = 0.85f),
            )
            Spacer(Modifier.height(6.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(if (device.online) Emerald else Color.White.copy(alpha = 0.5f)),
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = if (device.online) {
                        stringResource(R.string.online)
                    } else {
                        stringResource(R.string.offline)
                    },
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.White.copy(alpha = 0.9f),
                )
                if (!device.online) {
                    Text(
                        text = "  ·  " + stringResource(R.string.device_offline_note),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.75f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

@Composable
private fun LocationCard(device: DeviceDto, busy: Boolean, onLocate: () -> Unit) {
    val context = LocalContext.current
    val location = device.location
    SectionCard(title = stringResource(R.string.live_location)) {
        if (location != null) {
            LaqeeniMap(
                devices = listOf(device),
                focus = device,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
            )
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Filled.LocationOn,
                    contentDescription = null,
                    tint = if (device.locationStale) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        Emerald
                    },
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.width(6.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        text = if (device.locationLive) {
                            stringResource(R.string.live_location)
                        } else {
                            stringResource(R.string.stale_location)
                        },
                        style = MaterialTheme.typography.labelMedium,
                        color = if (device.locationLive) Emerald else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = stringResource(
                            R.string.device_online_ago,
                            relativeTime(context, location.capturedAt),
                        ) + (location.accuracyMeters?.let {
                            "  ·  " + stringResource(R.string.location_accuracy, it.toInt())
                        } ?: ""),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SecondaryButton(
                    text = stringResource(R.string.get_directions),
                    icon = Icons.Filled.Directions,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        val uri = Uri.parse(
                            "geo:${location.latitude},${location.longitude}" +
                                "?q=${location.latitude},${location.longitude}" +
                                "(${Uri.encode(device.name)})",
                        )
                        runCatching {
                            context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                        }.onFailure {
                            runCatching {
                                context.startActivity(
                                    Intent(
                                        Intent.ACTION_VIEW,
                                        Uri.parse(
                                            "https://www.google.com/maps/search/?api=1&query=" +
                                                "${location.latitude},${location.longitude}",
                                        ),
                                    ),
                                )
                            }
                        }
                    },
                )
                SecondaryButton(
                    text = stringResource(R.string.locate_now),
                    icon = Icons.Filled.MyLocation,
                    modifier = Modifier.weight(1f),
                    enabled = !busy,
                    onClick = onLocate,
                )
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 22.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(ElectricBlue.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Filled.LocationOff,
                        contentDescription = null,
                        tint = ElectricBlue,
                        modifier = Modifier.size(32.dp),
                    )
                }
                Spacer(Modifier.height(14.dp))
                Text(
                    text = stringResource(R.string.unknown_location),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = stringResource(R.string.refresh_needed),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(14.dp))
                PrimaryButton(
                    text = stringResource(R.string.locate_now),
                    icon = Icons.Filled.MyLocation,
                    loading = busy,
                    onClick = onLocate,
                )
            }
        }
        if (device.offline == true) {
            Spacer(Modifier.height(10.dp))
            Banner(stringResource(R.string.device_offline_note), isError = false)
        }
    }
}

private val DeviceDto.offline: Boolean? get() = !online

@Composable
private fun ActionSummary(device: DeviceDto) {
    SectionCard(title = stringResource(R.string.ultra_find)) {
        Text(
            text = stringResource(R.string.ultra_find_hint),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            SummaryChip(
                icon = Icons.Filled.NotificationsActive,
                label = stringResource(R.string.sound),
                color = ElectricBlue,
            )
            SummaryChip(
                icon = Icons.Filled.FlashOn,
                label = stringResource(R.string.flash),
                color = Violet,
            )
            SummaryChip(
                icon = Icons.Filled.BatteryChargingFull,
                label = batteryLabel(device.batteryLevel, device.charging),
                color = Emerald,
            )
            SummaryChip(
                icon = Icons.Filled.Wifi,
                label = networkLabel(device.networkType),
                color = if (device.online) Emerald else MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(10.dp))
        Text(
            text = stringResource(R.string.alarm_permission_note),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun SummaryChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    color: Color,
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(color.copy(alpha = 0.11f))
            .padding(horizontal = 9.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(14.dp))
        Spacer(Modifier.width(5.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            maxLines = 1,
        )
    }
}

@Composable
private fun LostModeCard(
    device: DeviceDto,
    busy: Boolean,
    onEnable: () -> Unit,
    onDisable: () -> Unit,
) {
    SectionCard(title = stringResource(R.string.lost_mode)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(AlertRed.copy(alpha = 0.14f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Filled.ReportProblem,
                    contentDescription = null,
                    tint = AlertRed,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = if (device.lostMode) {
                        stringResource(R.string.lost_mode)
                    } else {
                        stringResource(R.string.activate_lost_mode)
                    },
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = stringResource(R.string.lost_screen_message),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Switch(
                checked = device.lostMode,
                enabled = !busy,
                onCheckedChange = { enabled ->
                    if (enabled) onEnable() else onDisable()
                },
            )
        }
        if (device.lostMode) {
            Spacer(Modifier.height(12.dp))
            if (!device.lostMessage.isNullOrBlank()) {
                InfoRow(
                    label = stringResource(R.string.recovery_message),
                    value = device.lostMessage.orEmpty(),
                )
            }
            if (!device.contactPhone.isNullOrBlank()) {
                InfoRow(
                    label = stringResource(R.string.owner_contact),
                    value = device.contactPhone.orEmpty(),
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.alarm_permission_note),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun HistoryCard(
    enabled: Boolean,
    days: Int,
    points: Int,
    busy: Boolean,
    onToggle: (Boolean) -> Unit,
    onDaysSelected: (Int) -> Unit,
) {
    SectionCard(title = stringResource(R.string.location_history)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Filled.History,
                contentDescription = null,
                tint = Violet,
                modifier = Modifier.size(22.dp),
            )
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = if (enabled) {
                        stringResource(R.string.history_enabled)
                    } else {
                        stringResource(R.string.history_disabled)
                    },
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = stringResource(R.string.history_points, points),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Switch(checked = enabled, enabled = !busy, onCheckedChange = onToggle)
        }
        Spacer(Modifier.height(10.dp))
        Text(
            text = stringResource(R.string.history_consent_hint),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        if (enabled) {
            Spacer(Modifier.height(12.dp))
            Text(
                text = stringResource(R.string.history_retention, days),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                listOf(7, 14, 30, 90).forEach { option ->
                    val active = option == days
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                if (active) {
                                    ElectricBlue
                                } else {
                                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                                },
                            )
                            .clickable(enabled = !busy) { onDaysSelected(option) }
                            .padding(horizontal = 12.dp, vertical = 7.dp),
                    ) {
                        Text(
                            text = stringResource(R.string.retention_days, option),
                            style = MaterialTheme.typography.labelMedium,
                            color = if (active) {
                                Color.White
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RenameDialog(
    initial: String,
    loading: Boolean,
    onDismiss: () -> Unit,
    onSave: (String) -> Unit,
) {
    var name by remember { mutableStateOf(initial) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.rename)) },
        text = {
            LaqeeniField(
                value = name,
                onValueChange = { name = it.take(60) },
                label = stringResource(R.string.device_name),
                leadingIcon = Icons.Filled.PhoneAndroid,
            )
        },
        confirmButton = {
            TextButton(
                onClick = { onSave(name.trim()) },
                enabled = name.isNotBlank() && !loading,
            ) {
                Text(stringResource(R.string.save), color = ElectricBlue)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) }
        },
        containerColor = MaterialTheme.colorScheme.surface,
    )
}

@Composable
private fun LostModeDialog(
    initialMessage: String,
    initialContact: String,
    loading: Boolean,
    onDismiss: () -> Unit,
    onEnable: (String, String) -> Unit,
) {
    var message by remember {
        mutableStateOf(
            initialMessage.ifBlank {
                "This phone is lost. Please contact its owner so they can recover it."
            },
        )
    }
    var contact by remember { mutableStateOf(initialContact) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.activate_lost_mode)) },
        text = {
            Column {
                Text(
                    text = stringResource(R.string.lost_screen_message),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(12.dp))
                LaqeeniField(
                    value = message,
                    onValueChange = { message = it.take(240) },
                    label = stringResource(R.string.recovery_message),
                    singleLine = false,
                    maxLines = 4,
                )
                Spacer(Modifier.height(10.dp))
                LaqeeniField(
                    value = contact,
                    onValueChange = { contact = it.take(40) },
                    label = stringResource(R.string.contact_phone),
                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Phone,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = stringResource(R.string.alarm_permission_note),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onEnable(message.trim(), contact.trim()) },
                enabled = message.isNotBlank() && !loading,
            ) {
                Text(stringResource(R.string.activate_lost_mode), color = AlertRed)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) }
        },
        containerColor = MaterialTheme.colorScheme.surface,
    )
}

@Composable
private fun MessageDialog(
    initialContact: String,
    loading: Boolean,
    onDismiss: () -> Unit,
    onSend: (String, String) -> Unit,
) {
    var message by remember { mutableStateOf("") }
    var contact by remember { mutableStateOf(initialContact) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.send_message)) },
        text = {
            Column {
                LaqeeniField(
                    value = message,
                    onValueChange = { message = it.take(240) },
                    label = stringResource(R.string.recovery_message),
                    singleLine = false,
                    maxLines = 4,
                )
                Spacer(Modifier.height(10.dp))
                LaqeeniField(
                    value = contact,
                    onValueChange = { contact = it.take(40) },
                    label = stringResource(R.string.contact_phone),
                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Phone,
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onSend(message.trim(), contact.trim()) },
                enabled = message.isNotBlank() && !loading,
            ) {
                Text(stringResource(R.string.send_message), color = ElectricBlue)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) }
        },
        containerColor = MaterialTheme.colorScheme.surface,
    )
}
