package com.celestial.calendar.events

import com.celestial.calendar.engine.HijriEngine
import com.celestial.calendar.engine.JalaliEngine
import com.celestial.calendar.engine.Jdn
import com.celestial.calendar.engine.SeasonEvent
import com.celestial.calendar.engine.SimpleDate
import com.celestial.calendar.engine.SolsticeEngine

/**
 * Celestial — rule expansion: turn [EventRule]s into concrete dated instances.
 *
 * Kotlin port of `src/lib/events/expand.ts`. Strategy: scan every Gregorian day
 * of the requested range and match rules (Gregorian / Jalali / Hijri all derive
 * from the same day scan — no reverse lunar conversion needed). Results are
 * cached in memory per Gregorian year, same as the TS engine.
 */
object EventExpander {

    private val cache = HashMap<Int, List<EventInstance>>()
    private val lock = Any()

    /** day-of-year scan bounds for a Gregorian year */
    private fun yearDays(gy: Int): List<SimpleDate> {
        val first = Jdn.g2d(gy, 1, 1)
        val last = Jdn.g2d(gy + 1, 1, 1) - 1
        val out = ArrayList<SimpleDate>(last - first + 1)
        for (j in first..last) out.add(Jdn.fromJdn(j))
        return out
    }

    private fun matchesRule(rule: EventRule, g: SimpleDate): Boolean {
        return when (rule.kind) {
            RuleKind.GREGORIAN_FIXED ->
                g.month == rule.month && g.day == rule.day
            RuleKind.GREGORIAN_NTH_WEEKDAY ->
                g.month == rule.month &&
                        g.day == JalaliEngine.nthWeekdayOfMonth(
                            g.year, g.month, rule.nth ?: 1, rule.weekday ?: 1,
                        )
            RuleKind.GREGORIAN_LAST_WEEKDAY ->
                g.month == rule.month &&
                        g.day == JalaliEngine.lastWeekdayOfMonth(
                            g.year, g.month, rule.weekday ?: 1,
                        )
            RuleKind.JALALI_FIXED -> {
                val j = JalaliEngine.gregorianToJalali(g)
                j.month == rule.month && j.day == rule.day
            }
            RuleKind.JALALI_LAST_WEEKDAY -> {
                val j = JalaliEngine.gregorianToJalali(g)
                if (j.month != rule.month) return false
                j.day == JalaliEngine.lastWeekdayOfJalaliMonth(
                    j.year, rule.month, rule.weekday ?: 2,
                )
            }
            RuleKind.HIJRI_FIXED -> {
                val h = HijriEngine.gregorianToHijri(g)
                h.month == rule.month && h.day == rule.day
            }
            RuleKind.SEASON_EVENT -> {
                // astronomical rule (e.g. 春分の日 / 秋分の日): the day whose
                // FIXED-offset timezone window contains the solar-longitude
                // event instant of g's year. month/day are informational seeds.
                val target = rule.seasonTarget ?: 0
                val event = when (target) {
                    0 -> SeasonEvent.MAR_EQUINOX
                    90 -> SeasonEvent.JUN_SOLSTICE
                    180 -> SeasonEvent.SEP_EQUINOX
                    else -> SeasonEvent.DEC_SOLSTICE
                }
                val info = SolsticeEngine.eventsOfYear(g.year)
                    .firstOrNull { it.event == event } ?: return false
                // days-WEST offset of a fixed tz (posix sign): JST (+540 east) → −540/1440
                val off = -(rule.tzOffsetMin ?: 0) / 1440.0
                val jdn = Jdn.g2d(g.year, g.month, g.day)
                info.jd >= jdn - 0.5 + off && info.jd < jdn + 0.5 + off
            }
        }
    }

    private fun toInstance(rule: EventRule, g: SimpleDate): EventInstance = EventInstance(
        id = "${rule.id}:${Jdn.isoDate(g)}",
        ruleId = rule.id,
        category = rule.category,
        iso = Jdn.isoDate(g),
        gregorian = g,
        isHoliday = rule.isHoliday,
        emoji = rule.emoji,
        names = rule.names,
        descriptions = rule.descriptions,
        source = EventSource.BUILTIN,
    )

    /** Expand ALL builtin rules for a Gregorian year (cached). */
    fun expandBuiltinYear(gy: Int): List<EventInstance> {
        cache[gy]?.let { return it }
        synchronized(lock) {
            cache[gy]?.let { return it }
            val out = ArrayList<EventInstance>()
            for (g in yearDays(gy)) {
                for (rule in RuleDataset.allBuiltinRules) {
                    if (matchesRule(rule, g)) out.add(toInstance(rule, g))
                }
            }
            out.sortBy { it.iso }
            cache[gy] = out
            return out
        }
    }

    /** Instances whose date falls within [fromIso, toIso] (inclusive). */
    fun expandBuiltinRange(fromIso: String, toIso: String): List<EventInstance> {
        val y1 = fromIso.take(4).toInt()
        val y2 = toIso.take(4).toInt()
        val out = ArrayList<EventInstance>()
        for (y in y1..y2) {
            for (inst in expandBuiltinYear(y)) {
                if (inst.iso >= fromIso && inst.iso <= toIso) out.add(inst)
            }
        }
        out.sortBy { it.iso }
        return out
    }

    /** Drop the in-memory cache (e.g. after a settings change affecting rules). */
    fun clearCache() {
        synchronized(lock) { cache.clear() }
    }
}
