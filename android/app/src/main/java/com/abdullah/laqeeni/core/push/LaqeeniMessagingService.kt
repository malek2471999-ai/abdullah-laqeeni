package com.abdullah.laqeeni.core.push

import com.abdullah.laqeeni.core.commands.WorkScheduler
import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.core.device.DeviceRepository
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class LaqeeniMessagingService : FirebaseMessagingService() {
    @Inject lateinit var repository: DeviceRepository
    @Inject lateinit var store: SecureStore

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        if (store.deviceToken.isNullOrBlank()) return
        scope.launch { repository.registerPushToken(token) }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        if (store.deviceToken.isNullOrBlank()) return
        val type = message.data["type"]
        if (type == "COMMAND") {
            WorkScheduler.runNow(applicationContext)
        }
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
}
