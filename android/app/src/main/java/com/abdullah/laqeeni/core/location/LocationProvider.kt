package com.abdullah.laqeeni.core.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import androidx.core.content.ContextCompat
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationProvider @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val client by lazy { LocationServices.getFusedLocationProviderClient(context) }

    fun hasForegroundPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    fun hasBackgroundPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return true
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_BACKGROUND_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED
    }

    @SuppressLint("MissingPermission")
    suspend fun currentLocation(highAccuracy: Boolean = true): Location? {
        if (!hasForegroundPermission()) return null
        val priority = if (highAccuracy) {
            Priority.PRIORITY_HIGH_ACCURACY
        } else {
            Priority.PRIORITY_BALANCED_POWER_ACCURACY
        }
        val request = CurrentLocationRequest.Builder()
            .setPriority(priority)
            .setMaxUpdateAgeMillis(15_000)
            .setDurationMillis(20_000)
            .build()
        val token = CancellationTokenSource()
        val fresh = runCatching { client.getCurrentLocation(request, token.token).await() }.getOrNull()
        if (fresh != null) return fresh
        return runCatching { client.lastLocation.await() }.getOrNull()
    }

    @SuppressLint("MissingPermission")
    suspend fun lastLocation(): Location? {
        if (!hasForegroundPermission()) return null
        return runCatching { client.lastLocation.await() }.getOrNull()
    }

    @Suppress("DEPRECATION")
    fun isMock(location: Location): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            location.isMock
        } else {
            location.isFromMockProvider
        }
    }
}
