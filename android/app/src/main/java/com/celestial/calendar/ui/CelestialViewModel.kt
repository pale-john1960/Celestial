package com.celestial.calendar.ui

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.celestial.calendar.data.AppDatabase
import com.celestial.calendar.data.ImportedEvent
import com.celestial.calendar.data.Settings
import com.celestial.calendar.data.SettingsDataStore
import com.celestial.calendar.data.ThemeMode
import com.celestial.calendar.engine.AppLocale
import com.celestial.calendar.engine.CalendarFacade
import com.celestial.calendar.engine.CalendarSystem
import com.celestial.calendar.engine.JalaliEngine
import com.celestial.calendar.engine.Jdn
import com.celestial.calendar.engine.SimpleDate
import com.celestial.calendar.engine.WeekStart
import com.celestial.calendar.events.EventInstance
import com.celestial.calendar.widgets.WidgetUpdater
import com.celestial.calendar.events.EventRepository
import com.celestial.calendar.events.SourceSettings
import com.celestial.calendar.`import`.ImportParser
import com.celestial.calendar.ntp.NtpClient
import com.celestial.calendar.statusbar.StatusBarDate

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class ViewKind { MONTH, WEEK, YEAR, DAY, AGENDA }

/**
 * Celestial — single-activity, state-driven view model (mirrors the web app's
 * Zustand store): persisted settings from DataStore, transient navigation
 * state, and an aggregated event map keyed by ISO date.
 */
class CelestialViewModel(app: Application) : AndroidViewModel(app) {

    private val store = SettingsDataStore(app)
    private val repo = EventRepository()
    private val dao = AppDatabase.get(app).importedEventDao()

    val settings: StateFlow<Settings?> =
        store.settings.stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val importedEvents: StateFlow<List<ImportedEvent>> =
        dao.observeAll()
            .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    // ---- transient navigation state ------------------------------------
    var view: ViewKind by mutableStateOf(ViewKind.MONTH)
        private set
    var navYear: Int by mutableStateOf(0)
        private set
    var navMonth: Int by mutableStateOf(0)
        private set
    var selectedIso: String? by mutableStateOf(null)
        private set
    private var navReady = false

    // ---- events ---------------------------------------------------------
    private val loadedYears = LinkedHashSet<Int>()
    private val _eventsByIso = MutableStateFlow<Map<String, List<EventInstance>>>(emptyMap())
    val eventsByIso: StateFlow<Map<String, List<EventInstance>>> = _eventsByIso.asStateFlow()

    private var refreshJob: Job? = null

    /** NTP sync status for the settings panel. */
    val ntpSyncing: MutableStateFlow<Boolean> = MutableStateFlow(false)

    init {
        viewModelScope.launch {
            settings.collect { s ->
                if (!navReady) {
                    navReady = true
                    val sd = CalendarFacade.systemDateOf(s.system, todayGregorian())
                    navYear = sd.year
                    navMonth = sd.month
                    ensureYearsInternal(gregorianYearsAround(s, sd.year, sd.month))
                }
                refreshEvents()
                // keep the status-bar date + widgets in sync with settings changes
                StatusBarDate.update(getApplication(), s)
                WidgetUpdater.updateAll(getApplication(), s)
            }
        }
        viewModelScope.launch {
            importedEvents.collect { refreshEvents() }
        }
    }

    fun todayGregorian(): SimpleDate = CalendarFacade.todayGregorian()

    fun todayIso(): String = Jdn.isoDate(todayGregorian())

    // ---- events ---------------------------------------------------------

    /** Make sure events for these Gregorian years are expanded and visible. */
    fun ensureYears(years: Collection<Int>) {
        val newYears = years.filter { it !in loadedYears }
        if (newYears.isEmpty()) return
        loadedYears.addAll(newYears)
        refreshEvents()
    }

    private suspend fun ensureYearsInternal(years: Collection<Int>) {
        loadedYears.addAll(years)
    }

    private fun gregorianYearsAround(s: Settings, year: Int, month: Int): Set<Int> {
        // the 42-cell grid can spill into the previous/next Gregorian year
        val first = CalendarFacade.systemToGregorian(s.system, year, month, 1)
        val last = Jdn.d2g(Jdn.toJdn(first) + 41)
        return setOf(first.year, last.year)
    }

    private fun refreshEvents() {
        refreshJob?.cancel()
        refreshJob = viewModelScope.launch {
            val s = settings.value ?: return@launch
            val imported = importedEvents.value
            val map = withContext(Dispatchers.Default) {
                val m = HashMap<String, MutableList<EventInstance>>()
                val years = loadedYears.sorted()
                for (inst in repo.builtinFor(years, s.sources)) {
                    m.getOrPut(inst.iso) { ArrayList() }.add(inst)
                }
                if (s.sources.imported) {
                    for (inst in repo.importedInstances(imported, loadedYears)) {
                        m.getOrPut(inst.iso) { ArrayList() }.add(inst)
                    }
                }
                for (list in m.values) list.sortBy { it.iso }
                m
            }
            _eventsByIso.value = map
        }
    }

