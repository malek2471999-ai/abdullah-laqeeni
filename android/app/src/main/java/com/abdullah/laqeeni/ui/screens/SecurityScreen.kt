package com.abdullah.laqeeni.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Devices
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.network.SecurityEventDto
import com.abdullah.laqeeni.core.network.SessionDto
import com.abdullah.laqeeni.ui.components.Banner
import com.abdullah.laqeeni.ui.components.ConfirmDialog
import com.abdullah.laqeeni.ui.components.GradientScreen
import com.abdullah.laqeeni.ui.components.LaqeeniField
import com.abdullah.laqeeni.ui.components.LaqeeniTopBar
import com.abdullah.laqeeni.ui.components.LoadingBox
import com.abdullah.laqeeni.ui.components.PrimaryButton
import com.abdullah.laqeeni.ui.components.SecondaryButton
import com.abdullah.laqeeni.ui.components.SectionCard
import com.abdullah.laqeeni.ui.theme.AlertRed
import com.abdullah.laqeeni.ui.theme.ElectricBlue
import com.abdullah.laqeeni.ui.theme.Emerald
import com.abdullah.laqeeni.ui.theme.Violet
import com.abdullah.laqeeni.ui.util.formatDateTime
import com.abdullah.laqeeni.ui.util.relativeTime
import com.abdullah.laqeeni.ui.viewmodel.AppViewModel
import com.abdullah.laqeeni.ui.viewmodel.SettingsViewModel
import com.abdullah.laqeeni.ui.viewmodel.SettingsUiState

