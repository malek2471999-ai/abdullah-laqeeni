package com.abdullah.laqeeni.ui.screens

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DevicesOther
import androidx.compose.material.icons.filled.LocationOff
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.network.DeviceDto
import com.abdullah.laqeeni.ui.components.Banner
import com.abdullah.laqeeni.ui.components.EmptyState
import com.abdullah.laqeeni.ui.components.LaqeeniMap
import com.abdullah.laqeeni.ui.theme.AlertRed
import com.abdullah.laqeeni.ui.theme.ElectricBlue
import com.abdullah.laqeeni.ui.theme.Emerald
import com.abdullah.laqeeni.ui.util.relativeTime
import com.abdullah.laqeeni.ui.viewmodel.AppViewModel
import com.abdullah.laqeeni.ui.viewmodel.DevicesViewModel

@Composable
fun MapScreen(
    appViewModel: AppViewModel,
    onOpenDevice: (String) -> Unit,
    onAddDevice: () -> Unit,
) {
    val viewModel: DevicesViewModel = hiltViewModel()
    val state = viewModel.state
    val context = LocalContext.current
    var selectedId by rememberSaveable { mutableStateOf<String?>(null) }

    val withLocation = state.devices.filter { it.location != null }
    val selected = state.devices.firstOrNull { it.id == selectedId }
        ?: withLocation.firstOrNull()
        ?: state.devices.firstOrNull()

    LaunchedEffect(state.devices) {
        if (selectedId == null) {
            selectedId = withLocation.firstOrNull()?.id ?: state.devices.firstOrNull()?.id
        }
    }

    Box(Modifier.fillMaxSize()) {
        if (withLocation.isNotEmpty()) {
            LaqeeniMap(
                devices = withLocation,
                focus = selected,
                modifier = Modifier.fillMaxSize(),
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background),
            ) {
                EmptyState(
                    icon = Icons.Filled.LocationOff,
                    title = stringResource(R.string.unknown_location),
                    subtitle = stringResource(R.string.map_no_devices),
                    actionLabel = if (state.devices.isEmpty()) {
                        stringResource(R.string.add_device)
                    } else {
                        stringResource(R.string.refresh)
                    },
                    onAction = {
                        if (state.devices.isEmpty()) onAddDevice() else viewModel.load()
                    },
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.TopCenter),
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
                shadowElevation = 6.dp,
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(
                            text = stringResource(R.string.map),
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Text(
                            text = if (withLocation.isEmpty()) {
                                stringResource(R.string.map_no_devices)
                            } else {
                                stringResource(R.string.devices_count, withLocation.size)
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
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
            if (state.error != null) {
                Banner(
                    state.error,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                )
            }
            if (state.fromCache) {
                Banner(
                    stringResource(R.string.network_error),
                    isError = false,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                )
            }
        }

        if (selected != null && withLocation.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                SelectedDeviceCard(
                    device = selected,
                    onOpen = { onOpenDevice(selected.id) },
                    onLocate = { viewModel.locate(selected) },
                    onRing = { viewModel.ring(selected) },
                )
                if (state.devices.size > 1) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        state.devices.forEach { device ->
                            DevicePill(
                                device = device,
                                active = device.id == selected.id,
                                onClick = { selectedId = device.id },
                            )
                        }
                    }
                }
            }
        } else if (state.devices.isNotEmpty() && withLocation.isEmpty()) {
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(12.dp),
            ) {
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text(
                            text = stringResource(R.string.map_no_devices),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(10.dp))
                        state.devices.forEach { device ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable { onOpenDevice(device.id) }
                                    .padding(vertical = 8.dp, horizontal = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    Icons.Filled.DevicesOther,
                                    contentDescription = null,
                                    tint = ElectricBlue,
                                    modifier = Modifier.size(18.dp),
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    text = device.name,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.weight(1f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                                Text(
                                    text = stringResource(R.string.locate_now),
                                    style = MaterialTheme.typography.labelMedium,
                                    color = ElectricBlue,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SelectedDeviceCard(
    device: DeviceDto,
    onOpen: () -> Unit,
    onLocate: () -> Unit,
    onRing: () -> Unit,
) {
    val context = LocalContext.current
    val location = device.location
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpen),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
        shadowElevation = 8.dp,
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(
                            if (device.lostMode) {
                                AlertRed.copy(alpha = 0.14f)
                            } else {
                                ElectricBlue.copy(alpha = 0.14f)
                            },
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Filled.LocationOn,
                        contentDescription = null,
                        tint = if (device.lostMode) AlertRed else ElectricBlue,
                    )
                }
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        text = device.name,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    val lastSeen = location?.capturedAt
                    Text(
                        text = if (lastSeen != null) {
                            stringResource(R.string.device_online_ago, relativeTime(context, lastSeen))
                        } else {
                            stringResource(R.string.unknown_location)
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = if (device.online) Emerald else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Icon(
                    Icons.Filled.ChevronRight,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MapAction(
                    icon = Icons.Filled.MyLocation,
                    label = stringResource(R.string.locate_now),
                    color = ElectricBlue,
                    onClick = onLocate,
                )
                MapAction(
                    icon = Icons.Filled.VolumeUp,
                    label = stringResource(R.string.ring_now),
                    color = AlertRed,
                    onClick = onRing,
                )
                Spacer(Modifier.weight(1f))
                Text(
                    text = stringResource(R.string.view_details),
                    style = MaterialTheme.typography.labelMedium,
                    color = ElectricBlue,
                    modifier = Modifier
                        .align(Alignment.CenterVertically)
                        .clickable(onClick = onOpen),
                )
            }
        }
    }
}

@Composable
private fun MapAction(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    color: Color,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(11.dp))
            .background(color.copy(alpha = 0.11f))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(5.dp))
        Text(label, style = MaterialTheme.typography.labelMedium, color = color)
    }
}

@Composable
private fun DevicePill(device: DeviceDto, active: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(
                if (active) ElectricBlue else MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 13.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier
                .size(7.dp)
                .clip(CircleShape)
                .background(
                    when {
                        device.lostMode -> AlertRed
                        device.online -> Emerald
                        else -> MaterialTheme.colorScheme.onSurfaceVariant
                    },
                ),
        )
        Spacer(Modifier.width(7.dp))
        Text(
            text = device.name,
            style = MaterialTheme.typography.labelMedium,
            color = if (active) Color.White else MaterialTheme.colorScheme.onSurface,
            maxLines = 1,
        )
    }
}
