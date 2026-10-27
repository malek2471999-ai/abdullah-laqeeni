package com.abdullah.laqeeni.core.notifications

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.abdullah.laqeeni.MainActivity
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.alarm.AlarmService
import com.abdullah.laqeeni.ui.lost.LostModeActivity

object NotificationHelper {
    const val CHANNEL_GUARDIAN = "laqeeni_guardian"
    const val CHANNEL_ALARM = "laqeeni_alarm"
    const val CHANNEL_LOST = "laqeeni_lost"
    const val CHANNEL_GENERAL = "laqeeni_general"

    const val ID_GUARDIAN = 1001
    const val ID_ALARM = 1002
    const val ID_LOST = 1003
    const val ID_COMMAND = 1004
    const val ID_MESSAGE = 1005

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        val guardian = NotificationChannel(
            CHANNEL_GUARDIAN,
            "Protection service",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Keeps the phone ready to receive recovery commands."
            setShowBadge(false)
        }
        val alarmAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        val alarm = NotificationChannel(
            CHANNEL_ALARM,
            "Ultra Find alarm",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Loud alarm, vibration and flash commands."
            setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), alarmAttributes)
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 800, 350, 800, 350)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            setBypassDnd(true)
        }
        val lost = NotificationChannel(
            CHANNEL_LOST,
            "Lost Mode",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Recovery message shown when the phone is reported lost."
            enableVibration(true)
            setShowBadge(true)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            setBypassDnd(true)
        }
        val general = NotificationChannel(
            CHANNEL_GENERAL,
            "Notifications",
            NotificationManager.IMPORTANCE_DEFAULT,
        )
        manager.createNotificationChannels(listOf(guardian, alarm, lost, general))
    }

    fun guardian(context: Context): Notification {
        val open = PendingIntent.getActivity(
            context,
            11,
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        return NotificationCompat.Builder(context, CHANNEL_GUARDIAN)
            .setSmallIcon(R.drawable.ic_stat_shield)
            .setContentTitle(context.getString(R.string.this_phone_protected))
            .setContentText(context.getString(R.string.protection_service_hint))
            .setContentIntent(open)
            .setOngoing(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    fun showLostMode(
        context: Context,
        message: String,
        contactPhone: String?,
        urgent: Boolean = true,
    ) {
        val intent = Intent(context, LostModeActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(LostModeActivity.EXTRA_MESSAGE, message)
            putExtra(LostModeActivity.EXTRA_CONTACT, contactPhone)
        }
        val fullScreen = PendingIntent.getActivity(
            context,
            21,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val builder = NotificationCompat.Builder(context, CHANNEL_LOST)
            .setSmallIcon(R.drawable.ic_stat_shield)
            .setContentTitle(context.getString(R.string.lost_screen_title))
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setContentIntent(fullScreen)
            .setFullScreenIntent(fullScreen, urgent)
        if (!contactPhone.isNullOrBlank()) {
            builder.addAction(
                R.drawable.ic_stat_call,
                context.getString(R.string.contact_owner),
                PendingIntent.getActivity(
                    context,
                    22,
                    Intent(Intent.ACTION_DIAL, android.net.Uri.parse("tel:$contactPhone")),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
                ),
            )
        }
        notify(context, ID_LOST, builder.build())
    }

    fun cancelLostMode(context: Context) {
        NotificationManagerCompat.from(context).cancel(ID_LOST)
    }

    fun showMessage(context: Context, message: String) {
        val open = PendingIntent.getActivity(
            context,
            31,
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification = NotificationCompat.Builder(context, CHANNEL_GENERAL)
            .setSmallIcon(R.drawable.ic_stat_shield)
            .setContentTitle(context.getString(R.string.recovery_message))
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        notify(context, ID_MESSAGE, notification)
    }

    fun notify(context: Context, id: Int, notification: Notification) {
        try {
            NotificationManagerCompat.from(context).notify(id, notification)
        } catch (_: SecurityException) {
            // POST_NOTIFICATIONS was denied. The foreground service still runs.
        }
    }

    fun stopAction(context: Context): PendingIntent {
        val intent = Intent(context, AlarmService::class.java).setAction(AlarmService.ACTION_STOP)
        return PendingIntent.getService(
            context,
            41,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
