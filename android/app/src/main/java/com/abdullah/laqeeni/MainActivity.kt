package com.abdullah.laqeeni

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import com.abdullah.laqeeni.core.data.SecureStore
import com.abdullah.laqeeni.ui.LaqeeniRoot
import com.abdullah.laqeeni.ui.locale.LocaleManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.MutableStateFlow
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    @Inject lateinit var store: SecureStore

    private val pairLink = MutableStateFlow<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        LocaleManager.apply(store.language)
        pairLink.value = extractPairCode(intent)
        setContent {
            LaqeeniRoot(pairLink = pairLink)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pairLink.value = extractPairCode(intent)
    }

    private fun extractPairCode(intent: Intent?): String? {
        val data = intent?.data ?: return null
        if (data.scheme != "laqeeni" || data.host != "pair") return null
        return data.getQueryParameter("code")
    }
}
