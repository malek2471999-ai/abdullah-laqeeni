package com.abdullah.laqeeni.core.network

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

sealed interface ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>
    data class Error(
        val message: String? = null,
        val code: Int? = null,
        val unauthorized: Boolean = false,
        val network: Boolean = false,
    ) : ApiResult<Nothing>
}

private val errorJson = Json { ignoreUnknownKeys = true }

fun parseApiError(body: String?): String? {
    if (body.isNullOrBlank()) return null
    return runCatching {
        val root = errorJson.parseToJsonElement(body).jsonObject
        when (val message = root["message"]) {
            is JsonPrimitive -> message.content
            is JsonArray -> message.joinToString(", ") { element: JsonElement ->
                (element as? JsonPrimitive)?.content ?: element.toString()
            }
            else -> null
        }
    }.getOrNull()
}

suspend fun <T> safeApi(block: suspend () -> T): ApiResult<T> {
    return try {
        ApiResult.Success(block())
    } catch (e: HttpException) {
        val body = runCatching { e.response()?.errorBody()?.string() }.getOrNull()
        ApiResult.Error(
            message = parseApiError(body),
            code = e.code(),
            unauthorized = e.code() == 401,
        )
    } catch (e: UnknownHostException) {
        ApiResult.Error(network = true)
    } catch (e: SocketTimeoutException) {
        ApiResult.Error(network = true)
    } catch (e: IOException) {
        ApiResult.Error(network = true)
    } catch (e: Exception) {
        ApiResult.Error(message = e.message)
    }
}
