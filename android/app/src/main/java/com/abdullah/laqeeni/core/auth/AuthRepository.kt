package com.abdullah.laqeeni.core.auth

import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.core.network.ApiProvider
import com.abdullah.laqeeni.core.network.ApiResult
import com.abdullah.laqeeni.core.network.AuthResponse
import com.abdullah.laqeeni.core.network.ChangePasswordRequest
import com.abdullah.laqeeni.core.network.CodeRequest
import com.abdullah.laqeeni.core.network.DeleteAccountRequest
import com.abdullah.laqeeni.core.network.ForgotPasswordRequest
import com.abdullah.laqeeni.core.network.LoginRequest
import com.abdullah.laqeeni.core.network.RefreshRequest
import com.abdullah.laqeeni.core.network.RegisterRequest
import com.abdullah.laqeeni.core.network.SecurityEventDto
import com.abdullah.laqeeni.core.network.SessionDto
import com.abdullah.laqeeni.core.network.TwoFactorDisableRequest
import com.abdullah.laqeeni.core.network.TwoFactorRequest
import com.abdullah.laqeeni.core.network.TwoFactorSetupDto
import com.abdullah.laqeeni.core.network.UserDto
import com.abdullah.laqeeni.core.network.safeApi
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiProvider: ApiProvider,
    private val store: SecureStore,
) {
    val currentUser: UserDto? get() = store.user
    val isSignedIn: Boolean get() = store.isSignedIn

    suspend fun login(email: String, password: String): ApiResult<AuthResponse> {
        val result = safeApi { apiProvider.api().login(LoginRequest(email.trim(), password)) }
        if (result is ApiResult.Success && result.data.accessToken != null) {
            persist(result.data)
        }
        return result
    }

    suspend fun register(name: String, email: String, password: String): ApiResult<AuthResponse> {
        val result = safeApi {
            apiProvider.api().register(RegisterRequest(name.trim(), email.trim(), password))
        }
        if (result is ApiResult.Success && result.data.accessToken != null) {
            persist(result.data)
        }
        return result
    }

    suspend fun verifyTwoFactor(challengeToken: String, code: String): ApiResult<AuthResponse> {
        val result = safeApi {
            apiProvider.api().verifyTwoFactor(TwoFactorRequest(challengeToken, code))
        }
        if (result is ApiResult.Success && result.data.accessToken != null) {
            persist(result.data)
        }
        return result
    }

    suspend fun refresh(): Boolean {
        val token = store.refreshToken ?: return false
        val result = safeApi { apiProvider.api().refresh(RefreshRequest(token)) }
        return if (result is ApiResult.Success && result.data.accessToken != null) {
            persist(result.data)
            true
        } else {
            false
        }
    }

    suspend fun me(): ApiResult<UserDto> {
        val result = safeApi { apiProvider.api().me() }
        if (result is ApiResult.Success) store.user = result.data
        return result
    }

    suspend fun logout() {
        runCatching { apiProvider.api().logout() }
        store.clearSession()
    }

    suspend fun logoutAll(): ApiResult<Unit> {
        val result = safeApi { apiProvider.api().logoutAll() }
        // The server keeps the current session and revokes every other session,
        // so the local session must stay intact.
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Error -> result
        }
    }

    suspend fun sessions(): ApiResult<List<SessionDto>> = safeApi { apiProvider.api().sessions() }

    suspend fun revokeSession(id: String): ApiResult<Unit> {
        val result = safeApi { apiProvider.api().revokeSession(id) }
        return if (result is ApiResult.Success) ApiResult.Success(Unit) else result as ApiResult.Error
    }

    suspend fun forgotPassword(email: String): ApiResult<Unit> {
        val result = safeApi { apiProvider.api().forgotPassword(ForgotPasswordRequest(email.trim())) }
        return if (result is ApiResult.Success) ApiResult.Success(Unit) else result as ApiResult.Error
    }

    suspend fun changePassword(current: String, next: String): ApiResult<Unit> {
        val result = safeApi {
            apiProvider.api().changePassword(ChangePasswordRequest(current, next))
        }
        return if (result is ApiResult.Success) ApiResult.Success(Unit) else result as ApiResult.Error
    }

    suspend fun deleteAccount(password: String): ApiResult<Unit> {
        val result = safeApi { apiProvider.api().deleteAccount(DeleteAccountRequest(password)) }
        if (result is ApiResult.Success) {
            store.clearSession()
            return ApiResult.Success(Unit)
        }
        return result as ApiResult.Error
    }

    suspend fun securityEvents(): ApiResult<List<SecurityEventDto>> =
        safeApi { apiProvider.api().securityEvents() }

    suspend fun setupTwoFactor(): ApiResult<TwoFactorSetupDto> =
        safeApi { apiProvider.api().setupTwoFactor() }

    suspend fun enableTwoFactor(code: String): ApiResult<Unit> {
        val result = safeApi { apiProvider.api().enableTwoFactor(CodeRequest(code)) }
        return if (result is ApiResult.Success) {
            store.user = store.user?.copy(twoFactorEnabled = true)
            ApiResult.Success(Unit)
        } else {
            result as ApiResult.Error
        }
    }

    suspend fun disableTwoFactor(password: String, code: String): ApiResult<Unit> {
        val result = safeApi {
            apiProvider.api().disableTwoFactor(TwoFactorDisableRequest(password, code))
        }
        return if (result is ApiResult.Success) {
            store.user = store.user?.copy(twoFactorEnabled = false)
            ApiResult.Success(Unit)
        } else {
            result as ApiResult.Error
        }
    }

    fun updateServer(raw: String): Boolean {
        if (!store.isValidServer(raw)) return false
        store.baseUrl = raw
        apiProvider.invalidate()
        return true
    }

    val serverUrl: String get() = store.baseUrl

    private fun persist(response: AuthResponse) {
        val access = response.accessToken ?: return
        val refresh = response.refreshToken ?: return
        val user = response.user ?: return
        store.saveSession(access, refresh, user)
    }
}
