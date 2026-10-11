package com.celestial.calendar.data

import android.content.Context
import androidx.room.ColumnInfo
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Update
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.flow.Flow

/**
 * Celestial — Room persistence for imported (user) events.
 *
 * Mirrors the web Prisma `ImportedEvent` model: iso + jalaliIso + title +
 * description + isHoliday + sourceName, plus the recurring-yearly flag
 * (Task 8-b — schema v2, see [AppDatabase.MIGRATION_1_2]) and the per-event
 * color override (Task 9-c — schema v3, see [AppDatabase.MIGRATION_2_3]).
 */
@Entity(tableName = "imported_events")
data class ImportedEvent(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val iso: String,             // Gregorian yyyy-mm-dd (series anchor when recurring)
    val jalaliIso: String,       // Jalali yyyy-mm-dd (display convenience)
    val title: String,
    val description: String? = null,
    @ColumnInfo(name = "is_holiday") val isHoliday: Boolean = false,
    @ColumnInfo(name = "source_name") val sourceName: String? = null,
    /** Annual recurrence: the row repeats every year (Feb 29 → Feb 28 fallback). */
    @ColumnInfo(defaultValue = "0") val recurYearly: Boolean = false,
    /** Per-event color override: 6-digit lowercase hex ("#rrggbb"); null = category default. */
    val color: String? = null,
)

@Dao
interface ImportedEventDao {

    @Query("SELECT * FROM imported_events ORDER BY iso")
    fun observeAll(): Flow<List<ImportedEvent>>

    @Query("SELECT * FROM imported_events ORDER BY iso")
    suspend fun getAll(): List<ImportedEvent>

    @Insert
    suspend fun insertAll(events: List<ImportedEvent>)

    /** Full-row update by primary key (event editing). */
    @Update
    suspend fun update(event: ImportedEvent)

    @Query("DELETE FROM imported_events WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM imported_events")
    suspend fun clear()

    @Query("SELECT COUNT(*) FROM imported_events")
    suspend fun count(): Int
}

@Database(entities = [ImportedEvent::class], version = 3, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {

    abstract fun importedEventDao(): ImportedEventDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        /**
         * v1 → v2 (Task 8-b): adds the recurring-yearly flag. Column name and
         * default value match the entity exactly (`recurYearly` INTEGER NOT
         * NULL DEFAULT 0 — the Kotlin field name is the column name since no
         * @ColumnInfo name override is given). Non-destructive: existing rows
         * keep their data and default to non-recurring.
         */
        val MIGRATION_1_2: Migration = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "ALTER TABLE imported_events ADD COLUMN recurYearly INTEGER NOT NULL DEFAULT 0"
                )
            }
        }

        /**
         * v2 → v3 (Task 9-c): adds the per-event color override column.
         * Nullable TEXT with no default — NULL means "use the category
         * default color" (the Kotlin field is `String? = null` and the column
         * name `color` is the field name, matching the ALTER exactly).
         * Non-destructive: existing rows keep their data and default to NULL.
         */
        val MIGRATION_2_3: Migration = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE imported_events ADD COLUMN color TEXT")
            }
        }

        fun get(context: Context): AppDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "celestial.db",
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                    .build()
                    .also { INSTANCE = it }
            }
    }
}
