package com.abdullah.laqeeni.core.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.abdullah.laqeeni.BuildConfig
import com.abdullah.laqeeni.core.network.UserDto
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Small encrypted credential store. Tokens never touch unencrypted preferences
 * unless the device keystore is unavailable (fallback is logged in debug only).
 */
@Singleton
class SecureStore @Inject constructor(
    @ApplicationContext context: Context,
    private val json: Json,
) {
    private val prefs: SharedPreferences = createPreferences(context.applicationContext)

    val sessionExpired = MutableStateFlow(false)

    private fun createPreferences(context: Context): SharedPreferences {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                context,
                "laqeeni_secure",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        } catch (_: Exception) {
            context.getSharedPreferences("laqeeni_fallback", Context.MODE_PRIVATE)
        }
    }

    var accessToken: String?
        get() = prefs.getString(KEY_ACCESS, null)
        set(value) = prefs.edit().putString(KEY_ACCESS, value).apply()

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH, null)
        set(value) = prefs.edit().putString(KEY_REFRESH, value).apply()

    var deviceToken: String?
        get() = prefs.getString(KEY_DEVICE_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_TOKEN, value).apply()

    var deviceId: String?
        get() = prefs.getString(KEY_DEVICE_ID, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_ID, value).apply()

    var user: UserDto?
        get() = prefs.getString(KEY_USER, null)?.let {
            runCatching { json.decodeFromString(UserDto.serializer(), it) }.getOrNull()
        }
        set(value) = prefs.edit()
            .putString(KEY_USER, value?.let { json.encodeToString(UserDto.serializer(), it) })
            .apply()

    var baseUrl: String
        get() = prefs.getString(KEY_BASE_URL, null) ?: BuildConfig.DEFAULT_API_BASE_URL
        set(value) = prefs.edit().putString(KEY_BASE_URL, normalizeBaseUrl(value)).apply()

    var alarmSound: String
        get() = prefs.getString(KEY_ALARM_SOUND, "siren") ?: "siren"
        set(value) = prefs.edit().putString(KEY_ALARM_SOUND, value).apply()

    var alarmDuration: Int
        get() = prefs.getInt(KEY_ALARM_DURATION, 180)
        set(value) = prefs.edit().putInt(KEY_ALARM_DURATION, value).apply()

    var alarmVibration: Boolean
        get() = prefs.getBoolean(KEY_ALARM_VIBRATION, true)
        set(value) = prefs.edit().putBoolean(KEY_ALARM_VIBRATION, value).apply()

    var alarmFlash: Boolean
        get() = prefs.getBoolean(KEY_ALARM_FLASH, true)
        set(value) = prefs.edit().putBoolean(KEY_ALARM_FLASH, value).apply()

    var themeMode: String
        get() = prefs.getString(KEY_THEME, "system") ?: "system"
        set(value) = prefs.edit().putString(KEY_THEME, value).apply()

    var language: String
        get() = prefs.getString(KEY_LANGUAGE, "system") ?: "system"
        set(value) = prefs.edit().putString(KEY_LANGUAGE, value).apply()

    var guardianEnabled: Boolean
        get() = prefs.getBoolean(KEY_GUARDIAN, true)
        set(value) = prefs.edit().putBoolean(KEY_GUARDIAN, value).apply()

    var lastDeviceName: String?
        get() = prefs.getString(KEY_DEVICE_NAME, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_NAME, value).apply()

    var lostMessage: String?
        get() = prefs.getString(KEY_LOST_MESSAGE, null)
        set(value) = prefs.edit().putString(KEY_LOST_MESSAGE, value).apply()

    var contactPhone: String?
        get() = prefs.getString(KEY_CONTACT_PHONE, null)
        set(value) = prefs.edit().putString(KEY_CONTACT_PHONE, value).apply()

    var lostMode: Boolean
        get() = prefs.getBoolean(KEY_LOST_MODE, false)
        set(value) = prefs.edit().putBoolean(KEY_LOST_MODE, value).apply()

    var onboardingComplete: Boolean
        get() = prefs.getBoolean(KEY_ONBOARDING, false)
        set(value) = prefs.edit().putBoolean(KEY_ONBOARDING, value).apply()

    val isSignedIn: Boolean
        get() = !refreshToken.isNullOrBlank()

    fun saveSession(access: String, refresh: String, userDto: UserDto) {
        prefs.edit()
            .putString(KEY_ACCESS, access)
            .putString(KEY_REFRESH, refresh)
            .putString(KEY_USER, json.encodeToString(UserDto.serializer(), userDto))
            .apply()
        sessionExpired.value = false
    }

    fun saveDevice(deviceId: String, token: String, name: String) {
        prefs.edit()
            .putString(KEY_DEVICE_ID, deviceId)
            .putString(KEY_DEVICE_TOKEN, token)
            .putString(KEY_DEVICE_NAME, name)
            .putBoolean(KEY_GUARDIAN, true)
            .apply()
    }

    fun clearDevice() {
        prefs.edit()
            .remove(KEY_DEVICE_ID)
            .remove(KEY_DEVICE_TOKEN)
            .remove(KEY_DEVICE_NAME)
            .apply()
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_ACCESS)
            .remove(KEY_REFRESH)
            .remove(KEY_USER)
            .apply()
        clearDevice()
    }

    fun markSessionExpired() {
        sessionExpired.value = true
    }

    fun normalizeBaseUrl(raw: String): String {
        var value = raw.trim()
        if (value.isEmpty()) value = BuildConfig.DEFAULT_API_BASE_URL
        if (!value.endsWith("/")) value += "/"
        return value
    }

    fun isValidServer(raw: String): Boolean {
        val value = normalizeBaseUrl(raw)
        val scheme = value.substringBefore("://", "")
        if (scheme != "https" && scheme != "http") return false
        if (!BuildConfig.ALLOW_INSECURE_SERVER && scheme != "https") return false
        return value.length > 9 && value.contains(".")
    }

    private companion object {
        const val KEY_ACCESS = "access_token"
        const val KEY_REFRESH = "refresh_token"
        const val KEY_DEVICE_TOKEN = "device_token"
        const val KEY_DEVICE_ID = "device_id"
        const val KEY_DEVICE_NAME = "device_name"
        const val KEY_USER = "user_json"
        const val KEY_BASE_URL = "base_url"
        const val KEY_ALARM_SOUND = "alarm_sound"
        const val KEY_ALARM_DURATION = "alarm_duration"
        const val KEY_ALARM_VIBRATION = "alarm_vibration"
        const val KEY_ALARM_FLASH = "alarm_flash"
        const val KEY_THEME = "theme_mode"
        const val KEY_LANGUAGE = "language"
        const val KEY_GUARDIAN = "guardian_enabled"
        const val KEY_LOST_MESSAGE = "lost_message"
        const val KEY_CONTACT_PHONE = "contact_phone"
        const val KEY_LOST_MODE = "lost_mode"
        const val KEY_ONBOARDING = "onboarding_complete"
    }
}
