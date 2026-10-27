package com.abdullah.laqeeni.core.commands

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.abdullah.laqeeni.core.data.SecureStore
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class BootReceiver : BroadcastReceiver() {
    @Inject lateinit var store: SecureStore

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
            intent.action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            return
        }
        if (store.deviceToken.isNullOrBlank() || !store.guardianEnabled) return
        WorkScheduler.schedule(context)
        WorkScheduler.runNow(context)
        // Android 12+ may reject a foreground-service start from boot; the
        // WorkManager job above remains the reliable fallback.
        GuardianService.start(context)
    }
}
