package com.celestial.calendar

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.celestial.calendar.ui.CelestialApp
import com.celestial.calendar.ui.CelestialViewModel
import com.celestial.calendar.widgets.WidgetUpdater

/**
 * Celestial — single activity (state-driven views, no navigation library).
 * Handles `extra_date` intents from the home-screen month widget.
 */
class MainActivity : ComponentActivity() {

    private val viewModel: CelestialViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleDateIntent(intent)
        setContent {
            CelestialApp(viewModel)
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        handleDateIntent(intent)
    }

    private fun handleDateIntent(intent: android.content.Intent?) {
        val iso = intent?.getStringExtra(WidgetUpdater.EXTRA_DATE) ?: return
        viewModel.openDay(iso)
    }
}
