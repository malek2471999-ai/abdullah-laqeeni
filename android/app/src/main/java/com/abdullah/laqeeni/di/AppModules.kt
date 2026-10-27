package com.abdullah.laqeeni.di

import android.content.Context
import androidx.room.Room
import com.abdullah.laqeeni.core.data.CommandDao
import com.abdullah.laqeeni.core.data.DeviceCacheDao
import com.abdullah.laqeeni.core.data.LaqeeniDatabase
import com.abdullah.laqeeni.core.network.ApiProvider
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModules {
    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
        isLenient = true
    }

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): LaqeeniDatabase =
        Room.databaseBuilder(context, LaqeeniDatabase::class.java, "laqeeni.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    fun provideDeviceCache(database: LaqeeniDatabase): DeviceCacheDao = database.deviceCacheDao()

    @Provides
    fun provideCommandDao(database: LaqeeniDatabase): CommandDao = database.commandDao()
}
