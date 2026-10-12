package com.celestial.calendar.statusbar

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.celestial.calendar.MainActivity
import com.celestial.calendar.R
import com.celestial.calendar.data.Settings
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.DateFormats

/**
 * Celestial — persistent status-bar date.
 *
 * An ongoing low-importance notification (channel "celestial_date", no sound,
 * no vibration) that always shows today's date in the active calendar system,
 * e.g. "چهارشنبه · ۲۹ مهر ۱۴۰۵ هجری شمسی · October 2026 CE". The title is
 * the FULL localized date — weekday + day + month + year + era, locale-
 * ordered (round 15; it used to be "Month Year Era" with no weekday/day).
 * It is refreshed at midnight by the WorkManager job (see
 * [com.celestial.calendar.work.RefreshWorker]) and on every settings change.
 */
object StatusBarDate {

    const val CHANNEL_ID = "celestial_date"
    const val NOTIFICATION_ID = 1001

    fun ensureChannel(context: Context) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.notif_channel_name),
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = context.getString(R.string.notif_channel_desc)
            setSound(null, null)
            enableVibration(false)
            setShowBadge(false)
        }
        nm.createNotificationChannel(channel)
    }

    fun hasNotificationPermission(context: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
                ContextCompat.checkSelfPermission(
                    context, Manifest.permission.POST_NOTIFICATIONS,
                ) == PackageManager.PERMISSION_GRANTED

    /** The two-line content of the status-bar date for [today]: the FULL
     *  localized date (weekday + day + month + year + era — round 15) as the
     *  title, the other systems as the secondary line. */
    fun buildContent(settings: Settings, today: com.celestial.calendar.engine.CelestialDate): Pair<String, String> {
        val locale = settings.locale
        // round 15: full rich localized date incl. weekday + day (all 5
        // systems handled by fullSystemDate; the day used to be missing —
        // the title read "Month Year Era"). Era comes from fullSystemDate.
        val title = DateFormats.weekdayDateText(
            locale,
            today.weekday,
            DateFormats.fullSystemDate(settings.system, locale, today, settings.royalMonthNames),
        )
        val secondary = when (settings.system) {
            CalendarSystem.GREGORIAN ->
                DateFormats.jalaliMonthYearEra(locale, today) + " · " + DateFormats.hijriMonthYearEra(locale, today)
            CalendarSystem.JALALI ->
                DateFormats.gregorianMonthYearEra(locale, today) + " · " + DateFormats.hijriMonthYearEra(locale, today)
            // round 14: the imperial family shows Gregorian + Jalali
            CalendarSystem.IMPERIAL, CalendarSystem.IMPERIAL_SOLAR, CalendarSystem.ANCIENT ->
                DateFormats.gregorianMonthYearEra(locale, today) + " · " + DateFormats.jalaliMonthYearEra(locale, today)
        }
        return title to secondary
    }

    /** Post (or cancel) the status-bar notification per the current [settings]. */
    fun update(context: Context, settings: Settings) {
        val nm = NotificationManagerCompat.from(context)
        if (!settings.statusBarDate || !hasNotificationPermission(context)) {
            nm.cancel(NOTIFICATION_ID)
            return
        }
        val today = CalendarFacade.buildCelestialDate(CalendarFacade.todayGregorian())
        val (title, text) = buildContent(settings, today)

        val contentIntent = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_celestial_white)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            // round 15: no clock time next to the rich date in the shade
            .setShowWhen(false)
            .setCategory(Notification.CATEGORY_STATUS)
            .setContentIntent(contentIntent)
            .build()

        try {
            nm.notify(NOTIFICATION_ID, notification)
        } catch (_: SecurityException) {
            // POST_NOTIFICATIONS revoked — silently skip
        }
    }
}
