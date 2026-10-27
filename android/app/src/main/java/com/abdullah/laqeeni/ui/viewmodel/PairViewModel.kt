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
import com.abdullah.laqeeni.core.network.PairingResponse
import com.abdullah.laqeeni.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PairUiState(
    val loading: Boolean = false,
    val pairing: PairingResponse? = null,
    val error: String? = null,
    val linked: Boolean = false,
    val linkedDeviceName: String? = null,
)

@HiltViewModel
class PairViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val repository: DeviceRepository,
    private val store: SecureStore,
) : ViewModel() {
    var state by mutableStateOf(PairUiState())
        private set

    fun createCode() {
        if (state.loading) return
        state = state.copy(loading = true, error = null)
        viewModelScope.launch {
            when (val result = repository.createPairing()) {
                is ApiResult.Success -> state = state.copy(
                    loading = false,
                    pairing = result.data,
                )
                is ApiResult.Error -> state = state.copy(
                    loading = false,
                    error = result.userMessage(context),
                )
            }
        }
    }

    fun pair(code: String, onLinked: () -> Unit) {
        val normalized = code.trim().uppercase().filter { it.isLetterOrDigit() }
        if (normalized.length != 8) {
            state = state.copy(error = context.getString(R.string.invalid_code))
            return
        }
        if (state.loading) return
        state = state.copy(loading = true, error = null)
        viewModelScope.launch {
            when (val result = repository.pair(normalized)) {
                is ApiResult.Success -> {
                    state = state.copy(
                        loading = false,
                        linked = true,
                        linkedDeviceName = result.data.device.name,
                    )
                    onLinked()
                }
                is ApiResult.Error -> state = state.copy(
                    loading = false,
                    error = result.userMessage(context),
                )
            }
        }
    }

    fun clearError() {
        state = state.copy(error = null)
    }

    fun currentDeviceName(): String? = store.lastDeviceName
}
