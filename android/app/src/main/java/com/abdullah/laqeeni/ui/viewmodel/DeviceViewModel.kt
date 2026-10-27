package com.abdullah.laqeeni.ui.viewmodel

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.core.device.DeviceRepository
import com.abdullah.laqeeni.core.network.ApiResult
import com.abdullah.laqeeni.core.network.DeviceDto
import com.abdullah.laqeeni.core.network.HistoryPointDto
import com.abdullah.laqeeni.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DeviceUiState(
    val loading: Boolean = true,
    val device: DeviceDto? = null,
    val history: List<HistoryPointDto> = emptyList(),
    val historyEnabled: Boolean = false,
    val retentionDays: Int = 30,
    val error: String? = null,
    val message: String? = null,
    val busy: Boolean = false,
)

@HiltViewModel
class DeviceViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    savedStateHandle: SavedStateHandle,
    private val repository: DeviceRepository,
    private val store: SecureStore,
) : ViewModel() {
    private val deviceId: String = savedStateHandle.get<String>("deviceId") ?: ""

    var state by mutableStateOf(DeviceUiState())
        private set

    init {
        load()
    }

    fun load(silent: Boolean = false) {
        if (deviceId.isBlank()) {
            state = state.copy(loading = false, error = context.getString(R.string.error_generic))
            return
        }
        if (!silent) state = state.copy(loading = state.device == null, error = null)
        viewModelScope.launch {
            when (val result = repository.device(deviceId)) {
                is ApiResult.Success -> {
                    state = state.copy(
                        loading = false,
                        device = result.data,
                        error = null,
                        historyEnabled = result.data.locationHistoryEnabled,
                        retentionDays = result.data.historyRetentionDays,
                    )
                    loadHistory()
                }
                is ApiResult.Error -> state = state.copy(
                    loading = false,
                    error = result.userMessage(context),
                )
            }
        }
    }

    private suspend fun loadHistory() {
        when (val result = repository.history(deviceId, 100)) {
            is ApiResult.Success -> state = state.copy(
                history = result.data.points,
                historyEnabled = result.data.historyEnabled,
                retentionDays = result.data.retentionDays,
            )
            is ApiResult.Error -> Unit
        }
    }

    fun locate() = action(R.string.locate_sent, refreshAfter = true) {
        repository.locate(deviceId)
    }

    fun ring() = action(R.string.ring_sent) {
        repository.ring(
            id = deviceId,
            durationSeconds = store.alarmDuration,
            sound = store.alarmSound,
            vibration = store.alarmVibration,
            flash = store.alarmFlash,
        )
    }

    fun stop() = action(R.string.stop_sent) {
        repository.stopRing(deviceId)
    }

    fun setLostMode(enabled: Boolean, message: String?, contact: String?) =
        action(if (enabled) R.string.lost_enabled else R.string.lost_disabled) {
            repository.lostMode(deviceId, enabled, message, contact)
        }

    fun sendMessage(message: String, contact: String?) = action(R.string.message_sent) {
        repository.message(deviceId, message, contact)
    }

    fun rename(name: String) = action(R.string.saved) {
        repository.update(deviceId, name = name)
    }

    fun updateHistory(enabled: Boolean, days: Int) = action(R.string.saved) {
        repository.update(
            deviceId,
            historyEnabled = enabled,
            retentionDays = days.coerceIn(1, 365),
        )
    }

    fun delete(onDeleted: () -> Unit) {
        viewModelScope.launch {
            state = state.copy(busy = true, error = null)
            when (val result = repository.delete(deviceId)) {
                is ApiResult.Success -> {
                    state = state.copy(busy = false)
                    onDeleted()
                }
                is ApiResult.Error -> state = state.copy(
                    busy = false,
                    error = result.userMessage(context),
                )
            }
        }
    }

    private fun action(
        messageRes: Int,
        refreshAfter: Boolean = false,
        block: suspend () -> ApiResult<*>,
    ) {
        viewModelScope.launch {
            state = state.copy(busy = true, error = null)
            when (val result = block()) {
                is ApiResult.Success -> {
                    state = state.copy(
                        busy = false,
                        message = context.getString(messageRes),
                    )
                    delay(if (refreshAfter) 6000 else 900)
                    load(silent = true)
                }
                is ApiResult.Error -> state = state.copy(
                    busy = false,
                    error = result.userMessage(context),
                )
            }
        }
    }

    fun clearMessages() {
        state = state.copy(error = null, message = null)
    }
}
