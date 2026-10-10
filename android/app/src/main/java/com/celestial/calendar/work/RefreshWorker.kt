package com.celestial.calendar.work

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.celestial.calendar.widgets.WidgetUpdater
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/**
 * Celestial — background refresh.
 *
 * A single inexact WorkManager pass (no exact alarms — the low-power promise):
 * a 6-hour periodic job plus a one-shot scheduled for the next midnight.
 * Each pass updates both widgets and the status-bar notification, then
 * re-schedules the next midnight pass.
 */
object RefreshScheduler {

    const val PERIODIC_NAME = "celestial_refresh_periodic"
    const val MIDNIGHT_NAME = "celestial_refresh_midnight"

    fun scheduleAll(context: Context) {
        val wm = WorkManager.getInstance(context)
        wm.enqueueUniquePeriodicWork(
            PERIODIC_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            PeriodicWorkRequestBuilder<RefreshWorker>(6, TimeUnit.HOURS).build(),
        )
        scheduleNextMidnight(context)
    }

    fun scheduleNextMidnight(context: Context) {
        val wm = WorkManager.getInstance(context)
        val delay = WidgetUpdater.millisUntilNextMidnight()
        wm.enqueueUniqueWork(
            MIDNIGHT_NAME,
            ExistingWorkPolicy.REPLACE,
            OneTimeWorkRequestBuilder<RefreshWorker>()
                .setInitialDelay(delay, TimeUnit.MILLISECONDS)
                .build(),
        )
    }
}

class RefreshWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        try {
            WidgetUpdater.updateAll(applicationContext)
        } catch (_: Exception) {
            // best effort — never crash a background pass
        }
        if (!isStopped) {
            RefreshScheduler.scheduleNextMidnight(applicationContext)
        }
        return Result.success()
    }
}

/** Re-schedule the refresh chain after boot or a system clock change. */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                RefreshScheduler.scheduleAll(context)
                WidgetUpdater.updateAll(context)
            } catch (_: Exception) {
                // best effort
            } finally {
                pending.finish()
            }
        }
    }
}