@Composable
fun SecurityScreen(
    appViewModel: AppViewModel,
    onBack: () -> Unit,
    onSignedOut: () -> Unit,
) {
    val viewModel: SettingsViewModel = hiltViewModel()
    val state = viewModel.state
    val context = LocalContext.current
    val snackbar = remember { SnackbarHostState() }

    var enableTwoFactorOpen by remember { mutableStateOf(false) }
    var disableTwoFactorOpen by remember { mutableStateOf(false) }
    var passwordOpen by remember { mutableStateOf(false) }
    var deleteOpen by remember { mutableStateOf(false) }
    var revokeAllOpen by remember { mutableStateOf(false) }

    LaunchedEffect(state.message, state.error) {
        val text = state.message ?: state.error ?: return@LaunchedEffect
        snackbar.showSnackbar(text)
        viewModel.clearMessages()
    }

    LaunchedEffect(state.twoFactorSetup) {
        if (state.twoFactorSetup != null) enableTwoFactorOpen = true
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
                    title = stringResource(R.string.account_security),
                    onBack = onBack,
                )
                if (state.loading && state.user == null) {
                    LoadingBox()
                } else {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp)
                            .padding(bottom = 30.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        SecurityHero(state)

                        SectionCard(title = stringResource(R.string.two_factor)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(
                                            if (state.user?.twoFactorEnabled == true) {
                                                Emerald.copy(alpha = 0.14f)
                                            } else {
                                                ElectricBlue.copy(alpha = 0.12f)
                                            },
                                        ),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Icon(
                                        Icons.Filled.Security,
                                        contentDescription = null,
                                        tint = if (state.user?.twoFactorEnabled == true) {
                                            Emerald
                                        } else {
                                            ElectricBlue
                                        },
                                    )
                                }
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(
                                        text = if (state.user?.twoFactorEnabled == true) {
                                            stringResource(R.string.two_factor)
                                        } else {
                                            stringResource(R.string.setup_2fa)
                                        },
                                        style = MaterialTheme.typography.titleMedium,
                                        color = MaterialTheme.colorScheme.onSurface,
                                    )
                                    Text(
                                        text = if (state.user?.twoFactorEnabled == true) {
                                            stringResource(R.string.two_factor_enabled)
                                        } else {
                                            stringResource(R.string.two_factor_setup_hint)
                                        },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (state.user?.twoFactorEnabled == true) {
                                            Emerald
                                        } else {
                                            MaterialTheme.colorScheme.onSurfaceVariant
                                        },
                                    )
                                }
                            }
                            Spacer(Modifier.height(12.dp))
                            if (state.user?.twoFactorEnabled == true) {
                                SecondaryButton(
                                    text = stringResource(R.string.disable_2fa),
                                    icon = Icons.Filled.Warning,
                                    contentColor = AlertRed,
                                    onClick = { disableTwoFactorOpen = true },
                                )
                            } else {
                                PrimaryButton(
                                    text = stringResource(R.string.setup_2fa),
                                    icon = Icons.Filled.Lock,
                                    loading = state.busy,
                                    onClick = viewModel::setupTwoFactor,
                                )
                            }
                        }

                        SectionCard(title = stringResource(R.string.sessions)) {
                            if (state.sessions.isEmpty()) {
                                Text(
                                    text = stringResource(R.string.no_other_sessions),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            } else {
                                state.sessions.forEach { session ->
                                    SessionRow(
                                        session = session,
                                        onRevoke = { viewModel.revokeSession(session.id) },
                                    )
                                }
                            }
                            Spacer(Modifier.height(12.dp))
                            SecondaryButton(
                                text = stringResource(R.string.revoke_all),
                                icon = Icons.Filled.Logout,
                                onClick = { revokeAllOpen = true },
                            )
                        }

                        SectionCard(title = stringResource(R.string.change_password)) {
                            Text(
                                text = stringResource(R.string.password_rules_hint),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Spacer(Modifier.height(12.dp))
                            SecondaryButton(
                                text = stringResource(R.string.change_password),
                                icon = Icons.Filled.Key,
                                onClick = { passwordOpen = true },
                            )
                        }

                        SectionCard(title = stringResource(R.string.security_events)) {
                            if (state.events.isEmpty()) {
                                Text(
                                    text = stringResource(R.string.no_security_events),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            } else {
                                state.events.take(12).forEach { event ->
                                    SecurityEventRow(event)
                                }
                            }
                        }

                        SectionCard(title = stringResource(R.string.danger_zone)) {
                            Text(
                                text = stringResource(R.string.delete_account_confirm),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Spacer(Modifier.height(12.dp))
                            PrimaryButton(
                                text = stringResource(R.string.delete_account),
                                icon = Icons.Filled.Warning,
                                container = AlertRed,
                                onClick = { deleteOpen = true },
                            )
                        }
                    }
                }
            }
        }
    }

    if (enableTwoFactorOpen) {
        val setup = state.twoFactorSetup
        if (setup != null) {
            EnableTwoFactorDialog(
                setup = setup,
                loading = state.busy,
                onDismiss = {
                    enableTwoFactorOpen = false
                    viewModel.clearTwoFactorSetup()
                },
                onEnable = { code ->
                    enableTwoFactorOpen = false
                    viewModel.enableTwoFactor(code)
                },
                context = context,
            )
        }
    }

    if (disableTwoFactorOpen) {
        DisableTwoFactorDialog(
            loading = state.busy,
            onDismiss = { disableTwoFactorOpen = false },
            onDisable = { password, code ->
                disableTwoFactorOpen = false
                viewModel.disableTwoFactor(password, code)
            },
        )
    }

    if (passwordOpen) {
        ChangePasswordDialog(
            loading = state.busy,
            onDismiss = { passwordOpen = false },
            onSave = { current, next ->
                passwordOpen = false
                viewModel.changePassword(current, next) {}
            },
        )
    }

    if (revokeAllOpen) {
        ConfirmDialog(
            title = stringResource(R.string.revoke_all),
            message = stringResource(R.string.revoke_all_confirm),
            confirmLabel = stringResource(R.string.confirm),
            dismissLabel = stringResource(R.string.cancel),
            destructive = true,
            onConfirm = {
                revokeAllOpen = false
                viewModel.logoutAll()
            },
            onDismiss = { revokeAllOpen = false },
        )
    }

    if (deleteOpen) {
        DeleteAccountDialog(
            loading = state.busy,
            onDismiss = { deleteOpen = false },
            onDelete = { password ->
                deleteOpen = false
                viewModel.deleteAccount(password) {
                    appViewModel.refresh()
                    onSignedOut()
                }
            },
        )
    }
}

