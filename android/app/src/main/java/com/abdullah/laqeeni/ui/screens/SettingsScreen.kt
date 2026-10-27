package com.abdullah.laqeeni.ui.screens

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.abdullah.laqeeni.BuildConfig
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.commands.GuardianService
import com.abdullah.laqeeni.core.commands.WorkScheduler
import com.abdullah.laqeeni.ui.components.ConfirmDialog
import com.abdullah.laqeeni.ui.components.GradientScreen
import com.abdullah.laqeeni.ui.components.InfoRow
import com.abdullah.laqeeni.ui.components.LaqeeniField
import com.abdullah.laqeeni.ui.components.LaqeeniTopBar
import com.abdullah.laqeeni.ui.components.SectionCard
import com.abdullah.laqeeni.ui.theme.AlertRed
import com.abdullah.laqeeni.ui.theme.Amber
import com.abdullah.laqeeni.ui.theme.ElectricBlue
import com.abdullah.laqeeni.ui.theme.Emerald
import com.abdullah.laqeeni.ui.theme.Violet
import com.abdullah.laqeeni.ui.viewmodel.AppViewModel
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    appViewModel: AppViewModel,
    onOpenSecurity: () -> Unit,
    onOpenPair: () -> Unit,
    onSignedOut: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbar = remember { SnackbarHostState() }
    var permissionTick by remember { mutableIntStateOf(0) }
    var serverDraft by remember { mutableStateOf(appViewModel.serverUrl) }
    var serverError by remember { mutableStateOf<String?>(null) }
    var logoutOpen by remember { mutableStateOf(false) }
    var signingOut by remember { mutableStateOf(false) }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) permissionTick++
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // Re-read permission state whenever the activity resumes or a request returns.
    val fineLocation = remember(permissionTick) {
        context.hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)
    }
    val notifications = remember(permissionTick) {
        Build.VERSION.SDK_INT < 33 ||
            context.hasPermission(Manifest.permission.POST_NOTIFICATIONS)
    }
    val camera = remember(permissionTick) {
        context.hasPermission(Manifest.permission.CAMERA)
    }
    val backgroundLocation = remember(permissionTick) {
        Build.VERSION.SDK_INT < 29 ||
            context.hasPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) {
        permissionTick++
    }

    LaunchedEffect(appViewModel.serverUrl) {
        serverDraft = appViewModel.serverUrl
    }

    fun flash(text: String) {
        scope.launch { snackbar.showSnackbar(text) }
    }

    fun openAppSettings() {
        context.startActivity(
            Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:${context.packageName}"),
            ),
        )
    }

    fun setProtection(enabled: Boolean) {
        if (enabled && !fineLocation) {
            flash(context.getString(R.string.location_permission_rationale))
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                ),
            )
            return
        }
        appViewModel.setGuardian(enabled)
        if (enabled) {
            GuardianService.start(context)
            WorkScheduler.schedule(context)
            WorkScheduler.runNow(context)
        } else {
            GuardianService.stop(context)
            WorkScheduler.cancel(context)
        }
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
                LaqeeniTopBar(title = stringResource(R.string.settings))
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp)
                        .padding(bottom = 30.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    AccountCard(
                        appViewModel = appViewModel,
                        onOpenSecurity = onOpenSecurity,
                    )

                    if (!appViewModel.deviceId.isNullOrBlank()) {
                        ProtectionCard(
                            enabled = appViewModel.guardianEnabled,
                            onChange = ::setProtection,
                        )
                    } else {
                        SectionCard(title = stringResource(R.string.protection_service)) {
                            Text(
                                text = stringResource(R.string.this_phone_not_paired),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Spacer(Modifier.height(10.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(ElectricBlue.copy(alpha = 0.10f))
                                    .clickable(onClick = onOpenPair)
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    Icons.Filled.PhoneAndroid,
                                    contentDescription = null,
                                    tint = ElectricBlue,
                                )
                                Spacer(Modifier.width(10.dp))
                                Text(
                                    text = stringResource(R.string.pair_device),
                                    style = MaterialTheme.typography.labelLarge,
                                    color = ElectricBlue,
                                    modifier = Modifier.weight(1f),
                                )
                                Icon(
                                    Icons.Filled.ChevronRight,
                                    contentDescription = null,
                                    tint = ElectricBlue,
                                )
                            }
                        }
                    }

                    AlarmCard(
                        duration = appViewModel.alarmDuration,
                        sound = appViewModel.alarmSound,
                        vibration = appViewModel.alarmVibration,
                        flash = appViewModel.alarmFlash,
                        onDuration = appViewModel::updateAlarmDuration,
                        onSound = appViewModel::updateAlarmSound,
                        onVibration = appViewModel::updateAlarmVibration,
                        onFlash = appViewModel::updateAlarmFlash,
                    )

                    LanguageCard(
                        language = appViewModel.language,
                        onSelect = appViewModel::updateLanguage,
                    )

                    ThemeCard(
                        theme = appViewModel.themeMode,
                        onSelect = appViewModel::setTheme,
                    )

                    PermissionsCard(
                        fine = fineLocation,
                        notifications = notifications,
                        camera = camera,
                        background = backgroundLocation,
                        onRequestLocation = {
                            permissionLauncher.launch(
                                arrayOf(
                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                    Manifest.permission.ACCESS_COARSE_LOCATION,
                                ),
                            )
                        },
                        onRequestNotifications = {
                            if (Build.VERSION.SDK_INT >= 33) {
                                permissionLauncher.launch(
                                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                                )
                            } else {
                                context.startActivity(
                                    Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                                    },
                                )
                            }
                        },
                        onRequestCamera = {
                            permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA))
                        },
                        onRequestBackground = ::openAppSettings,
                        onOpenAppSettings = ::openAppSettings,
                    )

                    ServerCard(
                        draft = serverDraft,
                        error = serverError,
                        onDraft = {
                            serverDraft = it
                            serverError = null
                        },
                        onSave = {
                            if (appViewModel.saveServer(serverDraft)) {
                                serverError = null
                                flash(context.getString(R.string.server_saved))
                            } else {
                                serverError = context.getString(R.string.invalid_server)
                            }
                        },
                    )

                    SectionCard(title = stringResource(R.string.about)) {
                        InfoRow(
                            label = stringResource(R.string.app_version),
                            value = BuildConfig.VERSION_NAME,
                        )
                        InfoRow(
                            label = stringResource(R.string.server_url),
                            value = appViewModel.serverUrl,
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = stringResource(R.string.security_note),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = stringResource(R.string.device_offline_note),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        if (BuildConfig.ALLOW_INSECURE_SERVER) {
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = stringResource(R.string.protocol_http_warning),
                                style = MaterialTheme.typography.bodySmall,
                                color = Amber,
                            )
                        }
                    }

                    SectionCard(title = stringResource(R.string.danger_zone)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(AlertRed.copy(alpha = 0.10f))
                                .clickable { logoutOpen = true }
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            if (signingOut) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    strokeWidth = 2.dp,
                                    color = AlertRed,
                                )
                            } else {
                                Icon(Icons.Filled.Logout, contentDescription = null, tint = AlertRed)
                            }
                            Spacer(Modifier.width(10.dp))
                            Text(
                                text = stringResource(R.string.logout),
                                style = MaterialTheme.typography.labelLarge,
                                color = AlertRed,
                            )
                        }
                    }
                }
            }
        }
    }

    if (logoutOpen) {
        ConfirmDialog(
            title = stringResource(R.string.logout),
            message = stringResource(R.string.logout_confirm),
            confirmLabel = stringResource(R.string.logout),
            dismissLabel = stringResource(R.string.cancel),
            destructive = true,
            onConfirm = {
                logoutOpen = false
                signingOut = true
                scope.launch {
                    appViewModel.auth.logout()
                    GuardianService.stop(context)
                    WorkScheduler.cancel(context)
                    appViewModel.refresh()
                    signingOut = false
                    onSignedOut()
                }
            },
            onDismiss = { logoutOpen = false },
        )
    }
}

