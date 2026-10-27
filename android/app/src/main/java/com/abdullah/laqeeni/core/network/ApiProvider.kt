package com.abdullah.laqeeni.core.network

import com.abdullah.laqeeni.core.data.SecureStore
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.concurrent.withLock
import com.abdullah.laqeeni.BuildConfig

@Singleton
class ApiProvider @Inject constructor(
    private val store: SecureStore,
    private val json: Json,
) {
    private val refreshLock = ReentrantLock()
    private val refreshClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private val authInterceptor = Interceptor { chain ->
        val request = chain.request()
        val path = request.url.encodedPath
        val builder = request.newBuilder()
        if (path.startsWith("/device/")) {
            store.deviceToken?.let { builder.header("Authorization", "Device $it") }
        } else if (!path.contains("/auth/login") &&
            !path.contains("/auth/register") &&
            !path.contains("/auth/refresh") &&
            !path.contains("/auth/2fa/verify")
        ) {
            store.accessToken?.let { builder.header("Authorization", "Bearer $it") }
        }
        chain.proceed(builder.build())
    }

    private val authenticator = Authenticator { _: Route?, response: Response ->
        if (response.request.url.encodedPath.contains("/auth/refresh")) return@Authenticator null
        val auth = response.request.header("Authorization") ?: return@Authenticator null
        if (!auth.startsWith("Bearer ")) return@Authenticator null

        refreshLock.withLock {
            val current = store.accessToken
            val requestToken = auth.removePrefix("Bearer ")
            if (current != null && current != requestToken) {
                return@withLock response.request.newBuilder()
                    .header("Authorization", "Bearer $current")
                    .build()
            }
            val refresh = store.refreshToken ?: run {
                store.markSessionExpired()
                return@withLock null
            }
            val refreshed = runBlocking(Dispatchers.IO) {
                runCatching { refreshBlocking(response.request.url.toString(), refresh) }.getOrNull()
            }
            if (refreshed?.accessToken == null || refreshed.refreshToken == null) {
                store.markSessionExpired()
                return@withLock null
            }
            store.saveSession(
                refreshed.accessToken,
                refreshed.refreshToken,
                refreshed.user ?: store.user ?: return@withLock null,
            )
            response.request.newBuilder()
                .header("Authorization", "Bearer ${refreshed.accessToken}")
                .build()
        }
    }

    private fun refreshBlocking(originalUrl: String, refreshToken: String): AuthResponse {
        val base = originalUrl.substringBefore("/auth/", originalUrl)
        val url = "${base.trimEnd('/')}/auth/refresh"
        val body = json.encodeToString(RefreshRequest.serializer(), RefreshRequest(refreshToken))
            .toRequestBody("application/json".toMediaType())
        val request = Request.Builder().url(url).post(body).build()
        refreshClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) error("Refresh failed")
            val text = response.body?.string() ?: error("Empty refresh response")
            return json.decodeFromString(AuthResponse.serializer(), text)
        }
    }

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(authInterceptor)
        .authenticator(authenticator)
        .apply {
            if (BuildConfig.DEBUG) {
                addInterceptor(HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BASIC
                    redactHeader("Authorization")
                })
            }
        }
        .build()

    @Volatile
    private var cached: Pair<String, LaqeeniApi>? = null

    fun api(): LaqeeniApi {
        val base = store.baseUrl
        cached?.let { (url, api) -> if (url == base) return api }
        return synchronized(this) {
            cached?.let { (url, api) -> if (url == base) return api }
            val api = Retrofit.Builder()
                .baseUrl(base)
                .client(client)
                .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
                .build()
                .create(LaqeeniApi::class.java)
            cached = base to api
            api
        }
    }

    fun invalidate() {
        cached = null
    }
}
