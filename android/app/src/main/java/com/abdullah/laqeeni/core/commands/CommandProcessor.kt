package com.abdullah.laqeeni.core.commands

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.content.ContextCompat
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.alarm.AlarmService
import com.abdullah.laqeeni.core.data.CommandDao
import com.abdullah.laqeeni.core.data.ProcessedCommandEntity
import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.core.device.DeviceRepository
import com.abdullah.laqeeni.core.location.LocationProvider
import com.abdullah.laqeeni.core.network.ApiResult
import com.abdullah.laqeeni.core.network.CommandDto
import com.abdullah.laqeeni.core.notifications.NotificationHelper
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.delay
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.intOrNull
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

data class SyncResult(val ok: Boolean, val executed: Int = 0)

/**
 * Pulls owner commands for this device and executes only the documented,
 * user-visible actions. Every command is acknowledged and de-duplicated in
 * Room so a 25 second server re-delivery cannot ring twice.
 */
@Singleton
class CommandProcessor @Inject constructor(
    @ApplicationContext private val context: Context,
    private val repository: DeviceRepository,
    private val store: SecureStore,
    private val commandDao: CommandDao,
    private val locationProvider: LocationProvider,
) {
    private val mutex = Mutex()
    private var lastPrune = 0L

    suspend fun sync(): SyncResult = mutex.withLock {
        if (store.deviceToken.isNullOrBlank()) return SyncResult(false)
        when (val pending = repository.pendingCommands()) {
            is ApiResult.Error -> SyncResult(false)
            is ApiResult.Success -> {
                syncLostMode(pending.data.lostMode)
                var executed = 0
                pending.data.commands.forEach { command ->
                    if (process(command)) executed++
                }
                prune()
                SyncResult(true, executed)
            }
        }
    }

    private suspend fun syncLostMode(state: com.abdullah.laqeeni.core.network.DeviceStateDto?) {
        state ?: return
        val wasLost = store.lostMode
        if (state.lostMessage != null) store.lostMessage = state.lostMessage
        if (state.contactPhone != null) store.contactPhone = state.contactPhone
        if (state.lostMode && !wasLost) {
            activateLostMode(
                state.lostMessage ?: context.getString(R.string.lost_screen_message),
                state.contactPhone,
                urgent = false,
            )
        } else if (!state.lostMode && wasLost) {
            deactivateLostMode()
        }
    }

    private suspend fun process(command: CommandDto): Boolean {
        if (commandDao.isProcessed(command.id)) {
            // Still acknowledge a command whose earlier ack was lost in transit.
            repository.acknowledge(command.id, true, "Already processed on device")
            return false
        }
        val expired = command.expiresAt?.let { raw ->
            runCatching { Instant.parse(raw).isBefore(Instant.now()) }.getOrDefault(false)
        } ?: false
        if (expired) {
            commandDao.markProcessed(ProcessedCommandEntity(command.id, System.currentTimeMillis()))
            repository.acknowledge(command.id, false, "Command expired before delivery")
            return false
        }

        val outcome = runCatching { execute(command) }
        commandDao.markProcessed(ProcessedCommandEntity(command.id, System.currentTimeMillis()))
        repository.acknowledge(
            command.id,
            outcome.isSuccess,
            outcome.exceptionOrNull()?.message ?: outcome.getOrNull(),
        )
        return outcome.isSuccess
    }

    private suspend fun execute(command: CommandDto): String {
        val payload = command.payload
        return when (command.type) {
            "RING" -> {
                val message = store.lostMessage ?: context.getString(R.string.alarm_screen_message)
                AlarmService.start(
                    context = context,
                    durationSeconds = payload.int("durationSeconds", 180).coerceIn(1, 300),
                    sound = payload.string("sound") ?: "siren",
                    vibration = payload.bool("vibration", true),
                    flash = payload.bool("flash", true),
                    message = message,
                    contact = store.contactPhone,
                )
                "Alarm started"
            }
            "STOP_RING" -> {
                AlarmService.stop(context)
                "Alarm stopped"
            }
            "LOST_MODE_ON" -> {
                val message = payload.string("message")
                    ?: store.lostMessage
                    ?: context.getString(R.string.lost_screen_message)
                val contact = payload.string("contactPhone") ?: store.contactPhone
                activateLostMode(message, contact, urgent = true)
                "Lost Mode enabled"
            }
            "LOST_MODE_OFF" -> {
                deactivateLostMode()
                "Lost Mode disabled"
            }
            "MESSAGE" -> {
                val message = payload.string("message") ?: error("Message is empty")
                store.lostMessage = message
                payload.string("contactPhone")?.let { store.contactPhone = it }
                if (store.lostMode) {
                    NotificationHelper.showLostMode(
                        context,
                        message,
                        store.contactPhone,
                        urgent = false,
                    )
                } else {
                    NotificationHelper.showMessage(context, message)
                }
                "Message shown"
            }
            "LOCATE" -> {
                if (!locationProvider.hasForegroundPermission()) {
                    error("Location permission is not granted on the protected phone")
                }
                val location = locationProvider.currentLocation(highAccuracy = true)
                    ?: error("No location fix available")
                when (val posted = repository.postLocation(location, highAccuracy = true)) {
                    is ApiResult.Success -> "Location sent (±${location.accuracy.toInt()} m)"
                    is ApiResult.Error -> error(posted.message ?: "Location upload failed")
                }
            }
            "VIBRATE" -> {
                vibrate(payload.int("durationSeconds", 10).coerceIn(1, 60))
                "Vibration started"
            }
            "FLASH" -> {
                flash(payload.int("durationSeconds", 15).coerceIn(1, 120))
                "Flash finished"
            }
            "REQUEST_STATUS" -> {
                when (val beat = repository.heartbeat()) {
                    is ApiResult.Success -> "Status reported"
                    is ApiResult.Error -> error(beat.message ?: "Status upload failed")
                }
            }
            else -> error("Unsupported command: ${command.type}")
        }
    }

    private fun activateLostMode(message: String, contact: String?, urgent: Boolean) {
        store.lostMessage = message
        store.contactPhone = contact
        store.lostMode = true
        NotificationHelper.showLostMode(context, message, contact, urgent)
    }

    private fun deactivateLostMode() {
        store.lostMode = false
        NotificationHelper.cancelLostMode(context)
    }

    private suspend fun vibrate(seconds: Int) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)
                ?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        } ?: error("No vibrator available")
        if (!vibrator.hasVibrator()) error("No vibrator available")
        val pattern = longArrayOf(0, 700, 300)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(pattern, 0)
        }
        try {
            delay(seconds * 1000L)
        } finally {
            runCatching { vibrator.cancel() }
        }
    }

    private suspend fun flash(seconds: Int) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            error("Camera permission is required for the flash")
        }
        val manager = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
            ?: error("No camera service")
        val cameraId = runCatching {
            manager.cameraIdList.firstOrNull { id ->
                manager.getCameraCharacteristics(id)
                    .get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }
        }.getOrNull() ?: error("This device has no usable flash")
        var on = false
        try {
            val end = System.currentTimeMillis() + seconds * 1000L
            while (System.currentTimeMillis() < end) {
                on = !on
                manager.setTorchMode(cameraId, on)
                delay(if (on) 300 else 220)
            }
        } finally {
            runCatching { manager.setTorchMode(cameraId, false) }
        }
    }

    private suspend fun prune() {
        val now = System.currentTimeMillis()
        if (now - lastPrune < 6 * 60 * 60 * 1000L) return
        lastPrune = now
        commandDao.prune(now - 7L * 24 * 60 * 60 * 1000L)
    }

    private fun JsonObject.int(key: String, fallback: Int): Int =
        (this[key] as? JsonPrimitive)?.intOrNull ?: fallback

    private fun JsonObject.bool(key: String, fallback: Boolean): Boolean =
        (this[key] as? JsonPrimitive)?.booleanOrNull ?: fallback

    private fun JsonObject.string(key: String): String? =
        (this[key] as? JsonPrimitive)?.takeIf { it.isString }?.content
}
