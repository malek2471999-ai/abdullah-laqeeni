package com.abdullah.laqeeni.ui.screens

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DevicesOther
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.commands.GuardianService
import com.abdullah.laqeeni.core.commands.WorkScheduler
import com.abdullah.laqeeni.core.network.DeviceDto
import com.abdullah.laqeeni.ui.components.Banner
import com.abdullah.laqeeni.ui.components.LaqeeniLogo
import com.abdullah.laqeeni.ui.components.LoadingBox
import com.abdullah.laqeeni.ui.components.PrimaryButton
import com.abdullah.laqeeni.ui.components.StatusPill
import com.abdullah.laqeeni.ui.components.TinyTag
import com.abdullah.laqeeni.ui.theme.AlertRed
import com.abdullah.laqeeni.ui.theme.ElectricBlue
import com.abdullah.laqeeni.ui.theme.Emerald
import com.abdullah.laqeeni.ui.theme.Violet
import com.abdullah.laqeeni.ui.util.batteryLabel
import com.abdullah.laqeeni.ui.util.networkLabel
import com.abdullah.laqeeni.ui.util.relativeTime
import com.abdullah.laqeeni.ui.viewmodel.AppViewModel
import com.abdullah.laqeeni.ui.viewmodel.DevicesViewModel
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(
    appViewModel: AppViewModel,
    onOpenDevice: (String) -> Unit,
    onAddDevice: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenSecurity: () -> Unit,
) {
    val viewModel: DevicesViewModel = hiltViewModel()
    val state = viewModel.state
    val context = LocalContext.current
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val notificationPermission = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { }

    LaunchedEffect(state.message, state.error) {
        val text = state.message ?: state.error ?: return@LaunchedEffect
        snackbar.showSnackbar(text)
        viewModel.clearMessages()
    }

    LaunchedEffect(appViewModel.deviceId, appViewModel.guardianEnabled) {
        if (!appViewModel.deviceId.isNullOrBlank() && appViewModel.guardianEnabled) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
            GuardianService.start(context)
            WorkScheduler.schedule(context)
            WorkScheduler.runNow(context)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        containerColor = Color.Transparent,
    ) { padding ->
        Box(Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
            ) {
                DashboardHeader(
                    appViewModel = appViewModel,
                    onOpenSettings = onOpenSettings,
                    onOpenSecurity = onOpenSecurity,
                )
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(
                        start = 16.dp,
                        end = 16.dp,
                        bottom = 26.dp,
                    ),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    item {
                        ThisPhoneCard(
                            appViewModel = appViewModel,
                            onAddDevice = onAddDevice,
                        )
                    }
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = stringResource(R.string.my_devices),
                                style = MaterialTheme.typography.titleLarge,
                                color = MaterialTheme.colorScheme.onBackground,
                                modifier = Modifier.weight(1f),
                            )
                            if (state.devices.isNotEmpty()) {
                                Text(
                                    text = stringResource(R.string.devices_count, state.devices.size),
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                                Spacer(Modifier.width(6.dp))
                            }
                            IconButton(onClick = { viewModel.load() }) {
                                Icon(
                                    Icons.Filled.Refresh,
                                    contentDescription = stringResource(R.string.refresh),
                                    tint = ElectricBlue,
                                )
                            }
                        }
                    }
                    if (state.fromCache) {
                        item {
                            Banner(
                                stringResource(R.string.network_error),
                                isError = false,
                            )
                        }
                    }
                    if (state.error != null) {
                        item { Banner(state.error) }
                    }
                    if (state.loading && state.devices.isEmpty()) {
                        item { LoadingBox() }
                    } else if (state.devices.isEmpty()) {
                        item {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(86.dp)
                                        .clip(CircleShape)
                                        .background(ElectricBlue.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Icon(
                                        Icons.Filled.DevicesOther,
                                        contentDescription = null,
                                        tint = ElectricBlue,
                                        modifier = Modifier.size(40.dp),
                                    )
                                }
                                Spacer(Modifier.height(16.dp))
                                Text(
                                    text = stringResource(R.string.no_devices),
                                    style = MaterialTheme.typography.titleLarge,
                                    color = MaterialTheme.colorScheme.onBackground,
                                )
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    text = stringResource(R.string.add_first_device),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                                Spacer(Modifier.height(18.dp))
                                PrimaryButton(
                                    text = stringResource(R.string.add_device),
                                    icon = Icons.Filled.Add,
                                    onClick = onAddDevice,
                                    modifier = Modifier.padding(horizontal = 20.dp),
                                )
                            }
                        }
                    } else {
                        items(state.devices, key = { it.id }) { device ->
                            DeviceCard(
                                device = device,
                                busy = state.busyId == device.id,
                                onClick = { onOpenDevice(device.id) },
                                onLocate = { viewModel.locate(device) },
                                onRing = { viewModel.ring(device) },
                            )
                        }
                    }
                    item {
                        Spacer(Modifier.height(6.dp))
                        PrimaryButton(
                            text = stringResource(R.string.add_device),
                            icon = Icons.Filled.Add,
                            onClick = onAddDevice,
                        )
                    }
                    item {
                        Text(
                            text = stringResource(R.string.security_note),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DashboardHeader(
    appViewModel: AppViewModel,
    onOpenSettings: () -> Unit,
    onOpenSecurity: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        LaqeeniLogo(size = 48.dp, animated = false)
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = stringResource(R.string.app_name),
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                text = appViewModel.user?.name?.let {
                    stringResource(R.string.signed_in_as, it)
                } ?: stringResource(R.string.slogan),
                style = MaterialTheme.typography.bodySmall,
                color = Emerald,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        IconButton(onClick = onOpenSecurity) {
            Icon(
                Icons.Filled.Shield,
                contentDescription = stringResource(R.string.account_security),
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        IconButton(onClick = onOpenSettings) {
            Icon(
                Icons.Filled.Settings,
                contentDescription = stringResource(R.string.settings),
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun ThisPhoneCard(appViewModel: AppViewModel, onAddDevice: () -> Unit) {
    val linked = !appViewModel.deviceId.isNullOrBlank()
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = Color.Transparent,
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        listOf(ElectricBlue.copy(alpha = 0.85f), Violet.copy(alpha = 0.75f)),
                    ),
                )
                .padding(18.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.18f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Filled.Shield,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(26.dp),
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        text = if (linked) {
                            stringResource(R.string.this_phone_protected)
                        } else {
                            stringResource(R.string.this_phone_not_paired)
                        },
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = if (linked) {
                            appViewModel.deviceName ?: appViewModel.deviceId.orEmpty()
                        } else {
                            stringResource(R.string.welcome_subtitle)
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.82f),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                if (!linked) {
                    IconButton(onClick = onAddDevice) {
                        Icon(Icons.Filled.Add, contentDescription = null, tint = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
private fun DeviceCard(
    device: DeviceDto,
    busy: Boolean,
    onClick: () -> Unit,
    onLocate: () -> Unit,
    onRing: () -> Unit,
) {
    val context = LocalContext.current
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            when {
                device.lostMode -> AlertRed.copy(alpha = 0.6f)
                device.online -> Emerald.copy(alpha = 0.4f)
                else -> MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.7f)
            },
        ),
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            if (device.lostMode) AlertRed.copy(alpha = 0.14f)
                            else ElectricBlue.copy(alpha = 0.12f),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Filled.DevicesOther,
                        contentDescription = null,
                        tint = if (device.lostMode) AlertRed else ElectricBlue,
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = device.name,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f, fill = false),
                        )
                        if (device.lostMode) {
                            Spacer(Modifier.width(8.dp))
                            TinyTag(stringResource(R.string.lost_mode), AlertRed)
                        }
                    }
                    Text(
                        text = "${device.manufacturer} ${device.model}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                StatusPill(
                    online = device.online,
                    onlineText = stringResource(R.string.online),
                    offlineText = stringResource(R.string.offline),
                )
            }
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                DeviceStat(
                    icon = Icons.Filled.BatteryChargingFull,
                    label = batteryLabel(device.batteryLevel, device.charging),
                )
                DeviceStat(
                    icon = Icons.Filled.Wifi,
                    label = networkLabel(device.networkType),
                )
                DeviceStat(
                    icon = Icons.Filled.LocationOn,
                    label = if (device.location != null) {
                        stringResource(R.string.device_online_ago, relativeTime(context, device.lastSyncAt ?: device.lastSeenAt))
                    } else {
                        stringResource(R.string.unknown_location)
                    },
                )
            }
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                QuickPill(
                    icon = Icons.Filled.MyLocation,
                    text = stringResource(R.string.locate_now),
                    onClick = onLocate,
                    enabled = !busy,
                )
                QuickPill(
                    icon = Icons.Filled.VolumeUp,
                    text = stringResource(R.string.ring_now),
                    onClick = onRing,
                    enabled = !busy,
                    color = AlertRed,
                )
                Spacer(Modifier.weight(1f))
                Icon(
                    Icons.Filled.ChevronRight,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .align(Alignment.CenterVertically)
                        .size(20.dp),
                )
            }
        }
    }
}

@Composable
private fun DeviceStat(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(15.dp),
        )
        Spacer(Modifier.width(5.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun QuickPill(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String,
    onClick: () -> Unit,
    enabled: Boolean,
    color: Color = ElectricBlue,
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.10f))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(6.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = color,
            maxLines = 1,
        )
    }
}