@Composable
private fun SecurityHero(state: SettingsUiState) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(
                androidx.compose.ui.graphics.Brush.linearGradient(
                    listOf(Emerald.copy(alpha = 0.85f), ElectricBlue.copy(alpha = 0.8f)),
                ),
            )
            .padding(18.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.18f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Filled.Shield, contentDescription = null, tint = Color.White)
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = state.user?.name ?: stringResource(R.string.account_security),
                style = MaterialTheme.typography.titleMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = state.user?.email.orEmpty(),
                style = MaterialTheme.typography.bodySmall,
                color = Color.White.copy(alpha = 0.85f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            if (state.user?.twoFactorEnabled == true) {
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Filled.CheckCircle,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(14.dp),
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = stringResource(R.string.two_factor),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White,
                    )
                }
            }
        }
    }
}

@Composable
private fun SessionRow(session: SessionDto, onRevoke: () -> Unit) {
    val context = LocalContext.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            if (session.current) Icons.Filled.PhoneAndroid else Icons.Filled.Devices,
            contentDescription = null,
            tint = if (session.current) Emerald else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(20.dp),
        )
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = session.userAgent?.take(42)
                    ?: stringResource(R.string.current_session),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = (if (session.current) {
                    stringResource(R.string.current_session) + " · "
                } else {
                    ""
                }) + relativeTime(context, session.lastUsedAt) +
                    (session.ip?.let { " · $it" } ?: ""),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        if (session.current) {
            Text(
                text = stringResource(R.string.current_session),
                style = MaterialTheme.typography.labelSmall,
                color = Emerald,
            )
        } else {
            Text(
                text = stringResource(R.string.revoke),
                style = MaterialTheme.typography.labelMedium,
                color = AlertRed,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(AlertRed.copy(alpha = 0.10f))
                    .clickable(onClick = onRevoke)
                    .padding(horizontal = 9.dp, vertical = 5.dp),
            )
        }
    }
}

@Composable
private fun SecurityEventRow(event: SecurityEventDto) {
    val dangerous = event.type.contains("FAILED") || event.type.contains("LOCKED")
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            Icons.Filled.History,
            contentDescription = null,
            tint = if (dangerous) AlertRed else Violet,
            modifier = Modifier.size(18.dp),
        )
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = event.type.replace('_', ' ').lowercase()
                    .replaceFirstChar { it.uppercase() },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                text = formatDateTime(event.createdAt) +
                    (event.ip?.let { " · $it" } ?: ""),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (dangerous) {
            Text(
                text = stringResource(R.string.security_event_alert),
                style = MaterialTheme.typography.labelSmall,
                color = AlertRed,
            )
        }
    }
}

