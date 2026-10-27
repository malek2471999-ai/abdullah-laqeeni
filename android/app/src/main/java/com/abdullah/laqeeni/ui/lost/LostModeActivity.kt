package com.abdullah.laqeeni.ui.lost

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.ui.theme.LaqeeniTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.delay
import javax.inject.Inject

@AndroidEntryPoint
class LostModeActivity : ComponentActivity() {
    @Inject
    lateinit var store: SecureStore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val message = intent.getStringExtra(EXTRA_MESSAGE)
            ?: store.lostMessage
            ?: getString(R.string.lost_screen_message)
        val contact = intent.getStringExtra(EXTRA_CONTACT) ?: store.contactPhone
        setContent {
            LaqeeniTheme(darkTheme = true) {
                LostScreen(
                    message = message,
                    contact = contact,
                    onCall = contact?.takeIf { it.isNotBlank() }?.let { phone ->
                        {
                            runCatching {
                                startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
                            }
                        }
                    },
                    onClose = { finish() },
                )
                LaunchedEffect(Unit) {
                    while (true) {
                        delay(2_000)
                        if (!store.lostMode) {
                            finish()
                            break
                        }
                    }
                }
            }
        }
    }

    companion object {
        const val EXTRA_MESSAGE = "message"
        const val EXTRA_CONTACT = "contact"
    }
}

@Composable
private fun LostScreen(
    message: String,
    contact: String?,
    onCall: (() -> Unit)?,
    onClose: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0C2B34), Color(0xFF071426))))
            .padding(28.dp),
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Icon(
                imageVector = Icons.Filled.Shield,
                contentDescription = null,
                tint = Color(0xFF00D69A),
                modifier = Modifier.size(88.dp),
            )
            Spacer(Modifier.height(20.dp))
            Text(
                text = stringResource(R.string.lost_screen_title),
                color = Color.White,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = message,
                color = Color(0xFFD8E5F3),
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(28.dp))
            if (!contact.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0x1A00D69A), RoundedCornerShape(18.dp))
                        .padding(18.dp),
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = stringResource(R.string.owner_contact),
                            color = Color(0xFF8FB3C9),
                            style = MaterialTheme.typography.labelMedium,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(contact, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Spacer(Modifier.height(20.dp))
            }
            if (onCall != null) {
                Button(
                    onClick = onCall,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00D69A)),
                ) {
                    Icon(Icons.Filled.Phone, contentDescription = null)
                    Spacer(Modifier.size(10.dp))
                    Text(stringResource(R.string.i_found_phone), fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(12.dp))
            }
            OutlinedButton(onClick = onClose, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.close))
            }
            Spacer(Modifier.height(16.dp))
            Text(
                text = stringResource(R.string.lost_screen_message),
                color = Color(0xFF8FA7BF),
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center,
            )
        }
    }
}
