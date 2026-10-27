package com.abdullah.laqeeni.core.network

import android.content.Context
import com.abdullah.laqeeni.R

fun ApiResult.Error.userMessage(context: Context): String {
    return when {
        network -> context.getString(R.string.network_error)
        unauthorized -> context.getString(R.string.session_expired)
        !message.isNullOrBlank() -> message
        else -> context.getString(R.string.error_generic)
    }
}
