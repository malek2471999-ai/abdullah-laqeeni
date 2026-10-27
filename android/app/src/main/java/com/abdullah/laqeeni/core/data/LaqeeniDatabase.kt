package com.abdullah.laqeeni.core.data

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase

@Entity(tableName = "cached_devices")
data class CachedDeviceEntity(
    @PrimaryKey val id: String,
    val json: String,
    val updatedAt: Long,
)

@Entity(tableName = "processed_commands")
data class ProcessedCommandEntity(
    @PrimaryKey val id: String,
    val processedAt: Long,
)

@Dao
interface DeviceCacheDao {
    @Query("SELECT * FROM cached_devices ORDER BY updatedAt DESC")
    suspend fun all(): List<CachedDeviceEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(device: CachedDeviceEntity)

    @Query("DELETE FROM cached_devices WHERE id = :id")
    suspend fun delete(id: String)

    @Query("DELETE FROM cached_devices")
    suspend fun clear()
}

@Dao
interface CommandDao {
    @Query("SELECT EXISTS(SELECT 1 FROM processed_commands WHERE id = :id)")
    suspend fun isProcessed(id: String): Boolean

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun markProcessed(command: ProcessedCommandEntity)

    @Query("DELETE FROM processed_commands WHERE processedAt < :cutoff")
    suspend fun prune(cutoff: Long)
}

@Database(
    entities = [CachedDeviceEntity::class, ProcessedCommandEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class LaqeeniDatabase : RoomDatabase() {
    abstract fun deviceCacheDao(): DeviceCacheDao
    abstract fun commandDao(): CommandDao
}