@Composable
private fun AccountCard(appViewModel: AppViewModel, onOpenSecurity: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(
                androidx.compose.ui.graphics.Brush.linearGradient(
                    listOf(ElectricBlue.copy(alpha = 0.9f), Violet.copy(alpha = 0.8f)),
                ),
            )
            .clickable(onClick = onOpenSecurity)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.18f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = appViewModel.user?.name?.trim()?.take(1)?.uppercase() ?: "?",
                style = MaterialTheme.typography.titleLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = appViewModel.user?.name ?: stringResource(R.string.app_name),
                style = MaterialTheme.typography.titleMedium,
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = appViewModel.user?.email.orEmpty(),
                style = MaterialTheme.typography.bodySmall,
                color = Color.White.copy(alpha = 0.85f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Icon(
            Icons.Filled.Shield,
            contentDescription = stringResource(R.string.account_security),
            tint = Color.White,
        )
    }
}

@Composable
private fun ProtectionCard(enabled: Boolean, onChange: (Boolean) -> Unit) {
    SectionCard(title = stringResource(R.string.protection_service)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(
                        if (enabled) Emerald.copy(alpha = 0.14f) else ElectricBlue.copy(alpha = 0.12f),
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Filled.Shield,
                    contentDescription = null,
                    tint = if (enabled) Emerald else ElectricBlue,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = if (enabled) {
                        stringResource(R.string.protection_active)
                    } else {
                        stringResource(R.string.protection_inactive)
                    },
                    style = MaterialTheme.typography.titleMedium,
                    color = if (enabled) Emerald else MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = stringResource(R.string.protection_service_hint),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Switch(checked = enabled, onCheckedChange = onChange)
        }
    }
}

