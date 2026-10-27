package com.abdullah.laqeeni.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import com.abdullah.laqeeni.core.auth.AuthRepository
import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.ui.locale.LocaleManager
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class AppViewModel @Inject constructor(
    private val store: SecureStore,
    val auth: AuthRepository,
) : ViewModel() {
    var signedIn by mutableStateOf(store.isSignedIn)
        private set
    var onboardingComplete by mutableStateOf(store.onboardingComplete)
        private set
    var themeMode by mutableStateOf(store.themeMode)
        private set
    var language by mutableStateOf(store.language)
        private set
    var serverUrl by mutableStateOf(store.baseUrl)
        private set
    var deviceId by mutableStateOf(store.deviceId)
        private set
    var deviceName by mutableStateOf(store.lastDeviceName)
        private set
    var guardianEnabled by mutableStateOf(store.guardianEnabled)
        private set
    var lostMode by mutableStateOf(store.lostMode)
        private set
    var user by mutableStateOf(store.user)
        private set
    var alarmDuration by mutableStateOf(store.alarmDuration)
        private set
    var alarmSound by mutableStateOf(store.alarmSound)
        private set
    var alarmVibration by mutableStateOf(store.alarmVibration)
        private set
    var alarmFlash by mutableStateOf(store.alarmFlash)
        private set

    val sessionExpired = store.sessionExpired

    fun completeOnboarding() {
        store.onboardingComplete = true
        onboardingComplete = true
    }

    fun setTheme(mode: String) {
        store.themeMode = mode
        themeMode = mode
    }

    fun updateLanguage(tag: String) {
        store.language = tag
        language = tag
        LocaleManager.apply(tag)
    }

    fun saveServer(raw: String): Boolean {
        if (!store.isValidServer(raw)) return false
        store.baseUrl = raw.trim()
        serverUrl = store.baseUrl
        return true
    }

    fun refresh() {
        signedIn = store.isSignedIn
        deviceId = store.deviceId
        deviceName = store.lastDeviceName
        guardianEnabled = store.guardianEnabled
        lostMode = store.lostMode
        user = store.user
        serverUrl = store.baseUrl
        themeMode = store.themeMode
        language = store.language
    }

    fun sessionEnded() {
        store.clearSession()
        refresh()
    }

    fun setGuardian(enabled: Boolean) {
        store.guardianEnabled = enabled
        guardianEnabled = enabled
    }

    fun updateAlarmDuration(seconds: Int) {
        store.alarmDuration = seconds.coerceIn(10, 300)
        alarmDuration = store.alarmDuration
    }

    fun updateAlarmSound(sound: String) {
        store.alarmSound = sound
        alarmSound = sound
    }

    fun updateAlarmVibration(enabled: Boolean) {
        store.alarmVibration = enabled
        alarmVibration = enabled
    }

    fun updateAlarmFlash(enabled: Boolean) {
        store.alarmFlash = enabled
        alarmFlash = enabled
    }

    fun markUserUpdated() {
        user = store.user
    }
}
