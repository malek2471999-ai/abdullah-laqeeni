package com.abdullah.laqeeni.core.alarm

import android.Manifest
import android.app.Notification
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.notifications.NotificationHelper
import com.abdullah.laqeeni.ui.alarm.AlarmActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Plays the Ultra Find alarm. It never changes silent/DND settings: it uses the
 * ALARM audio usage, which Android may still mute according to user policy.
 */
class AlarmService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var torchJob: Job? = null
    private var autoStopJob: Job? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var audioManager: AudioManager? = null
    private var originalAlarmVolume: Int? = null
    private var focusRequest: AudioFocusRequest? = null
    private var cameraId: String? = null
    private var active = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.ensureChannels(this)
        audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopAlarm()
            return START_NOT_STICKY
        }
        val duration = (intent?.getIntExtra(EXTRA_DURATION, 180) ?: 180).coerceIn(1, 300)
        val sound = intent?.getStringExtra(EXTRA_SOUND) ?: "siren"
        val vibration = intent?.getBooleanExtra(EXTRA_VIBRATION, true) ?: true
        val flash = intent?.getBooleanExtra(EXTRA_FLASH, true) ?: true
        val message = intent?.getStringExtra(EXTRA_MESSAGE)
            ?: getString(R.string.alarm_screen_message)
        val contact = intent?.getStringExtra(EXTRA_CONTACT)
        startAlarm(duration, sound, vibration, flash, message, contact)
        return START_NOT_STICKY
    }

    private fun startAlarm(
        durationSeconds: Int,
        sound: String,
        vibration: Boolean,
        flash: Boolean,
        message: String,
        contact: String?,
    ) {
        if (active) cleanupPlayback()
        active = true
        startForegroundCompat(buildNotification(durationSeconds, message, contact))

        acquireWakeLock(durationSeconds)
        if (sound != "none") startSound(sound)
        if (vibration) startVibration()
        if (flash) startTorch()

        autoStopJob?.cancel()
        autoStopJob = scope.launch {
            delay(durationSeconds * 1000L)
            stopAlarm()
        }
    }

    private fun buildNotification(durationSeconds: Int, message: String, contact: String?): Notification {
        val activity = Intent(this, AlarmActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(AlarmActivity.EXTRA_MESSAGE, message)
            putExtra(AlarmActivity.EXTRA_CONTACT, contact)
            putExtra(AlarmActivity.EXTRA_DURATION, durationSeconds)
        }
        val fullScreen = android.app.PendingIntent.getActivity(
            this,
            51,
            activity,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
        )
        val builder = NotificationCompat.Builder(this, NotificationHelper.CHANNEL_ALARM)
            .setSmallIcon(R.drawable.ic_stat_shield)
            .setContentTitle(getString(R.string.alarm_screen_title))
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(fullScreen)
            .setFullScreenIntent(fullScreen, true)
            .addAction(
                R.drawable.ic_stat_shield,
                getString(R.string.alarm_stop),
                NotificationHelper.stopAction(this),
            )
        return builder.build()
    }

    private fun startForegroundCompat(notification: Notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NotificationHelper.ID_ALARM,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
            )
        } else {
            startForeground(NotificationHelper.ID_ALARM, notification)
        }
    }

    private fun startSound(sound: String) {
        val uri: Uri = when (sound) {
            "alarm" -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            "ringtone" -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            else -> Uri.parse("android.resource://$packageName/${R.raw.siren}")
        } ?: Uri.parse("android.resource://$packageName/${R.raw.siren}")

        val manager = audioManager ?: return
        originalAlarmVolume = manager.getStreamVolume(AudioManager.STREAM_ALARM)
        runCatching {
            manager.setStreamVolume(
                AudioManager.STREAM_ALARM,
                manager.getStreamMaxVolume(AudioManager.STREAM_ALARM),
                0,
            )
        }
        val attributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(attributes)
                .setOnAudioFocusChangeListener { }
                .build()
                .also { manager.requestAudioFocus(it) }
        }
        runCatching {
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(attributes)
                setDataSource(this@AlarmService, uri)
                isLooping = true
                prepare()
                start()
            }
        }.onFailure {
            mediaPlayer?.release()
            mediaPlayer = null
        }
    }

    private fun startVibration() {
        val manager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
        vibrator = manager
        if (manager?.hasVibrator() == true) {
            val pattern = longArrayOf(0, 800, 350, 800, 350, 1200, 350)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                manager.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                manager.vibrate(pattern, 0)
            }
        }
    }

    private fun startTorch() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) !=
            PackageManager.PERMISSION_GRANTED
        ) return
        val manager = getSystemService(Context.CAMERA_SERVICE) as? CameraManager ?: return
        val id = runCatching {
            manager.cameraIdList.firstOrNull { cameraId ->
                manager.getCameraCharacteristics(cameraId)
                    .get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }
        }.getOrNull() ?: return
        cameraId = id
        torchJob?.cancel()
        torchJob = scope.launch {
            var on = false
            try {
                while (isActive) {
                    on = !on
                    manager.setTorchMode(id, on)
                    delay(if (on) 380 else 320)
                }
            } catch (_: Exception) {
                // Camera in use or torch unavailable: keep the alarm running.
            } finally {
                runCatching { manager.setTorchMode(id, false) }
            }
        }
    }

    private fun acquireWakeLock(seconds: Int) {
        val power = getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return
        wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "laqeeni:alarm").apply {
            acquire(seconds * 1000L + 10_000L)
        }
    }

    private fun stopAlarm() {
        if (!active && mediaPlayer == null) {
            stopSelf()
            return
        }
        active = false
        cleanupPlayback()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun cleanupPlayback() {
        autoStopJob?.cancel()
        autoStopJob = null
        torchJob?.cancel()
        torchJob = null
        runCatching { mediaPlayer?.stop() }
        runCatching { mediaPlayer?.release() }
        mediaPlayer = null
        runCatching { vibrator?.cancel() }
        vibrator = null
        val manager = audioManager
        val original = originalAlarmVolume
        if (manager != null && original != null) {
            runCatching { manager.setStreamVolume(AudioManager.STREAM_ALARM, original, 0) }
        }
        originalAlarmVolume = null
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest?.let { audioManager?.abandonAudioFocusRequest(it) }
        }
        focusRequest = null
        wakeLock?.let { if (it.isHeld) it.release() }
        wakeLock = null
    }

    override fun onDestroy() {
        cleanupPlayback()
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        const val ACTION_START = "com.abdullah.laqeeni.action.ALARM_START"
        const val ACTION_STOP = "com.abdullah.laqeeni.action.ALARM_STOP"
        const val EXTRA_DURATION = "duration"
        const val EXTRA_SOUND = "sound"
        const val EXTRA_VIBRATION = "vibration"
        const val EXTRA_FLASH = "flash"
        const val EXTRA_MESSAGE = "message"
        const val EXTRA_CONTACT = "contact"

        fun start(
            context: Context,
            durationSeconds: Int,
            sound: String,
            vibration: Boolean,
            flash: Boolean,
            message: String,
            contact: String?,
        ) {
            val intent = Intent(context, AlarmService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_DURATION, durationSeconds)
                putExtra(EXTRA_SOUND, sound)
                putExtra(EXTRA_VIBRATION, vibration)
                putExtra(EXTRA_FLASH, flash)
                putExtra(EXTRA_MESSAGE, message)
                putExtra(EXTRA_CONTACT, contact)
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            runCatching {
                context.startService(
                    Intent(context, AlarmService::class.java).setAction(ACTION_STOP),
                )
            }
            runCatching { context.stopService(Intent(context, AlarmService::class.java)) }
        }
    }
}
