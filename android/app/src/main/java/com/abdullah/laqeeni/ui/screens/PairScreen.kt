package com.abdullah.laqeeni.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.Bitmap
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.Image
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
import androidx.compose.material.icons.filled.AddLink
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.ui.components.Banner
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
import com.abdullah.laqeeni.ui.viewmodel.AppViewModel
import com.abdullah.laqeeni.ui.viewmodel.PairViewModel
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions

@Composable
fun PairScreen(
    appViewModel: AppViewModel,
    initialCode: String? = null,
    onLinked: () -> Unit,
    onOpenDevice: (String) -> Unit,
) {
    val viewModel: PairViewModel = hiltViewModel()
    val state = viewModel.state
    val context = LocalContext.current
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var code by rememberSaveable { mutableStateOf("") }
    var draftName by remember { mutableStateOf("") }
    var localError by remember { mutableStateOf<String?>(null) }
    var copied by remember { mutableStateOf(false) }

    LaunchedEffect(initialCode) {
        val parsed = initialCode?.let(::extractPairCode)
        if (parsed != null && appViewModel.deviceId.isNullOrBlank()) {
            code = parsed
            tab = 0
        }
    }

    val link = appViewModel.deviceId
    val isLinked = !link.isNullOrBlank() || state.linked

    val scanner = rememberLauncherForActivityResult(ScanContract()) { result ->
        val payload = result.contents ?: return@rememberLauncherForActivityResult
        val parsed = extractPairCode(payload)
        if (parsed == null) {
            localError = context.getString(R.string.invalid_code)
        } else {
            code = parsed
            tab = 0
            localError = null
        }
    }

    GradientScreen {
        Column(Modifier.fillMaxSize()) {
            LaqeeniTopBar(title = stringResource(R.string.pair_device))
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 28.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text(
                    text = stringResource(R.string.pair_help),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                if (isLinked) {
                    LinkedPhoneCard(
                        name = appViewModel.deviceName ?: state.linkedDeviceName,
                        onOpen = {
                            val id = appViewModel.deviceId
                            if (!id.isNullOrBlank()) onOpenDevice(id)
                        },
                    )
                }

                Tabs(
                    selected = tab,
                    onSelect = {
                        tab = it
                        localError = null
                    },
                )

                if (tab == 0) {
                    SectionCard(title = stringResource(R.string.pair_this_phone)) {
                        LaqeeniField(
                            value = code,
                            onValueChange = {
                                code = normalizeCode(it)
                                localError = null
                            },
                            label = stringResource(R.string.enter_code),
                            leadingIcon = Icons.Filled.AddLink,
                            enabled = !state.loading,
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = stringResource(R.string.pairing_expires),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(14.dp))
                        val error = localError ?: state.error
                        if (error != null) {
                            Banner(error)
                            Spacer(Modifier.height(12.dp))
                        }
                        PrimaryButton(
                            text = stringResource(R.string.pair_this_phone),
                            enabled = code.length == 8 && !isLinked,
                            loading = state.loading,
                            onClick = {
                                if (isLinked) {
                                    localError = context.getString(R.string.linked_badge)
                                } else {
                                    viewModel.pair(code) {
                                        appViewModel.refresh()
                                        onLinked()
                                    }
                                }
                            },
                        )
                        Spacer(Modifier.height(10.dp))
                        SecondaryButton(
                            text = stringResource(R.string.scan_qr),
                            icon = Icons.Filled.QrCodeScanner,
                            onClick = {
                                scanner.launch(
                                    ScanOptions()
                                        .setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                                        .setPrompt(context.getString(R.string.pairing_scan_hint))
                                        .setBeepEnabled(false)
                                        .setOrientationLocked(false),
                                )
                            },
                        )
                    }

                    SectionCard(title = stringResource(R.string.privacy_note)) {
                        Text(
                            text = stringResource(R.string.background_permission_rationale),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                } else {
                    SectionCard(title = stringResource(R.string.create_code)) {
                        Text(
                            text = stringResource(R.string.pair_help),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(14.dp))
                        if (state.pairing == null) {
                            PrimaryButton(
                                text = stringResource(R.string.create_code),
                                loading = state.loading,
                                onClick = viewModel::createCode,
                            )
                        } else {
                            val pairing = state.pairing
                            val bitmap = remember(pairing.qrPayload) {
                                runCatching { qrBitmap(pairing.qrPayload) }.getOrNull()
                            }
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(androidx.compose.ui.graphics.Color.White)
                                    .padding(18.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                if (bitmap != null) {
                                    Image(
                                        bitmap = bitmap.asImageBitmap(),
                                        contentDescription = stringResource(R.string.scan_qr),
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier.size(220.dp),
                                    )
                                } else {
                                    Icon(
                                        Icons.Filled.QrCodeScanner,
                                        contentDescription = null,
                                        tint = ElectricBlue,
                                        modifier = Modifier.size(120.dp),
                                    )
                                }
                            }
                            Spacer(Modifier.height(16.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center,
                            ) {
                                Text(
                                    text = pairing.code,
                                    style = MaterialTheme.typography.displaySmall,
                                    color = Emerald,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 6.sp,
                                )
                                Spacer(Modifier.width(8.dp))
                                IconButton(
                                    onClick = {
                                        val clipboard = context.getSystemService(
                                            Context.CLIPBOARD_SERVICE,
                                        ) as ClipboardManager
                                        clipboard.setPrimaryClip(
                                            ClipData.newPlainText(
                                                context.getString(R.string.pairing_code),
                                                pairing.code,
                                            ),
                                        )
                                        copied = true
                                        Toast.makeText(
                                            context,
                                            context.getString(R.string.code_copied),
                                            Toast.LENGTH_SHORT,
                                        ).show()
                                    },
                                ) {
                                    Icon(
                                        Icons.Filled.ContentCopy,
                                        contentDescription = stringResource(R.string.copy),
                                        tint = if (copied) Emerald else MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                            Text(
                                text = stringResource(R.string.pairing_expires),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            Spacer(Modifier.height(14.dp))
                            SecondaryButton(
                                text = stringResource(R.string.new_code),
                                icon = Icons.Filled.Refresh,
                                onClick = viewModel::createCode,
                            )
                        }
                        if (state.error != null) {
                            Spacer(Modifier.height(12.dp))
                            Banner(state.error)
                        }
                        Spacer(Modifier.height(12.dp))
                        Text(
                            text = stringResource(R.string.device_limit),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                if (state.loading && state.pairing == null && tab == 1) {
                    LoadingBox()
                }

                LinkPrivacyNote()
            }
        }
    }
}

@Composable
private fun LinkedPhoneCard(name: String?, onOpen: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Emerald.copy(alpha = 0.12f))
            .border(1.dp, Emerald.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
            .clickable(onClick = onOpen)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(Emerald.copy(alpha = 0.16f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = Emerald)
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = stringResource(R.string.linked_badge),
                style = MaterialTheme.typography.titleMedium,
                color = Emerald,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = name ?: stringResource(R.string.this_phone_protected),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Icon(
            Icons.Filled.PhoneAndroid,
            contentDescription = null,
            tint = Emerald,
        )
    }
}

@Composable
private fun Tabs(selected: Int, onSelect: (Int) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        listOf(R.string.pair_tab_this, R.string.pair_tab_other).forEachIndexed { index, res ->
            val active = selected == index
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(13.dp))
                    .background(
                        if (active) ElectricBlue else androidx.compose.ui.graphics.Color.Transparent,
                    )
                    .clickable { onSelect(index) }
                    .padding(vertical = 11.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = stringResource(res),
                    style = MaterialTheme.typography.labelLarge,
                    color = if (active) {
                        androidx.compose.ui.graphics.Color.White
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
                )
            }
        }
    }
}

@Composable
private fun LinkPrivacyNote() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            Icons.Filled.Security,
            contentDescription = null,
            tint = Violet,
            modifier = Modifier.size(16.dp),
        )
        Spacer(Modifier.width(8.dp))
        Text(
            text = stringResource(R.string.permission_location),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

private fun normalizeCode(raw: String): String =
    raw.uppercase().filter { it.isLetterOrDigit() }.take(8)

internal fun extractPairCode(payload: String): String? {
    val raw = if (payload.contains("code=")) {
        payload.substringAfter("code=").substringBefore("&")
    } else {
        payload
    }
    val normalized = normalizeCode(raw)
    return normalized.takeIf { it.length == 8 }
}

internal fun qrBitmap(content: String, size: Int = 640): Bitmap {
    val matrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, size, size)
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    for (x in 0 until size) {
        for (y in 0 until size) {
            bitmap.setPixel(
                x,
                y,
                if (matrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE,
            )
        }
    }
    return bitmap
}
