# Celestial — ProGuard rules

# ICU calendars are used via android.icu (platform, not bundled) — nothing to keep.

# Keep data classes used by Room / reflection-free widgets
-keepattributes *Annotation*, InnerClasses, Signature

# Room
-dontwarn androidx.room.paging.**

# kotlinx-coroutines
-dontwarn kotlinx.coroutines.**

# WorkManager
-keep class * extends androidx.work.CoroutineWorker { *; }
-keep class * extends androidx.work.Worker { *; }
