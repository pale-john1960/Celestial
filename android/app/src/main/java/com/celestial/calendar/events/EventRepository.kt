package com.celestial.calendar.events

import com.celestial.calendar.data.ImportedEvent
import com.celestial.calendar.engine.Jdn
import com.celestial.calendar.engine.SimpleDate

/**
 * Celestial — event aggregation per user source toggles.
 *
 * Port of `src/lib/events/index.ts` (aggregateEvents) minus the online
 * Nager.Date layer: the Android app is offline-first (low-power promise), so
 * US/JP holidays always come from the built-in dataset.
 *
 * Religious-toggle rule (same as web): when the `persian-religious` category
 * is hidden but a rule is a legal holiday, the instance is kept with
 * [EventInstance.holidayOnly] = true — the day still renders as a day off,
 * but the event text is never exposed.
 *
 * Recurring annual events (Task 8-b, same as web 8-a): imported rows with
 * `recurYearly` are expanded into the years of the query range — the stored
 * row is the ANCHOR instance (`imp-{id}`), every other year gets a synthetic
 * instance at the same month/day (`imp-{id}-y{y}`, Feb 29 → Feb 28 in
 * non-leap years). All instances share the row's `dbId`, so deleting the row
 * kills the whole series on the next flow refresh.
 */
class EventRepository {

    /** Built-in instances for [years], filtered and adjusted per [settings]. */
    fun builtinFor(years: Collection<Int>, settings: SourceSettings): List<EventInstance> {
        val out = ArrayList<EventInstance>()
        for (y in years.sorted()) {
            for (inst in EventExpander.expandBuiltinYear(y)) {
                when (inst.category) {
                    EventCategory.INTERNATIONAL ->
                        if (settings.international) out.add(inst)
                    EventCategory.US ->
                        if (settings.us) out.add(inst)
                    EventCategory.JAPAN ->
                        if (settings.japan) out.add(inst)
                    EventCategory.PERSIAN_CULTURAL ->
                        if (settings.persianCultural) out.add(inst)
                    EventCategory.PERSIAN_NATIONAL ->
                        if (settings.persianNational) out.add(inst)
                    EventCategory.PERSIAN_RELIGIOUS ->
                        if (settings.persianReligious) {
                            out.add(inst)
                        } else if (inst.isHoliday) {
                            out.add(inst.copy(holidayOnly = true))
                        }
                    EventCategory.IMPORTED -> Unit
                }
            }
        }
        return out
    }

    /**
     * Imported (user) events as [EventInstance]s. Rows marked `recurYearly`
     * additionally expand into every [years] entry that is not the anchor's
     * year (same month/day; Feb 29 falls back to Feb 28 in non-leap years).
     */
    fun importedInstances(
        events: List<ImportedEvent>,
        years: Collection<Int> = emptySet(),
    ): List<EventInstance> {
        val out = ArrayList<EventInstance>(events.size)
        for (e in events) {
            val g = Jdn.parseIso(e.iso)
            if (g == null) {
                // defensive: unparseable row keeps the legacy fallback instance
                out.add(instanceOf(e, "imported-${e.id}:${e.iso}", e.iso, SimpleDate(1970, 1, 1), false, null))
                continue
            }
            if (!e.recurYearly) {
                out.add(instanceOf(e, "imported-${e.id}:${e.iso}", e.iso, g, false, null))
                continue
            }
            // yearly series: anchor + one instance per extra year in the range
            out.add(instanceOf(e, "imp-${e.id}", e.iso, g, true, e.iso))
            for (y in years.sorted()) {
                if (y == g.year) continue
                val day = minOf(g.day, Jdn.daysInMonth(y, g.month))
                val d = SimpleDate(y, g.month, day)
                out.add(instanceOf(e, "imp-${e.id}-y$y", Jdn.isoDate(d), d, true, e.iso))
            }
        }
        return out
    }

    private fun instanceOf(
        e: ImportedEvent,
        id: String,
        iso: String,
        g: SimpleDate,
        recurring: Boolean,
        anchorIso: String?,
    ): EventInstance {
        val manual = e.sourceName == "manual"
        return EventInstance(
            id = id,
            ruleId = "imported",
            category = EventCategory.IMPORTED,
            iso = iso,
            gregorian = g,
            isHoliday = e.isHoliday,
            emoji = if (manual) "✍️" else "📥",
            names = L10n(e.title, e.title, e.title),
            descriptions = L10n(e.description ?: "", e.description ?: "", e.description ?: ""),
            source = EventSource.IMPORTED,
            manual = manual,
            recurring = recurring,
            anchorIso = anchorIso,
            dbId = e.id,
        )
    }

    /** Aggregate everything visible in [fromIso, toIso] per [settings]. */
    fun aggregate(
        fromIso: String,
        toIso: String,
        settings: SourceSettings,
        imported: List<ImportedEvent> = emptyList(),
    ): List<EventInstance> {
        val y1 = fromIso.take(4).toInt()
        val y2 = toIso.take(4).toInt()
        val out = ArrayList<EventInstance>()
        out.addAll(builtinFor((y1..y2).toList(), settings))
        if (settings.imported) {
            for (inst in importedInstances(imported, (y1..y2).toList())) {
                if (inst.iso in fromIso..toIso) out.add(inst)
            }
        }
        out.removeAll { it.iso < fromIso || it.iso > toIso }
        out.sortBy { it.iso }
        return out
    }
}
