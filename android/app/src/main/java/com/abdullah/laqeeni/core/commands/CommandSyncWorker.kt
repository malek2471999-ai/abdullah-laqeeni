package com.abdullah.laqeeni.core.commands

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.abdullah.laqeeni.core.data.SecureStore
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class CommandSyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted params: WorkerParameters,
    private val processor: CommandProcessor,
    private val store: SecureStore,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        if (store.deviceToken.isNullOrBlank() || !store.guardianEnabled) {
            return Result.success()
        }
        val result = processor.sync()
        return if (result.ok) Result.success() else Result.retry()
    }
}
