package com.abdullah.laqeeni.ui.util

import android.content.Context
import com.abdullah.laqeeni.R
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

fun relativeTime(context: Context, iso: String?): String {
    if (iso.isNullOrBlank()) return context.getString(R.string.last_seen_never)
    val instant = runCatching { Instant.parse(iso) }.getOrNull() ?: return iso
    val seconds = (System.currentTimeMillis() - instant.toEpochMilli()) / 1000
    return when {
        seconds < 60 -> context.getString(R.string.just_now)
        seconds < 3600 -> context.getString(R.string.minutes_ago, (seconds / 60).toInt())
        seconds < 86_400 -> context.getString(R.string.hours_ago, (seconds / 3600).toInt())
        else -> context.getString(R.string.days_ago, (seconds / 86_400).toInt())
    }
}

fun formatDateTime(iso: String?): String {
    if (iso.isNullOrBlank()) return "—"
    val instant = runCatching { Instant.parse(iso) }.getOrNull() ?: return iso
    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm", Locale.getDefault())
    return instant.atZone(ZoneId.systemDefault()).format(formatter)
}

fun formatDate(iso: String?): String {
    if (iso.isNullOrBlank()) return "—"
    val instant = runCatching { Instant.parse(iso) }.getOrNull() ?: return iso
    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd", Locale.getDefault())
    return instant.atZone(ZoneId.systemDefault()).format(formatter)
}

fun batteryLabel(level: Int?, charging: Boolean?): String {
    if (level == null) return "—"
    return if (charging == true) "$level% ⚡" else "$level%"
}

fun networkLabel(type: String?): String = when (type) {
    null, "" -> "—"
    "wifi" -> "Wi-Fi"
    "cellular" -> "Cellular"
    "ethernet" -> "Ethernet"
    "vpn" -> "VPN"
    "none" -> "Offline"
    else -> type.replaceFirstChar { it.uppercase() }
}