@Composable
private fun EnableTwoFactorDialog(
    setup: com.abdullah.laqeeni.core.network.TwoFactorSetupDto,
    loading: Boolean,
    onDismiss: () -> Unit,
    onEnable: (String) -> Unit,
    context: Context,
) {
    var code by remember { mutableStateOf("") }
    val bitmap = remember(setup.otpauthUrl) {
        runCatching { qrBitmap(setup.otpauthUrl, 480) }.getOrNull()
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.setup_2fa)) },
        text = {
            Column {
                Text(
                    text = stringResource(R.string.two_factor_setup_hint),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color.White)
                        .padding(10.dp),
                ) {
                    if (bitmap != null) {
                        Image(
                            bitmap = bitmap.asImageBitmap(),
                            contentDescription = null,
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.size(150.dp),
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(
                            text = stringResource(R.string.two_factor_secret),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            text = setup.secret,
                            style = MaterialTheme.typography.bodyMedium,
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                    TextButton(onClick = {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(
                            ClipData.newPlainText("2FA", setup.secret),
                        )
                        Toast.makeText(context, context.getString(R.string.copied), Toast.LENGTH_SHORT).show()
                    }) {
                        Icon(
                            Icons.Filled.ContentCopy,
                            contentDescription = stringResource(R.string.copy),
                            tint = ElectricBlue,
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                LaqeeniField(
                    value = code,
                    onValueChange = { code = it.filter { c -> c.isDigit() }.take(6) },
                    label = stringResource(R.string.enter_6_digit),
                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Number,
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onEnable(code) },
                enabled = code.length == 6 && !loading,
            ) {
                Text(stringResource(R.string.enable_2fa), color = ElectricBlue)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) }
        },
        containerColor = MaterialTheme.colorScheme.surface,
    )
}

@Composable
private fun DisableTwoFactorDialog(
    loading: Boolean,
    onDismiss: () -> Unit,
    onDisable: (String, String) -> Unit,
) {
    var password by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.disable_2fa)) },
        text = {
            Column {
                Text(stringResource(R.string.disable_2fa_hint))
                Spacer(Modifier.height(12.dp))
                LaqeeniField(
                    value = password,
                    onValueChange = { password = it },
                    label = stringResource(R.string.current_password),
                    isPassword = true,
                )
                Spacer(Modifier.height(10.dp))
                LaqeeniField(
                    value = code,
                    onValueChange = { code = it.filter { c -> c.isDigit() }.take(6) },
                    label = stringResource(R.string.enter_6_digit),
                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Number,
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onDisable(password, code) },
                enabled = password.isNotBlank() && code.length == 6 && !loading,
            ) {
                Text(stringResource(R.string.disable_2fa), color = AlertRed)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) }
        },
        containerColor = MaterialTheme.colorScheme.surface,
    )
}

@Composable
private fun ChangePasswordDialog(
    loading: Boolean,
    onDismiss: () -> Unit,
    onSave: (String, String) -> Unit,
) {
    var current by remember { mutableStateOf("") }
    var next by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.change_password)) },
        text = {
            Column {
                if (error != null) {
                    Banner(error!!)
                    Spacer(Modifier.height(10.dp))
                }
                LaqeeniField(
                    value = current,
                    onValueChange = { current = it; error = null },
                    label = stringResource(R.string.current_password),
                    isPassword = true,
                )
                Spacer(Modifier.height(10.dp))
                LaqeeniField(
                    value = next,
                    onValueChange = { next = it; error = null },
                    label = stringResource(R.string.new_password),
                    isPassword = true,
                    supportingText = stringResource(R.string.password_rules_hint),
                )
                Spacer(Modifier.height(10.dp))
                LaqeeniField(
                    value = confirm,
                    onValueChange = { confirm = it; error = null },
                    label = stringResource(R.string.confirm_password),
                    isPassword = true,
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val valid = Regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{10,128}$")
                    when {
                        !valid.matches(next) ->
                            error = "Use 10+ characters with upper case, lower case and a number"
                        next != confirm -> error = "Passwords do not match"
                        else -> onSave(current, next)
                    }
                },
                enabled = current.isNotBlank() && next.isNotBlank() && !loading,
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
private fun DeleteAccountDialog(
    loading: Boolean,
    onDismiss: () -> Unit,
    onDelete: (String) -> Unit,
) {
    var password by remember { mutableStateOf("") }
    var confirmOpen by remember { mutableStateOf(false) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.delete_account)) },
        text = {
            Column {
                Text(stringResource(R.string.delete_account_confirm))
                Spacer(Modifier.height(12.dp))
                LaqeeniField(
                    value = password,
                    onValueChange = { password = it },
                    label = stringResource(R.string.password),
                    isPassword = true,
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { confirmOpen = true },
                enabled = password.isNotBlank() && !loading,
            ) {
                Text(stringResource(R.string.delete_account), color = AlertRed)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) }
        },
        containerColor = MaterialTheme.colorScheme.surface,
    )
    if (confirmOpen) {
        ConfirmDialog(
            title = stringResource(R.string.delete_account),
            message = stringResource(R.string.delete_account_confirm),
            confirmLabel = stringResource(R.string.confirm),
            dismissLabel = stringResource(R.string.cancel),
            destructive = true,
            onConfirm = {
                confirmOpen = false
                onDelete(password)
            },
            onDismiss = { confirmOpen = false },
        )
    }
}
