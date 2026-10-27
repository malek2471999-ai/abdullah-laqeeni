package com.abdullah.laqeeni.core.commands

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * OS-scheduled fallback used when the foreground service is stopped. The
 * minimum periodic interval allowed by Android is 15 minutes.
 */
object WorkScheduler {
    private const val PERIODIC = "laqeeni-command-sync"
    private const val IMMEDIATE = "laqeeni-command-sync-now"

    private val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    fun schedule(context: Context) {
        val request = PeriodicWorkRequestBuilder<CommandSyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            PERIODIC,
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
    }

    fun runNow(context: Context) {
        val request = OneTimeWorkRequestBuilder<CommandSyncWorker>()
            .setConstraints(constraints)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(
            IMMEDIATE,
            ExistingWorkPolicy.REPLACE,
            request,
        )
    }

    fun cancel(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(PERIODIC)
    }
}
