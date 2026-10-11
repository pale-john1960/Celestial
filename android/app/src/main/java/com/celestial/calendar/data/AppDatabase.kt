package com.celestial.calendar.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

/**
 * Celestial — Room persistence for imported (user) events.
 *
 * Mirrors the web Prisma `ImportedEvent` model: iso + jalaliIso + title +
 * description + isHoliday + sourceName.
 */
@Entity(tableName = "imported_events")
data class ImportedEvent(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val iso: String,             // Gregorian yyyy-mm-dd
    val jalaliIso: String,       // Jalali yyyy-mm-dd (display convenience)
    val title: String,
    val description: String? = null,
    @androidx.room.ColumnInfo(name = "is_holiday") val isHoliday: Boolean = false,
    @androidx.room.ColumnInfo(name = "source_name") val sourceName: String? = null,
)

@Dao
interface ImportedEventDao {

    @Query("SELECT * FROM imported_events ORDER BY iso")
    fun observeAll(): Flow<List<ImportedEvent>>

    @Query("SELECT * FROM imported_events ORDER BY iso")
    suspend fun getAll(): List<ImportedEvent>

    @Insert
    suspend fun insertAll(events: List<ImportedEvent>)

    @Query("DELETE FROM imported_events WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM imported_events")
    suspend fun clear()

    @Query("SELECT COUNT(*) FROM imported_events")
    suspend fun count(): Int
}

@Database(entities = [ImportedEvent::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {

    abstract fun importedEventDao(): ImportedEventDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun get(context: Context): AppDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "celestial.db",
                ).fallbackToDestructiveMigration().build().also { INSTANCE = it }
            }
    }
}
