package com.celestial.calendar

import android.app.Application
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.celestial.calendar.data.SettingsDataStore
import com.celestial.calendar.ntp.NtpClient
import com.celestial.calendar.statusbar.StatusBarDate
import com.celestial.calendar.work.RefreshScheduler
import com.celestial.calendar.widgets.WidgetUpdater
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

/**
 * Celestial — Application class.
 *
 * On start: creates the status-bar notification channel, posts the persistent
 * date notification when enabled, schedules the low-power WorkManager refresh
 * chain, and (when online) runs a background NTP sync.
 */
class CelestialApplication : Application() {

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onCreate() {
        super.onCreate()

        StatusBarDate.ensureChannel(this)
        RefreshScheduler.scheduleAll(this)

        val store = SettingsDataStore(this)
        appScope.launch {
            val settings = store.settings.first()
            // status-bar date (guarded by POST_NOTIFICATIONS on API 33+)
            if (settings.statusBarDate) {
                StatusBarDate.update(this@CelestialApplication, settings)
            }
            // NTP sync on open when online
            if (isOnline()) {
                val result = NtpClient.getOffsetMillis()
                result.onSuccess { offset ->
                    store.setNtpResult(offset)
                    // refresh the notification in case the date rolled over
                    WidgetUpdater.updateAll(this@CelestialApplication)
                }
            }
        }
    }

    private fun isOnline(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
