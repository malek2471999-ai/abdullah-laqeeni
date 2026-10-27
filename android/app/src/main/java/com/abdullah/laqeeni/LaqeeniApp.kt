package com.abdullah.laqeeni

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.abdullah.laqeeni.core.notifications.NotificationHelper
import dagger.hilt.android.HiltAndroidApp
import org.maplibre.android.MapLibre
import javax.inject.Inject

@HiltAndroidApp
class LaqeeniApp : Application(), Configuration.Provider {
    @Inject lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .setMinimumLoggingLevel(if (BuildConfig.DEBUG) android.util.Log.DEBUG else android.util.Log.INFO)
            .build()

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.ensureChannels(this)
        runCatching { MapLibre.getInstance(this) }
    }
}