    fun eventsFor(iso: String): List<EventInstance> = eventsByIso.value[iso] ?: emptyList()

    // ---- navigation ------------------------------------------------------

    fun setView(v: ViewKind) {
        view = v
        if (v == ViewKind.DAY && selectedIso == null) {
            selectedIso = todayIso()
        }
    }

    fun openDay(iso: String) {
        selectedIso = iso
        view = ViewKind.DAY
    }

    fun selectDay(iso: String?) {
        selectedIso = iso
    }

    fun goToSystemMonth(year: Int, month: Int) {
        navYear = year
        navMonth = month
        selectedIso = null
        view = ViewKind.MONTH
        val s = settings.value ?: return
        ensureYears(gregorianYearsAround(s, year, month))
    }

    fun shiftMonth(delta: Int) {
        val s = settings.value ?: return
        val next = CalendarFacade.shiftMonth(s.system, navYear, navMonth, delta)
        navYear = next.year
        navMonth = next.month
        selectedIso = null
        ensureYears(gregorianYearsAround(s, next.year, next.month))
    }

    /** Year navigation for the Year view (stays in system space). */
    fun shiftYear(delta: Int) {
        val s = settings.value ?: return
        if (delta == 0 || navYear + delta < 1) return
        navYear += delta
        selectedIso = null
        ensureYears(gregorianYearsAround(s, navYear, navMonth))
    }

    fun goToday() {
        val s = settings.value ?: return
        val sd = CalendarFacade.systemDateOf(s.system, todayGregorian())
        navYear = sd.year
        navMonth = sd.month
        selectedIso = null
        view = ViewKind.MONTH
        ensureYears(gregorianYearsAround(s, sd.year, sd.month))
    }

    fun selectDate(iso: String) {
        val s = settings.value ?: return
        val g = Jdn.parseIso(iso) ?: return
        val sd = CalendarFacade.systemDateOf(s.system, g)
        navYear = sd.year
        navMonth = sd.month
        selectedIso = iso
    }

    fun shiftDay(delta: Int) {
        val base = selectedIso?.let { Jdn.parseIso(it) } ?: todayGregorian()
        val next = Jdn.d2g(Jdn.toJdn(base) + delta)
        val s = settings.value ?: return
        val sd = CalendarFacade.systemDateOf(s.system, next)
        if (sd.year != navYear || sd.month != navMonth) {
            navYear = sd.year
            navMonth = sd.month
            ensureYears(gregorianYearsAround(s, sd.year, sd.month))
        }
        selectedIso = Jdn.isoDate(next)
    }

    /** Week view navigation: shift the selected day by [delta] weeks (±7 days). */
    fun shiftWeek(delta: Int) {
        shiftDay(delta * 7)
    }

    /** "This week" — reset the Week view to the week containing today. */
    fun goThisWeek() {
        val s = settings.value ?: return
        val today = todayGregorian()
        val sd = CalendarFacade.systemDateOf(s.system, today)
        navYear = sd.year
        navMonth = sd.month
        selectedIso = Jdn.isoDate(today)
        view = ViewKind.WEEK
        ensureYears(gregorianYearsAround(s, sd.year, sd.month))
    }

    // ---- settings --------------------------------------------------------

    fun setSystem(v: CalendarSystem) {
        val s = settings.value ?: return
        if (v == s.system) return
        // keep viewing the same month in the new system
        val anchor = CalendarFacade.systemToGregorian(s.system, navYear, navMonth, 1)
        val sd = CalendarFacade.systemDateOf(v, anchor)
        navYear = sd.year
        navMonth = sd.month
        ensureYears(gregorianYearsAround(s.copy(system = v), sd.year, sd.month))
        viewModelScope.launch { store.setSystem(v) }
    }

    fun setLocale(v: AppLocale) = viewModelScope.launch { store.setLocale(v) }

    fun setWeekStart(v: WeekStart) = viewModelScope.launch { store.setWeekStart(v) }

    fun setThemeMode(v: ThemeMode) = viewModelScope.launch { store.setThemeMode(v) }

    fun setSource(transform: (SourceSettings) -> SourceSettings) =
        viewModelScope.launch { store.setSource(transform) }

    fun setStatusBarDate(enabled: Boolean) {
        viewModelScope.launch {
            store.setStatusBarDate(enabled)
            val s = settings.value ?: return@launch
            if (enabled) {
                StatusBarDate.update(getApplication(), s)
            } else {
                StatusBarDate.update(getApplication(), s.copy(statusBarDate = false))
            }
        }
    }

