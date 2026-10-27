package com.abdullah.laqeeni.ui.locale

import android.content.Context
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat

object LocaleManager {
    fun apply(tag: String) {
        val locales = if (tag == "system" || tag.isBlank()) {
            LocaleListCompat.getEmptyLocaleList()
        } else {
            LocaleListCompat.forLanguageTags(tag)
        }
        if (AppCompatDelegate.getApplicationLocales() != locales) {
            AppCompatDelegate.setApplicationLocales(locales)
        }
    }

    fun currentTag(context: Context): String = context.resources.configuration.locales[0]?.language
        ?: "en"
}
