package com.abdullah.laqeeni.core.commands

import android.Manifest
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.core.device.DeviceRepository
import com.abdullah.laqeeni.core.location.LocationProvider
import com.abdullah.laqeeni.core.network.ApiResult
import com.abdullah.laqeeni.core.notifications.NotificationHelper
import com.abdullah.laqeeni.core.push.PushRegistrar
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Foreground protection service used by the phone that may get lost.
 *
 * It polls the authenticated device endpoint every 20 seconds, reports a
 * heartbeat periodically, and uploads location according to the user's
 * history consent. Android can still stop this service; the 15-minute
 * WorkManager fallback and optional FCM push keep recovery possible.
 */
@AndroidEntryPoint
class GuardianService : Service() {
    @Inject lateinit var processor: CommandProcessor
    @Inject lateinit var repository: DeviceRepository
    @Inject lateinit var store: SecureStore
    @Inject lateinit var locationProvider: LocationProvider
    @Inject lateinit var pushRegistrar: PushRegistrar

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var loop: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.ensureChannels(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            store.guardianEnabled = false
            stopSelf()
            return START_NOT_STICKY
        }
        startForegroundCompat().let { if (!it) return START_NOT_STICKY }
        if (loop?.isActive != true) {
            loop = scope.launch { runLoop() }
        }
        return START_STICKY
    }
    private suspend fun runLoop() {
        if (store.deviceToken.isNullOrBlank()) {
            stopSelf()
            return
        }
        pushRegistrar.register()
        var tick = 0
        while (scope.isActive) {
            if (!store.guardianEnabled || store.deviceToken.isNullOrBlank()) break
            val result = processor.sync()

            if (tick % 9 == 0) {
                repository.heartbeat()
            }
            if (tick % 3 == 0) {
                val interval = if (store.lostMode) 1 else 3
                if (tick % (3 * interval) == 0 && locationProvider.hasForegroundPermission()) {
                    val location = locationProvider.currentLocation(highAccuracy = store.lostMode)
                    if (location != null) {
                        when (val posted = repository.postLocation(location, store.lostMode)) {
                            is ApiResult.Success -> Unit
                            is ApiResult.Error -> if (posted.unauthorized) break
                        }
                    }
                }
            }
            if (result.ok) tick++
            delay(if (result.ok) 20_000L else 45_000L)
        }
        stopSelf()
    }

    private fun startForegroundCompat(): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED
        val locationGranted = fine || coarse
        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (locationGranted) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION or
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            } else {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            }
        } else {
            0
        }
        return runCatching {
            ServiceCompat.startForeground(
                this,
                NotificationHelper.ID_GUARDIAN,
                NotificationHelper.guardian(this),
                type,
            )
        }.onFailure {
            stopSelf()
        }.isSuccess
    }

    override fun onDestroy() {
        loop?.cancel()
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        const val ACTION_START = "com.abdullah.laqeeni.action.GUARDIAN_START"
        const val ACTION_STOP = "com.abdullah.laqeeni.action.GUARDIAN_STOP"

        fun start(context: Context) {
            val intent = Intent(context, GuardianService::class.java).setAction(ACTION_START)
            runCatching { ContextCompat.startForegroundService(context, intent) }
        }

        fun stop(context: Context) {
            runCatching { context.stopService(Intent(context, GuardianService::class.java)) }
        }
    }
}
