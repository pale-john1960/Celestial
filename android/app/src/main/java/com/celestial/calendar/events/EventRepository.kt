package com.celestial.calendar.events

import com.celestial.calendar.data.ImportedEvent

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

    /** Imported (user) events as [EventInstance]s. */
    fun importedInstances(events: List<ImportedEvent>): List<EventInstance> =
        events.map { e ->
            val g = com.celestial.calendar.engine.Jdn.parseIso(e.iso)
            val manual = e.sourceName == "manual"
            EventInstance(
                id = "imported-${e.id}:${e.iso}",
                ruleId = "imported",
                category = EventCategory.IMPORTED,
                iso = e.iso,
                gregorian = g ?: com.celestial.calendar.engine.SimpleDate(1970, 1, 1),
                isHoliday = e.isHoliday,
                emoji = if (manual) "✍️" else "📥",
                names = L10n(e.title, e.title, e.title),
                descriptions = L10n(e.description ?: "", e.description ?: "", e.description ?: ""),
                source = EventSource.IMPORTED,
                manual = manual,
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
            for (inst in importedInstances(imported)) {
                if (inst.iso in fromIso..toIso) out.add(inst)
            }
        }
        out.removeAll { it.iso < fromIso || it.iso > toIso }
        out.sortBy { it.iso }
        return out
    }
}
