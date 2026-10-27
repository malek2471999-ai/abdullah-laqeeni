package com.abdullah.laqeeni.core.network

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val name: String,
    val emailVerified: Boolean = false,
    val twoFactorEnabled: Boolean = false,
    val createdAt: String? = null,
)

@Serializable
data class AuthResponse(
    val accessToken: String? = null,
    val refreshToken: String? = null,
    val expiresIn: Int? = null,
    val user: UserDto? = null,
    val twoFactorRequired: Boolean = false,
    val challengeToken: String? = null,
    val verificationToken: String? = null,
)

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class RegisterRequest(val name: String, val email: String, val password: String)

@Serializable
data class TwoFactorRequest(val challengeToken: String, val code: String)

@Serializable
data class RefreshRequest(val refreshToken: String)

@Serializable
data class PairingResponse(
    val pairingId: String,
    val code: String,
    val normalizedCode: String? = null,
    val expiresAt: String,
    val qrPayload: String,
)

@Serializable
data class PairRequest(
    val code: String,
    val name: String,
    val manufacturer: String,
    val model: String,
    val androidVersion: String,
    val appVersion: String? = null,
    val fcmToken: String? = null,
)

@Serializable
data class PairResponse(val device: DeviceDto, val deviceToken: String, val warning: String? = null)

@Serializable
data class DeviceLocationDto(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Double? = null,
    val altitudeMeters: Double? = null,
    val speedMps: Double? = null,
    val headingDegrees: Double? = null,
    val source: String? = null,
    val isMock: Boolean = false,
    val capturedAt: String,
    val recordedAt: String? = null,
)

@Serializable
data class DeviceDto(
    val id: String,
    val name: String,
    val manufacturer: String,
    val model: String,
    val androidVersion: String,
    val appVersion: String? = null,
    val online: Boolean = false,
    val lastSeenAt: String? = null,
    val pairedAt: String? = null,
    val lostMode: Boolean = false,
    val lostMessage: String? = null,
    val contactPhone: String? = null,
    val locationHistoryEnabled: Boolean = false,
    val historyRetentionDays: Int = 30,
    val notifyOnReconnect: Boolean = true,
    val batteryLevel: Int? = null,
    val charging: Boolean? = null,
    val networkConnected: Boolean? = null,
    val networkType: String? = null,
    val lastSyncAt: String? = null,
    val location: DeviceLocationDto? = null,
    val locationAgeSeconds: Long? = null,
    val locationStale: Boolean = true,
    val locationLive: Boolean = false,
    val createdAt: String? = null,
)

@Serializable
data class HistoryPointDto(
    val id: String,
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Double? = null,
    val isMock: Boolean = false,
    val capturedAt: String,
)

@Serializable
data class HistoryResponse(
    val deviceId: String,
    val historyEnabled: Boolean,
    val retentionDays: Int,
    val points: List<HistoryPointDto> = emptyList(),
)

@Serializable
data class UpdateDeviceRequest(
    val name: String? = null,
    val lostMessage: String? = null,
    val contactPhone: String? = null,
    val locationHistoryEnabled: Boolean? = null,
    val historyRetentionDays: Int? = null,
    val notifyOnReconnect: Boolean? = null,
)

@Serializable
data class RingRequest(
    val durationSeconds: Int = 180,
    val sound: String = "siren",
    val vibration: Boolean = true,
    val flash: Boolean = true,
)

@Serializable
data class LostModeRequest(
    val enabled: Boolean,
    val message: String? = null,
    val contactPhone: String? = null,
)

@Serializable
data class MessageRequest(val message: String, val contactPhone: String? = null)

@Serializable
data class VibrateRequest(val durationSeconds: Int = 10)

@Serializable
data class FlashRequest(val durationSeconds: Int = 15)

@Serializable
data class CommandDto(
    val id: String,
    val type: String,
    val payload: JsonObject = JsonObject(emptyMap()),
    val status: String? = null,
    val createdAt: String? = null,
    val expiresAt: String? = null,
)

@Serializable
data class DeviceStateDto(
    val lostMode: Boolean = false,
    val lostMessage: String? = null,
    val contactPhone: String? = null,
)

@Serializable
data class PendingCommandsResponse(
    val commands: List<CommandDto> = emptyList(),
    val serverTime: String? = null,
    val lostMode: DeviceStateDto? = null,
)

@Serializable
data class HeartbeatRequest(
    val batteryLevel: Int? = null,
    val charging: Boolean? = null,
    val networkConnected: Boolean? = null,
    val networkType: String? = null,
    val appVersion: String? = null,
)

@Serializable
data class HeartbeatResponse(
    val ok: Boolean = false,
    val serverTime: String? = null,
    val online: Boolean = false,
    val lostMode: Boolean = false,
    val lostMessage: String? = null,
    val contactPhone: String? = null,
    val locationHistoryEnabled: Boolean = false,
)

@Serializable
data class LocationRequest(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Double? = null,
    val altitudeMeters: Double? = null,
    val speedMps: Double? = null,
    val headingDegrees: Double? = null,
    val capturedAt: String,
    val isMock: Boolean = false,
    val source: String = "fused",
)

@Serializable
data class CommandAckRequest(val status: String, val message: String? = null)

@Serializable
data class PushTokenRequest(val token: String)

@Serializable
data class ForgotPasswordRequest(val email: String)

@Serializable
data class ChangePasswordRequest(val currentPassword: String, val newPassword: String)

@Serializable
data class DeleteAccountRequest(val password: String)

@Serializable
data class SecurityEventDto(
    val id: String,
    val type: String,
    val ip: String? = null,
    val userAgent: String? = null,
    val metadata: JsonObject? = null,
    val createdAt: String,
)

@Serializable
data class ServerMessage(val message: String? = null)

@Serializable
data class OkResponse(val ok: Boolean = true)