@Composable
private fun AlarmCard(
    duration: Int,
    sound: String,
    vibration: Boolean,
    flash: Boolean,
    onDuration: (Int) -> Unit,
    onSound: (String) -> Unit,
    onVibration: (Boolean) -> Unit,
    onFlash: (Boolean) -> Unit,
) {
    SectionCard(title = stringResource(R.string.alarm_settings)) {
        Text(
            text = stringResource(R.string.alarm_duration),
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(
                60 to R.string.one_minute,
                180 to R.string.three_minutes,
                300 to R.string.five_minutes,
            ).forEach { (seconds, label) ->
                ChoiceChip(
                    text = stringResource(label),
                    selected = duration == seconds,
                    onClick = { onDuration(seconds) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
        Spacer(Modifier.height(16.dp))
        Text(
            text = stringResource(R.string.sound),
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(
                "siren" to R.string.siren,
                "alarm" to R.string.system_alarm,
                "ringtone" to R.string.ringtone,
            ).forEach { (value, label) ->
                ChoiceChip(
                    text = stringResource(label),
                    selected = sound == value,
                    onClick = { onSound(value) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        ToggleRow(
            icon = Icons.Filled.VolumeUp,
            title = stringResource(R.string.vibration),
            color = ElectricBlue,
            checked = vibration,
            onChange = onVibration,
        )
        ToggleRow(
            icon = Icons.Filled.FlashOn,
            title = stringResource(R.string.flash),
            color = Violet,
            checked = flash,
            onChange = onFlash,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.alarm_permission_note),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun LanguageCard(language: String, onSelect: (String) -> Unit) {
    SectionCard(title = stringResource(R.string.language)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(
                "ar" to "العربية",
                "en" to "English",
                "fr" to "Français",
            ).forEach { (tag, label) ->
                ChoiceChip(
                    text = label,
                    selected = language == tag,
                    onClick = { onSelect(tag) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.app_language_hint),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun ThemeCard(theme: String, onSelect: (String) -> Unit) {
    SectionCard(title = stringResource(R.string.theme)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(
                Triple("system", R.string.system_default, Icons.Filled.Settings),
                Triple("light", R.string.light_mode, Icons.Filled.LightMode),
                Triple("dark", R.string.dark_mode, Icons.Filled.DarkMode),
            ).forEach { (value, label, icon) ->
                ChoiceChip(
                    text = stringResource(label),
                    selected = theme == value,
                    onClick = { onSelect(value) },
                    icon = icon,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun PermissionsCard(
    fine: Boolean,
    notifications: Boolean,
    camera: Boolean,
    background: Boolean,
    onRequestLocation: () -> Unit,
    onRequestNotifications: () -> Unit,
    onRequestCamera: () -> Unit,
    onRequestBackground: () -> Unit,
    onOpenAppSettings: () -> Unit,
) {
    SectionCard(title = stringResource(R.string.permissions)) {
        PermissionRow(
            icon = Icons.Filled.LocationOn,
            title = stringResource(R.string.permission_location),
            granted = fine,
            onRequest = onRequestLocation,
        )
        PermissionRow(
            icon = Icons.Filled.Notifications,
            title = stringResource(R.string.permission_notifications),
            granted = notifications,
            onRequest = onRequestNotifications,
        )
        PermissionRow(
            icon = Icons.Filled.CameraAlt,
            title = stringResource(R.string.permission_camera),
            granted = camera,
            onRequest = onRequestCamera,
        )
        PermissionRow(
            icon = Icons.Filled.BatteryChargingFull,
            title = stringResource(R.string.permission_background),
            subtitle = stringResource(R.string.background_permission_rationale),
            granted = background,
            onRequest = onRequestBackground,
        )
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onOpenAppSettings, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.open_app_settings), color = ElectricBlue)
        }
    }
}

@Composable
private fun PermissionRow(
    icon: ImageVector,
    title: String,
    granted: Boolean,
    onRequest: () -> Unit,
    subtitle: String? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = if (granted) Emerald else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(20.dp),
        )
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (granted) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Filled.CheckCircle,
                    contentDescription = null,
                    tint = Emerald,
                    modifier = Modifier.size(16.dp),
                )
                Spacer(Modifier.width(5.dp))
                Text(
                    text = stringResource(R.string.permission_granted),
                    style = MaterialTheme.typography.labelMedium,
                    color = Emerald,
                )
            }
        } else {
            Text(
                text = stringResource(R.string.grant),
                style = MaterialTheme.typography.labelMedium,
                color = ElectricBlue,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(ElectricBlue.copy(alpha = 0.10f))
                    .clickable(onClick = onRequest)
                    .padding(horizontal = 10.dp, vertical = 6.dp),
            )
        }
    }
}

@Composable
private fun ServerCard(
    draft: String,
    error: String?,
    onDraft: (String) -> Unit,
    onSave: () -> Unit,
) {
    SectionCard(title = stringResource(R.string.server_url)) {
        LaqeeniField(
            value = draft,
            onValueChange = onDraft,
            label = stringResource(R.string.server_url),
            supportingText = error ?: stringResource(R.string.server_url_hint),
            isError = error != null,
            keyboardType = androidx.compose.ui.text.input.KeyboardType.Uri,
            leadingIcon = Icons.Filled.Info,
        )
        Spacer(Modifier.height(10.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(ElectricBlue.copy(alpha = 0.10f))
                .clickable(onClick = onSave)
                .padding(12.dp),
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(
                text = stringResource(R.string.save_server),
                style = MaterialTheme.typography.labelLarge,
                color = ElectricBlue,
            )
        }
    }
}

@Composable
private fun ToggleRow(
    icon: ImageVector,
    title: String,
    color: Color,
    checked: Boolean,
    onChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(10.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f),
        )
        Switch(checked = checked, onCheckedChange = onChange)
    }
}

@Composable
private fun ChoiceChip(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(
                if (selected) ElectricBlue else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
            )
            .border(
                1.dp,
                if (selected) ElectricBlue else MaterialTheme.colorScheme.outlineVariant,
                RoundedCornerShape(12.dp),
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 9.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Icon(
                icon,
                contentDescription = null,
                tint = if (selected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(15.dp),
            )
            Spacer(Modifier.width(4.dp))
        }
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = if (selected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

private fun Context.hasPermission(permission: String): Boolean =
    ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
