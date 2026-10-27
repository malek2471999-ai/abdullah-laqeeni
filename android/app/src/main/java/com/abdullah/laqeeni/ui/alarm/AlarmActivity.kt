package com.abdullah.laqeeni.ui.alarm

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.alarm.AlarmService
import com.abdullah.laqeeni.ui.theme.LaqeeniTheme

class AlarmActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() = Unit
        })
        val message = intent.getStringExtra(EXTRA_MESSAGE)
            ?: getString(R.string.alarm_screen_message)
        val contact = intent.getStringExtra(EXTRA_CONTACT)
        setContent {
            LaqeeniTheme(darkTheme = true) {
                AlarmScreen(
                    message = message,
                    contact = contact,
                    onStop = {
                        AlarmService.stop(this)
                        finishAndRemoveTask()
                    },
                )
            }
        }
    }

    companion object {
        const val EXTRA_MESSAGE = "message"
        const val EXTRA_CONTACT = "contact"
        const val EXTRA_DURATION = "duration"
    }
}

@Composable
private fun AlarmScreen(message: String, contact: String?, onStop: () -> Unit) {
    val context = LocalContext.current
    val transition = rememberInfiniteTransition(label = "alarmPulse")
    val pulse by transition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(tween(700), RepeatMode.Reverse),
        label = "pulse",
    )
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    listOf(Color(0xFF3A0B12), Color(0xFF071426)),
                ),
            )
            .padding(28.dp),
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .alpha((pulse - 0.8f).coerceIn(0.2f, 0.7f))
                    .clip(CircleShape)
                    .background(Color(0x33FF4655)),
            )
            Icon(
                imageVector = Icons.Filled.Warning,
                contentDescription = null,
                tint = Color(0xFFFF4655),
                modifier = Modifier.size(92.dp),
            )
            Spacer(Modifier.height(20.dp))
            Text(
                text = stringResource(R.string.alarm_screen_title),
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 3.sp,
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = message,
                color = Color.White,
                style = MaterialTheme.typography.headlineSmall,
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = stringResource(R.string.alarm_will_stop),
                color = Color(0xFFB9C7D8),
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(36.dp))
            if (!contact.isNullOrBlank()) {
                Button(
                    onClick = {
                        runCatching {
                            context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$contact")))
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00D69A)),
                ) {
                    Icon(Icons.Filled.Phone, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text(stringResource(R.string.contact_owner))
                }
                Spacer(Modifier.height(12.dp))
            }
            Button(
                onClick = onStop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(58.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF4655)),
            ) {
                Text(stringResource(R.string.alarm_stop), fontWeight = FontWeight.Bold)
            }
        }
    }
}
