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
import com.abdullah.laqeeni.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val message: String? = null,
    val twoFactorRequired: Boolean = false,
    val challengeToken: String? = null,
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val auth: AuthRepository,
) : ViewModel() {
    var state by mutableStateOf(AuthUiState())
        private set

    fun login(email: String, password: String, onSuccess: () -> Unit) {
        if (state.loading) return
        if (email.isBlank() || password.isBlank()) {
            state = state.copy(error = context.getString(R.string.error_generic))
            return
        }
        state = AuthUiState(loading = true)
        viewModelScope.launch {
            when (val result = auth.login(email, password)) {
                is ApiResult.Success -> {
                    val data = result.data
                    if (data.twoFactorRequired && data.challengeToken != null) {
                        state = AuthUiState(
                            twoFactorRequired = true,
                            challengeToken = data.challengeToken,
                        )
                    } else if (data.accessToken != null) {
                        state = AuthUiState()
                        onSuccess()
                    } else {
                        state = AuthUiState(error = context.getString(R.string.error_generic))
                    }
                }
                is ApiResult.Error -> {
                    state = AuthUiState(error = result.userMessage(context))
                    if (result.unauthorized) Unit
                }
            }
        }
    }

    fun register(name: String, email: String, password: String, onSuccess: () -> Unit) {
        if (state.loading) return
        state = AuthUiState(loading = true)
        viewModelScope.launch {
            when (val result = auth.register(name, email, password)) {
                is ApiResult.Success -> {
                    state = AuthUiState()
                    onSuccess()
                }
                is ApiResult.Error -> state = AuthUiState(error = result.userMessage(context))
            }
        }
    }

    fun verifyTwoFactor(code: String, onSuccess: () -> Unit) {
        val challenge = state.challengeToken ?: return
        if (state.loading) return
        state = state.copy(loading = true, error = null)
        viewModelScope.launch {
            when (val result = auth.verifyTwoFactor(challenge, code.trim())) {
                is ApiResult.Success -> {
                    state = AuthUiState()
                    onSuccess()
                }
                is ApiResult.Error -> state = state.copy(
                    loading = false,
                    error = result.userMessage(context),
                )
            }
        }
    }

    fun forgotPassword(email: String) {
        if (email.isBlank()) {
            state = state.copy(error = context.getString(R.string.error_generic))
            return
        }
        viewModelScope.launch {
            when (val result = auth.forgotPassword(email)) {
                is ApiResult.Success -> state = state.copy(
                    message = context.getString(R.string.forgot_password_sent),
                )
                is ApiResult.Error -> state = state.copy(error = result.userMessage(context))
            }
        }
    }

    fun backFromTwoFactor() {
        state = AuthUiState()
    }

    fun clearMessages() {
        state = state.copy(error = null, message = null)
    }
}
