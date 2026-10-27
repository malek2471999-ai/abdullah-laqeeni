package com.abdullah.laqeeni.core.device

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import com.abdullah.laqeeni.BuildConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

data class BatteryState(
    val level: Int?,
    val charging: Boolean?,
)

data class NetworkState(
    val connected: Boolean,
    val type: String?,
)

@Singleton
class DeviceInfoProvider @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    val deviceName: String by lazy {
        val maker = Build.MANUFACTURER.replaceFirstChar { it.uppercase() }
        val model = Build.MODEL
        if (model.lowercase().startsWith(maker.lowercase())) model else "$maker $model"
    }

    val manufacturer: String get() = Build.MANUFACTURER
    val model: String get() = Build.MODEL
    val androidVersion: String get() = Build.VERSION.RELEASE ?: Build.VERSION.SDK_INT.toString()
    val appVersion: String get() = BuildConfig.VERSION_NAME

    fun battery(): BatteryState {
        val manager = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        val level = manager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            ?.takeIf { it in 0..100 }
        val intent: Intent? = context.registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED),
        )
        val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        val charging = when (status) {
            BatteryManager.BATTERY_STATUS_CHARGING,
            BatteryManager.BATTERY_STATUS_FULL,
            -> true
            BatteryManager.BATTERY_STATUS_DISCHARGING,
            BatteryManager.BATTERY_STATUS_NOT_CHARGING,
            -> false
            else -> null
        }
        return BatteryState(level, charging)
    }

    fun network(): NetworkState {
        val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return NetworkState(false, null)
        val network = manager.activeNetwork ?: return NetworkState(false, "none")
        val capabilities = manager.getNetworkCapabilities(network) ?: return NetworkState(false, null)
        val connected = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        val type = when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN) -> "vpn"
            else -> "other"
        }
        return NetworkState(connected, type)
    }
}
