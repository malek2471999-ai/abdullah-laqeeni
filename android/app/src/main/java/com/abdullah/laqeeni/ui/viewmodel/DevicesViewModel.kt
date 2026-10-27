package com.abdullah.laqeeni.ui.viewmodel

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.core.device.DeviceRepository
import com.abdullah.laqeeni.core.network.ApiResult
import com.abdullah.laqeeni.core.network.DeviceDto
import com.abdullah.laqeeni.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DevicesUiState(
    val loading: Boolean = true,
    val devices: List<DeviceDto> = emptyList(),
    val fromCache: Boolean = false,
    val error: String? = null,
    val message: String? = null,
    val busyId: String? = null,
)

@HiltViewModel
class DevicesViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val repository: DeviceRepository,
    private val store: SecureStore,
) : ViewModel() {
    var state by mutableStateOf(DevicesUiState())
        private set

    init {
        load()
    }

    fun load(silent: Boolean = false) {
        if (!silent) state = state.copy(loading = state.devices.isEmpty(), error = null)
        viewModelScope.launch {
            when (val result = repository.devices()) {
                is ApiResult.Success -> state = state.copy(
                    loading = false,
                    devices = result.data.devices,
                    fromCache = result.data.fromCache,
                    error = null,
                )
                is ApiResult.Error -> state = state.copy(
                    loading = false,
                    error = if (result.unauthorized) {
                        context.getString(R.string.session_expired)
                    } else {
                        result.userMessage(context)
                    },
                )
            }
        }
    }

    fun ring(device: DeviceDto) = act(device.id, R.string.ring_sent) {
        repository.ring(
            id = device.id,
            durationSeconds = store.alarmDuration,
            sound = store.alarmSound,
            vibration = store.alarmVibration,
            flash = store.alarmFlash,
        )
    }

    fun stop(device: DeviceDto) = act(device.id, R.string.stop_sent) {
        repository.stopRing(device.id)
    }

    fun locate(device: DeviceDto) {
        viewModelScope.launch {
            state = state.copy(busyId = device.id)
            when (val result = repository.locate(device.id)) {
                is ApiResult.Success -> {
                    state = state.copy(
                        busyId = null,
                        message = context.getString(R.string.locate_sent),
                    )
                    delay(6000)
                    load(silent = true)
                }
                is ApiResult.Error -> state = state.copy(
                    busyId = null,
                    error = result.userMessage(context),
                )
            }
        }
    }

    private fun act(deviceId: String, messageRes: Int, block: suspend () -> ApiResult<*>) {
        viewModelScope.launch {
            state = state.copy(busyId = deviceId, error = null)
            when (val result = block()) {
                is ApiResult.Success -> state = state.copy(
                    busyId = null,
                    message = context.getString(messageRes),
                )
                is ApiResult.Error -> state = state.copy(
                    busyId = null,
                    error = result.userMessage(context),
                )
            }
            delay(2500)
            load(silent = true)
        }
    }

    fun clearMessages() {
        state = state.copy(error = null, message = null)
    }
}
