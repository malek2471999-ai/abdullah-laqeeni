package com.abdullah.laqeeni.ui.viewmodel

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.auth.AuthRepository
import com.abdullah.laqeeni.core.network.ApiResult
import com.abdullah.laqeeni.core.network.SecurityEventDto
import com.abdullah.laqeeni.core.network.SessionDto
import com.abdullah.laqeeni.core.network.TwoFactorSetupDto
import com.abdullah.laqeeni.core.network.UserDto
import com.abdullah.laqeeni.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val loading: Boolean = true,
    val user: UserDto? = null,
    val sessions: List<SessionDto> = emptyList(),
    val events: List<SecurityEventDto> = emptyList(),
    val twoFactorSetup: TwoFactorSetupDto? = null,
    val busy: Boolean = false,
    val error: String? = null,
    val message: String? = null,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val auth: AuthRepository,
) : ViewModel() {
    var state by mutableStateOf(SettingsUiState())
        private set

    init {
        load()
    }

    fun load() {
        state = state.copy(loading = state.user == null)
        viewModelScope.launch {
            auth.me()
            when (val sessions = auth.sessions()) {
                is ApiResult.Success -> state = state.copy(
                    loading = false,
                    user = auth.currentUser,
                    sessions = sessions.data,
                )
                is ApiResult.Error -> state = state.copy(
                    loading = false,
                    user = auth.currentUser,
                    error = sessions.userMessage(context),
                )
            }
            when (val events = auth.securityEvents()) {
                is ApiResult.Success -> state = state.copy(events = events.data)
                is ApiResult.Error -> Unit
            }
        }
    }

    fun setupTwoFactor() {
        viewModelScope.launch {
            state = state.copy(busy = true, error = null)
            when (val result = auth.setupTwoFactor()) {
                is ApiResult.Success -> state = state.copy(busy = false, twoFactorSetup = result.data)
                is ApiResult.Error -> state = state.copy(
                    busy = false,
                    error = result.userMessage(context),
                )
            }
        }
    }

    fun enableTwoFactor(code: String) {
        viewModelScope.launch {
            state = state.copy(busy = true, error = null)
            when (val result = auth.enableTwoFactor(code)) {
                is ApiResult.Success -> {
                    state = state.copy(
                        busy = false,
                        twoFactorSetup = null,
                        user = auth.currentUser,
                        message = context.getString(R.string.two_factor_enabled),
                    )
                    load()
                }
                is ApiResult.Error -> state = state.copy(
                    busy = false,
                    error = result.userMessage(context),
                )
            }
        }
    }

    fun disableTwoFactor(password: String, code: String) {
        viewModelScope.launch {
            state = state.copy(busy = true, error = null)
            when (val result = auth.disableTwoFactor(password, code)) {
                is ApiResult.Success -> {
                    state = state.copy(
                        busy = false,
                        user = auth.currentUser,
                        message = context.getString(R.string.saved),
                    )
                    load()
                }
                is ApiResult.Error -> state = state.copy(
                    busy = false,
                    error = result.userMessage(context),
                )
            }
        }
    }

    fun revokeSession(id: String) {
        viewModelScope.launch {
            when (val result = auth.revokeSession(id)) {
                is ApiResult.Success -> {
                    state = state.copy(message = context.getString(R.string.session_revoked))
                    load()
                }
                is ApiResult.Error -> state = state.copy(error = result.userMessage(context))
            }
        }
    }

    fun logoutAll() {
        viewModelScope.launch {
            when (val result = auth.logoutAll()) {
                is ApiResult.Success -> {
                    state = state.copy(
                        message = context.getString(R.string.sessions_revoked),
                    )
                    load()
                }
                is ApiResult.Error -> state = state.copy(error = result.userMessage(context))
            }
        }
    }

    fun clearTwoFactorSetup() {
        state = state.copy(twoFactorSetup = null)
    }

    fun changePassword(current: String, next: String, onDone: () -> Unit) {
        viewModelScope.launch {
            state = state.copy(busy = true, error = null)
            when (val result = auth.changePassword(current, next)) {
                is ApiResult.Success -> {
                    state = state.copy(
                        busy = false,
                        message = context.getString(R.string.password_changed),
                    )
                    onDone()
                }
                is ApiResult.Error -> state = state.copy(
                    busy = false,
                    error = result.userMessage(context),
                )
            }
        }
    }

    fun deleteAccount(password: String, onDeleted: () -> Unit) {
        viewModelScope.launch {
            state = state.copy(busy = true, error = null)
            when (val result = auth.deleteAccount(password)) {
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

    fun clearMessages() {
        state = state.copy(error = null, message = null)
    }
}
