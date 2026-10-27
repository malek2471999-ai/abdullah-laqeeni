package com.abdullah.laqeeni.core.device

import android.location.Location
import com.abdullah.laqeeni.core.data.CachedDeviceEntity
import com.abdullah.laqeeni.core.data.DeviceCacheDao
import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.core.network.ApiProvider
import com.abdullah.laqeeni.core.network.ApiResult
import com.abdullah.laqeeni.core.network.CommandAckRequest
import com.abdullah.laqeeni.core.network.CommandDto
import com.abdullah.laqeeni.core.network.DeviceDto
import com.abdullah.laqeeni.core.network.FlashRequest
import com.abdullah.laqeeni.core.network.HeartbeatRequest
import com.abdullah.laqeeni.core.network.HeartbeatResponse
import com.abdullah.laqeeni.core.network.HistoryResponse
import com.abdullah.laqeeni.core.network.LocationRequest
import com.abdullah.laqeeni.core.network.LocationResultDto
import com.abdullah.laqeeni.core.network.LostModeRequest
import com.abdullah.laqeeni.core.network.LostModeResponse
import com.abdullah.laqeeni.core.network.MessageRequest
import com.abdullah.laqeeni.core.network.PairRequest
import com.abdullah.laqeeni.core.network.PairResponse
import com.abdullah.laqeeni.core.network.PairingResponse
import com.abdullah.laqeeni.core.network.PendingCommandsResponse
import com.abdullah.laqeeni.core.network.RingRequest
import com.abdullah.laqeeni.core.network.UpdateDeviceRequest
import com.abdullah.laqeeni.core.network.VibrateRequest
import com.abdullah.laqeeni.core.network.safeApi
import kotlinx.serialization.json.Json
import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class DeviceListResult(
    val devices: List<DeviceDto>,
    val fromCache: Boolean = false,
)

