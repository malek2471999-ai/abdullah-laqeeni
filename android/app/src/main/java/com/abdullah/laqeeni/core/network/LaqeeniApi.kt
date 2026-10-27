package com.abdullah.laqeeni.core.network

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface LaqeeniApi {
    // Account
    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("auth/2fa/verify")
    suspend fun verifyTwoFactor(@Body body: TwoFactorRequest): AuthResponse

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): AuthResponse

    @GET("auth/me")
    suspend fun me(): UserDto

    @POST("auth/logout")
    suspend fun logout(): OkResponse

    @POST("auth/logout-all")
    suspend fun logoutAll(): OkResponse

    @GET("auth/sessions")
    suspend fun sessions(): List<SessionDto>

    @DELETE("auth/sessions/{id}")
    suspend fun revokeSession(@Path("id") id: String): OkResponse

    @POST("auth/password")
    suspend fun changePassword(@Body body: ChangePasswordRequest): OkResponse

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body body: ForgotPasswordRequest): ServerMessage

    @DELETE("auth/account")
    suspend fun deleteAccount(@Body body: DeleteAccountRequest): OkResponse

    @GET("auth/security-events")
    suspend fun securityEvents(): List<SecurityEventDto>

    @POST("auth/2fa/setup")
    suspend fun setupTwoFactor(): TwoFactorSetupDto

    @POST("auth/2fa/enable")
    suspend fun enableTwoFactor(@Body body: CodeRequest): OkResponse

    @POST("auth/2fa/disable")
    suspend fun disableTwoFactor(@Body body: TwoFactorDisableRequest): OkResponse

    // Devices (owner)
    @GET("devices")
    suspend fun devices(): List<DeviceDto>

    @GET("devices/{id}")
    suspend fun device(@Path("id") id: String): DeviceDto

    @POST("devices/pairing")
    suspend fun createPairing(): PairingResponse

    @POST("devices/pair")
    suspend fun pair(@Body body: PairRequest): PairResponse

    @PATCH("devices/{id}")
    suspend fun updateDevice(@Path("id") id: String, @Body body: UpdateDeviceRequest): DeviceDto

    @DELETE("devices/{id}")
    suspend fun deleteDevice(@Path("id") id: String): OkResponse

    @GET("devices/{id}/history")
    suspend fun history(
        @Path("id") id: String,
        @Query("limit") limit: Int = 200,
    ): HistoryResponse

    @GET("devices/{id}/location")
    suspend fun location(@Path("id") id: String): LocationEnvelope

    @POST("devices/{id}/ring")
    suspend fun ring(
        @Path("id") id: String,
        @Body body: RingRequest,
        @Header("Idempotency-Key") key: String,
    ): CommandDto

    @POST("devices/{id}/stop-ring")
    suspend fun stopRing(
        @Path("id") id: String,
        @Header("Idempotency-Key") key: String,
    ): CommandDto

    @POST("devices/{id}/locate")
    suspend fun locate(
        @Path("id") id: String,
        @Header("Idempotency-Key") key: String,
    ): CommandDto

    @POST("devices/{id}/lost-mode")
    suspend fun lostMode(
        @Path("id") id: String,
        @Body body: LostModeRequest,
        @Header("Idempotency-Key") key: String,
    ): LostModeResponse

    @POST("devices/{id}/message")
    suspend fun sendMessage(
        @Path("id") id: String,
        @Body body: MessageRequest,
        @Header("Idempotency-Key") key: String,
    ): CommandDto

    @POST("devices/{id}/vibrate")
    suspend fun vibrate(
        @Path("id") id: String,
        @Body body: VibrateRequest,
        @Header("Idempotency-Key") key: String,
    ): CommandDto

    @POST("devices/{id}/flash")
    suspend fun flash(
        @Path("id") id: String,
        @Body body: FlashRequest,
        @Header("Idempotency-Key") key: String,
    ): CommandDto

    // Linked device endpoints
    @GET("device/me")
    suspend fun deviceMe(): DeviceMeResponse

    @POST("device/heartbeat")
    suspend fun heartbeat(@Body body: HeartbeatRequest): HeartbeatResponse

    @POST("device/location")
    suspend fun postLocation(@Body body: LocationRequest): LocationResultDto

    @GET("device/commands/pending")
    suspend fun pendingCommands(): PendingCommandsResponse

    @POST("device/commands/{id}/ack")
    suspend fun acknowledge(
        @Path("id") id: String,
        @Body body: CommandAckRequest,
    ): OkResponse

    @POST("device/push-token")
    suspend fun pushToken(@Body body: PushTokenRequest): OkResponse
}

@kotlinx.serialization.Serializable
data class SessionDto(
    val id: String,
    val userAgent: String? = null,
    val ip: String? = null,
    val createdAt: String,
    val lastUsedAt: String,
    val expiresAt: String,
    val current: Boolean = false,
)

@kotlinx.serialization.Serializable
data class TwoFactorSetupDto(val secret: String, val otpauthUrl: String)

@kotlinx.serialization.Serializable
data class CodeRequest(val code: String)

@kotlinx.serialization.Serializable
data class TwoFactorDisableRequest(val password: String, val code: String)

@kotlinx.serialization.Serializable
data class LocationEnvelope(
    val location: DeviceLocationDto? = null,
    val ageSeconds: Long? = null,
    val stale: Boolean = true,
    val live: Boolean = false,
)

@kotlinx.serialization.Serializable
data class LocationResultDto(
    val ok: Boolean = false,
    val accepted: Boolean = false,
    val historySaved: Boolean = false,
)

@kotlinx.serialization.Serializable
data class LostModeResponse(val device: DeviceDto, val command: CommandDto? = null)

@kotlinx.serialization.Serializable
data class DeviceMeResponse(val device: DeviceDto, val serverTime: String? = null)
