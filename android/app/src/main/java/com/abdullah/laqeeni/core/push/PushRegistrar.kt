package com.abdullah.laqeeni.core.push

import android.content.Context
import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.core.device.DeviceRepository
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * FCM is optional. Without google-services.json Firebase never initialises and
 * this class exits quietly; authenticated polling remains the transport.
 */
@Singleton
class PushRegistrar @Inject constructor(
    @ApplicationContext private val context: Context,
    private val repository: DeviceRepository,
    private val store: SecureStore,
) {
    @Volatile private var lastRegistered: String? = null

    suspend fun register() {
        if (store.deviceToken.isNullOrBlank()) return
        if (FirebaseApp.getApps(context).isEmpty()) return
        val token = runCatching { FirebaseMessaging.getInstance().token.await() }.getOrNull()
            ?: return
        if (token == lastRegistered) return
        when (repository.registerPushToken(token)) {
            is com.abdullah.laqeeni.core.network.ApiResult.Success -> lastRegistered = token
            is com.abdullah.laqeeni.core.network.ApiResult.Error -> Unit
        }
    }
}