@Singleton
class DeviceRepository @Inject constructor(
    private val apiProvider: ApiProvider,
    private val store: SecureStore,
    private val cache: DeviceCacheDao,
    private val info: DeviceInfoProvider,
    private val locationProvider: com.abdullah.laqeeni.core.location.LocationProvider,
    private val json: Json,
) {
    val linkedDeviceId: String? get() = store.deviceId
    val hasDeviceCredentials: Boolean get() = store.deviceToken != null

    suspend fun devices(): ApiResult<DeviceListResult> {
        return when (val result = safeApi { apiProvider.api().devices() }) {
            is ApiResult.Success -> {
                cacheDevices(result.data)
                ApiResult.Success(DeviceListResult(result.data))
            }
            is ApiResult.Error -> {
                if (!result.network) return result
                val cached = cache.all().mapNotNull { entity ->
                    runCatching { json.decodeFromString(DeviceDto.serializer(), entity.json) }.getOrNull()
                }
                if (cached.isEmpty()) result else ApiResult.Success(DeviceListResult(cached, fromCache = true))
            }
        }
    }

    suspend fun device(id: String): ApiResult<DeviceDto> {
        val result = safeApi { apiProvider.api().device(id) }
        if (result is ApiResult.Success) {
            cache.upsert(
                CachedDeviceEntity(
                    result.data.id,
                    json.encodeToString(DeviceDto.serializer(), result.data),
                    System.currentTimeMillis(),
                ),
            )
        }
        return result
    }

    suspend fun createPairing(): ApiResult<PairingResponse> =
        safeApi { apiProvider.api().createPairing() }

    suspend fun pair(code: String): ApiResult<PairResponse> {
        val result = safeApi {
            apiProvider.api().pair(
                PairRequest(
                    code = code,
                    name = info.deviceName,
                    manufacturer = info.manufacturer,
                    model = info.model,
                    androidVersion = info.androidVersion,
                    appVersion = info.appVersion,
                ),
            )
        }
        if (result is ApiResult.Success) {
            store.saveDevice(
                result.data.device.id,
                result.data.deviceToken,
                result.data.device.name,
            )
        }
        return result
    }

    suspend fun history(id: String, limit: Int = 200): ApiResult<HistoryResponse> =
        safeApi { apiProvider.api().history(id, limit) }

    suspend fun update(
        id: String,
        name: String? = null,
        lostMessage: String? = null,
        contactPhone: String? = null,
        historyEnabled: Boolean? = null,
        retentionDays: Int? = null,
        notifyOnReconnect: Boolean? = null,
    ): ApiResult<DeviceDto> = safeApi {
        apiProvider.api().updateDevice(
            id,
            UpdateDeviceRequest(
                name = name,
                lostMessage = lostMessage,
                contactPhone = contactPhone,
                locationHistoryEnabled = historyEnabled,
                historyRetentionDays = retentionDays,
                notifyOnReconnect = notifyOnReconnect,
            ),
        )
    }

    suspend fun delete(id: String): ApiResult<Unit> {
        val result = safeApi { apiProvider.api().deleteDevice(id) }
        if (result is ApiResult.Success) {
            cache.delete(id)
            if (store.deviceId == id) store.clearDevice()
            return ApiResult.Success(Unit)
        }
        return result as ApiResult.Error
    }

    suspend fun ring(
        id: String,
        durationSeconds: Int,
        sound: String,
        vibration: Boolean,
        flash: Boolean,
    ): ApiResult<CommandDto> = safeApi {
        apiProvider.api().ring(
            id,
            RingRequest(durationSeconds, sound, vibration, flash),
            UUID.randomUUID().toString(),
        )
    }

    suspend fun stopRing(id: String): ApiResult<CommandDto> = safeApi {
        apiProvider.api().stopRing(id, UUID.randomUUID().toString())
    }

    suspend fun locate(id: String): ApiResult<CommandDto> = safeApi {
        apiProvider.api().locate(id, UUID.randomUUID().toString())
    }

    suspend fun lostMode(
        id: String,
        enabled: Boolean,
        message: String?,
        contactPhone: String?,
    ): ApiResult<LostModeResponse> = safeApi {
        apiProvider.api().lostMode(
            id,
            LostModeRequest(enabled, message, contactPhone),
            UUID.randomUUID().toString(),
        )
    }

    suspend fun message(id: String, message: String, contactPhone: String?): ApiResult<CommandDto> =
        safeApi {
            apiProvider.api().sendMessage(
                id,
                MessageRequest(message, contactPhone),
                UUID.randomUUID().toString(),
            )
        }

    suspend fun vibrate(id: String, seconds: Int): ApiResult<CommandDto> = safeApi {
        apiProvider.api().vibrate(
            id,
            VibrateRequest(seconds),
            UUID.randomUUID().toString(),
        )
    }

    suspend fun flash(id: String, seconds: Int): ApiResult<CommandDto> = safeApi {
        apiProvider.api().flash(
            id,
            FlashRequest(seconds),
            UUID.randomUUID().toString(),
        )
    }

    // ── Linked-device side ──────────────────────────────────────────────

    suspend fun heartbeat(): ApiResult<HeartbeatResponse> {
        val battery = info.battery()
        val network = info.network()
        return safeApi {
            apiProvider.api().heartbeat(
                HeartbeatRequest(
                    batteryLevel = battery.level,
                    charging = battery.charging,
                    networkConnected = network.connected,
                    networkType = network.type,
                    appVersion = info.appVersion,
                ),
            )
        }
    }

    suspend fun postLocation(location: Location, highAccuracy: Boolean = true): ApiResult<LocationResultDto> =
        safeApi {
            apiProvider.api().postLocation(
                LocationRequest(
                    latitude = location.latitude,
                    longitude = location.longitude,
                    accuracyMeters = location.accuracy.toDouble().takeIf { location.hasAccuracy() },
                    altitudeMeters = location.altitude.takeIf { location.hasAltitude() },
                    speedMps = location.speed.toDouble().takeIf { location.hasSpeed() },
                    headingDegrees = location.bearing.toDouble().takeIf { location.hasBearing() },
                    capturedAt = Instant.ofEpochMilli(location.time).toString(),
                    isMock = locationProvider.isMock(location),
                    source = if (highAccuracy) "fused" else "passive",
                ),
            )
        }

    suspend fun heartbeatAndLocation(highAccuracy: Boolean = false): Result<Unit> {
        val beat = heartbeat()
        if (beat is ApiResult.Error) {
            return Result.failure(IllegalStateException(beat.message ?: "heartbeat"))
        }
        if (locationProvider.hasForegroundPermission()) {
            val location = locationProvider.currentLocation(highAccuracy = highAccuracy)
            if (location != null) postLocation(location, highAccuracy)
        }
        return Result.success(Unit)
    }

    suspend fun pendingCommands(): ApiResult<PendingCommandsResponse> =
        safeApi { apiProvider.api().pendingCommands() }

    suspend fun acknowledge(commandId: String, success: Boolean, message: String? = null): ApiResult<Unit> {
        val result = safeApi {
            apiProvider.api().acknowledge(
                commandId,
                CommandAckRequest(if (success) "SUCCESS" else "FAILED", message),
            )
        }
        return if (result is ApiResult.Success) ApiResult.Success(Unit) else result as ApiResult.Error
    }

    suspend fun registerPushToken(token: String): ApiResult<Unit> {
        val result = safeApi {
            apiProvider.api().pushToken(com.abdullah.laqeeni.core.network.PushTokenRequest(token))
        }
        return if (result is ApiResult.Success) ApiResult.Success(Unit) else result as ApiResult.Error
    }

    private suspend fun cacheDevices(devices: List<DeviceDto>) {
        cache.clear()
        devices.forEach { device ->
            cache.upsert(
                CachedDeviceEntity(
                    id = device.id,
                    json = json.encodeToString(DeviceDto.serializer(), device),
                    updatedAt = System.currentTimeMillis(),
                ),
            )
        }
    }
}