    fun markNotifPermissionAsked() = viewModelScope.launch { store.setNotifPermissionAsked(true) }

    // ---- NTP --------------------------------------------------------------

    fun syncNtp() {
        if (ntpSyncing.value) return
        ntpSyncing.value = true
        viewModelScope.launch {
            val result = NtpClient.getOffsetMillis()
            result
                .onSuccess { store.setNtpResult(it) }
                .onFailure { store.setNtpResult(null) }
            ntpSyncing.value = false
        }
    }

    // ---- import -------------------------------------------------------------

    data class ImportOutcome(
        val imported: Int,
        val skipped: Int,
        val warnings: Int = 0,
        val ok: Boolean,
    )

    fun importFromText(fileName: String, text: String): ImportOutcome {
        val parsed = ImportParser.parseAuto(fileName, text, sourceName = fileName)
        val events = parsed.events.map {
            ImportedEvent(
                iso = it.iso,
                jalaliIso = it.jalaliIso,
                title = it.title,
                description = it.description,
                isHoliday = it.isHoliday,
                sourceName = it.sourceName,
                recurYearly = it.recurYearly,
            )
        }
        if (events.isNotEmpty()) {
            viewModelScope.launch { dao.insertAll(events) }
        }
        return ImportOutcome(events.size, parsed.errors.size, parsed.warnings.size, events.isNotEmpty())
    }

    fun clearImported() {
        viewModelScope.launch { dao.clear() }
    }

    /** Delete a single imported/manual event row (imported-events manager). */
    fun deleteImported(id: Long) {
        viewModelScope.launch { dao.deleteById(id) }
    }

    // ---- manual events + editing -------------------------------------------

    /** Row currently open in the edit dialog (null = closed). */
    private val _editingEvent = MutableStateFlow<ImportedEvent?>(null)
    val editingEvent: StateFlow<ImportedEvent?> = _editingEvent.asStateFlow()

    /** Open the edit dialog for a Room row (imported-events manager rows). */
    fun beginEdit(row: ImportedEvent) {
        _editingEvent.value = row
    }

    /** Open the edit dialog from an event card (Room row id). */
    fun beginEditImported(dbId: Long) {
        _editingEvent.value = importedEvents.value.firstOrNull { it.id == dbId }
    }

    fun cancelEdit() {
        _editingEvent.value = null
    }

    /**
     * Persist an edited row (Room update; the importedEvents flow refreshes
     * the event map automatically). The Jalali display date is recomputed
     * for the (possibly changed) Gregorian date. Editing the anchor of a
     * yearly series edits the whole series.
     */
    fun updateImported(row: ImportedEvent) {
        _editingEvent.value = null
        viewModelScope.launch {
            val g = Jdn.parseIso(row.iso)
            val fixed = if (g != null) {
                row.copy(jalaliIso = Jdn.isoDate(JalaliEngine.gregorianToJalali(g)))
            } else row
            dao.update(fixed)
        }
    }

    /**
     * Persist a user-created event (sourceName = "manual"). The imported-events
     * flow triggers the existing event refresh automatically. [color] is the
     * optional per-event color override (6-digit lowercase hex, Task 9).
     */
    fun addManualEvent(
        title: String,
        description: String,
        isHoliday: Boolean,
        iso: String,
        recurYearly: Boolean = false,
        color: String? = null,
    ) {
        val g = Jdn.parseIso(iso) ?: return
        viewModelScope.launch {
            dao.insertAll(
                listOf(
                    ImportedEvent(
                        iso = iso,
                        jalaliIso = Jdn.isoDate(JalaliEngine.gregorianToJalali(g)),
                        title = title,
                        description = description.ifBlank { null },
                        isHoliday = isHoliday,
                        sourceName = "manual",
                        recurYearly = recurYearly,
                        color = color,
                    )
                )
            )
        }
    }

    /**
     * Visible events in the next 90 days for the ICS export, plus the ANCHOR
     * instance of every yearly series (any year — the RRULE line makes the
     * consuming calendar repeat it). Expanded series instances are excluded
     * (each series exports exactly once); holidayOnly instances are excluded
     * — their text must never leave the app.
     */
    fun exportableEvents(): List<EventInstance> {
        val s = settings.value ?: return emptyList()
        val from = todayIso()
        val to = Jdn.isoDate(Jdn.d2g(Jdn.toJdn(todayGregorian()) + 90))
        val inWindow = repo.aggregate(from, to, s.sources, importedEvents.value)
            .filter { !it.holidayOnly && !it.recurring }
        val anchors = if (s.sources.imported) {
            repo.importedInstances(importedEvents.value.filter { it.recurYearly })
        } else emptyList()
        return inWindow + anchors
    }
}
