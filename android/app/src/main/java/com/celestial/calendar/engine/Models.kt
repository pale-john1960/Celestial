package com.celestial.calendar.engine

/**
 * Celestial — engine models and unified calendar facade.
 *
 * Kotlin port of `src/lib/calendar/types.ts` + `src/lib/calendar/index.ts`.
 */
data class SimpleDate(
    val year: Int,
    val month: Int, // 1-12
    val day: Int,
)

/** Persian Imperial date. Month 13 = Andarjah (epagomenal days). */
data class ImperialDate(
    val year: Int,
    val month: Int, // 1-12, 13 = Andarjah
    val day: Int,   // 1-30 (1-5/6 in Andarjah)
    val dayNameIndex: Int? = null, // 0-29 devotional day name index
)

/** Hijri (Islamic lunar) date. */
data class HijriDate(
    val year: Int,
    val month: Int, // 1-12
    val day: Int,
)

/** Full multi-calendar snapshot of one Gregorian day. */
data class CelestialDate(
    val gregorian: SimpleDate,
    val jalali: SimpleDate,
    val imperial: ImperialDate,
    val hijri: HijriDate,
    val weekday: Int, // 0 = Sunday
    val jdn: Int,
    val iso: String,
)

/** A cell of the month grid. */
data class DayCell(
    val date: CelestialDate,
    val inMonth: Boolean,
    val isToday: Boolean,
)

enum class CalendarSystem { GREGORIAN, JALALI, IMPERIAL, IMPERIAL_SOLAR, ANCIENT }

enum class AppLocale(val code: String, val isRtl: Boolean) {
    EN("en", false),
    JA("ja", false),
    FA("fa", true);

    companion object {
        fun fromCode(code: String): AppLocale = entries.firstOrNull { it.code == code } ?: EN
    }
}

/** Week start as a weekday index (0 = Sunday … 6 = Saturday). */
enum class WeekStart(val weekday: Int) {
    SUN(0),
    MON(1),
    SAT(6);

    companion object {
        fun fromWeekday(w: Int): WeekStart = entries.firstOrNull { it.weekday == w } ?: SUN
    }
}

/** Weekly day-off preference (round 14). AUTO follows the locale
 *  convention (fa → Friday; en/ja → none); the rest force a weekday. */
enum class WeekendDay(val code: String) {
    AUTO("auto"), NONE("none"), FRIDAY("friday"), SATURDAY("saturday"), SUNDAY("sunday");

    companion object {
        fun fromCode(code: String?): WeekendDay =
            entries.firstOrNull { it.code == code } ?: AUTO
    }
}

/** Position of a date in "system space" — year/month in the ACTIVE system. */
data class SystemDate(val year: Int, val month: Int)

object CalendarFacade {

    fun systemDateOf(system: CalendarSystem, g: SimpleDate): SystemDate {
        val j = JalaliEngine.gregorianToJalali(g)
        return when (system) {
            CalendarSystem.GREGORIAN -> SystemDate(g.year, g.month)
            CalendarSystem.JALALI -> SystemDate(j.year, j.month)
            // imperialSolar: Shahanshahi YEAR on the standard Jalali structure
            CalendarSystem.IMPERIAL_SOLAR ->
                SystemDate(j.year + ImperialEngine.IMPERIAL_EPOCH_OFFSET, j.month)
            // imperial + ancient share the 12×30 + Andarjah structure
            CalendarSystem.IMPERIAL, CalendarSystem.ANCIENT -> {
                val imp = ImperialEngine.gregorianToImperial(g)
                SystemDate(imp.year, imp.month)
            }
        }
    }

    /** Number of months in a system year (imperial + ancient have Andarjah = 13). */
    fun systemMonthCount(system: CalendarSystem): Int =
        if (system == CalendarSystem.IMPERIAL || system == CalendarSystem.ANCIENT) 13 else 12

    /** true for the 12×30+Andarjah Fasli systems (devotional day names). */
    fun hasAndarjah(system: CalendarSystem): Boolean =
        system == CalendarSystem.IMPERIAL || system == CalendarSystem.ANCIENT

    /**
     * Month NAME for the ACTIVE system under the royal-names preference
     * (round 14 — the ONE month-name helper, web parity):
     *  - gregorian / jalali: unchanged
     *  - imperial + imperialSolar: ancient Zoroastrian names iff [royal]
     *  - ancient: ALWAYS the ancient names
     * Month 13 (Andarjah) keeps its label in every mode.
     */
    fun systemMonthName(system: CalendarSystem, locale: AppLocale, month: Int, royal: Boolean): String {
        if (system == CalendarSystem.GREGORIAN) return I18n.gregorianMonthName(locale, month)
        val useAncient = system == CalendarSystem.ANCIENT ||
                ((system == CalendarSystem.IMPERIAL || system == CalendarSystem.IMPERIAL_SOLAR) && royal)
        if (useAncient && month in 1..12) return I18n.ancientMonthName(locale, month)
        return I18n.jalaliMonthName(locale, month) // 13 → Andarjah label
    }

    /**
     * (year, month, day) of a day in the ACTIVE system — the display triple
     * for big day numbers / month-first markers. imperial + ancient share the
     * 12×30+Andarjah structure; imperialSolar rides the Jalali structure with
     * a Shahanshahi year number.
     */
    fun systemTripleOf(system: CalendarSystem, date: CelestialDate): SimpleDate = when (system) {
        CalendarSystem.GREGORIAN -> date.gregorian
        CalendarSystem.JALALI -> date.jalali
        CalendarSystem.IMPERIAL_SOLAR -> SimpleDate(
            date.jalali.year + ImperialEngine.IMPERIAL_EPOCH_OFFSET,
            date.jalali.month,
            date.jalali.day,
        )
        CalendarSystem.IMPERIAL, CalendarSystem.ANCIENT -> SimpleDate(
            date.imperial.year, date.imperial.month, date.imperial.day,
        )
    }

    /** Length of a system-space month (13 = Andarjah for imperial/ancient). */
    fun systemMonthLength(system: CalendarSystem, y: Int, m: Int): Int = when (system) {
        CalendarSystem.GREGORIAN -> Jdn.daysInMonth(y, m)
        // imperialSolar: standard Jalali month lengths (year is Shahanshahi → y-1180)
        CalendarSystem.IMPERIAL_SOLAR ->
            if (m == 13) 0 else JalaliEngine.jalaliMonthLength(y - ImperialEngine.IMPERIAL_EPOCH_OFFSET, m)
        CalendarSystem.JALALI -> if (m == 13) 0 else JalaliEngine.jalaliMonthLength(y, m)
        // imperial + ancient: months 1-12 = 30 days; 13 = 5 (6 in Jalali leap
        // years). y is a SHAHANSHAI year — the Andarjah leap test runs on the
        // UNDERLYING Jalali year (y - 1180): Shahanshahi = Jalali + 1180.
        CalendarSystem.IMPERIAL, CalendarSystem.ANCIENT -> if (m == 13) {
            if (JalaliEngine.isJalaliLeap(y - ImperialEngine.IMPERIAL_EPOCH_OFFSET)) 6 else 5
        } else 30
    }

    /** Convert a system-space (y/m/d) to Gregorian. */
    fun systemToGregorian(system: CalendarSystem, y: Int, m: Int, d: Int): SimpleDate = when (system) {
        CalendarSystem.GREGORIAN -> SimpleDate(y, m, d)
        CalendarSystem.JALALI -> JalaliEngine.jalaliToGregorian(SimpleDate(y, m, d))
        // imperialSolar: Shahanshahi year on the standard Jalali structure
        CalendarSystem.IMPERIAL_SOLAR ->
            JalaliEngine.jalaliToGregorian(SimpleDate(y - ImperialEngine.IMPERIAL_EPOCH_OFFSET, m, d))
        // imperial + ancient share the conversion
        CalendarSystem.IMPERIAL, CalendarSystem.ANCIENT ->
            ImperialEngine.imperialToGregorian(ImperialDate(y, m, d))
    }

    /** Build the full [CelestialDate] for a Gregorian day. */
    fun buildCelestialDate(g: SimpleDate): CelestialDate {
        val jdn = Jdn.toJdn(g)
        return CelestialDate(
            gregorian = g,
            jalali = JalaliEngine.gregorianToJalali(g),
            imperial = ImperialEngine.gregorianToImperial(g),
            hijri = HijriEngine.gregorianToHijri(g),
            weekday = Jdn.jdnWeekday(jdn),
            jdn = jdn,
            iso = Jdn.isoDate(g),
        )
    }

    fun buildDayCell(g: SimpleDate, today: SimpleDate, inMonth: Boolean): DayCell =
        DayCell(
            date = buildCelestialDate(g),
            inMonth = inMonth,
            isToday = Jdn.isoDate(g) == Jdn.isoDate(today),
        )

    /** 42-cell grid (6 weeks) for month view in the active system + week start. */
    fun monthGrid(
        system: CalendarSystem,
        year: Int,
        month: Int,
        weekStart: WeekStart,
        today: SimpleDate,
    ): List<DayCell> {
        val firstG = systemToGregorian(system, year, month, 1)
        val firstJdn = Jdn.toJdn(firstG)
        val firstWeekday = Jdn.jdnWeekday(firstJdn) // 0 = Sunday
        val lead = (firstWeekday - weekStart.weekday + 7) % 7
        val gridStartJdn = firstJdn - lead
        val cells = ArrayList<DayCell>(42)
        for (i in 0 until 42) {
            val jdn = gridStartJdn + i
            val g = Jdn.fromJdn(jdn)
            val sd = systemDateOf(system, g)
            val inMonth = sd.year == year && sd.month == month
            cells.add(buildDayCell(g, today, inMonth))
        }
        return cells
    }

    /** Ordered weekday indices (0 = Sun … 6 = Sat) based on week start. */
    fun weekdayOrder(weekStart: WeekStart): List<Int> =
        (0 until 7).map { (weekStart.weekday + it) % 7 }

    /** Navigate: next/previous month in system space (handles Andarjah). */
    fun shiftMonth(system: CalendarSystem, y: Int, m: Int, delta: Int): SystemDate {
        var year = y
        var month = m
        val count = systemMonthCount(system) // 13 for imperial + ancient, else 12
        val step = if (delta > 0) 1 else -1
        var remaining = kotlin.math.abs(delta)
        while (remaining-- > 0) {
            if (month == 13) {
                // after Andarjah comes next year's month 1 (13-month systems only)
                if (step > 0) {
                    year++; month = 1
                } else {
                    month = 12
                }
            } else if (step > 0) {
                month++
                if (month > count) {
                    month = 1; year++
                }
            } else {
                month--
                if (month < 1) {
                    month = count; year--
                }
            }
        }
        return SystemDate(year, month)
    }

    /** The 12(13) months of a system year, as (index, first Gregorian day). */
    fun yearMonths(system: CalendarSystem, year: Int): List<Pair<Int, SimpleDate>> {
        val count = systemMonthCount(system)
        return (1..count).map { m -> m to systemToGregorian(system, year, m, 1) }
    }

    /** Today's Gregorian date (device local time). */
    fun todayGregorian(
        now: java.util.Calendar = java.util.Calendar.getInstance(),
    ): SimpleDate = SimpleDate(
        now.get(java.util.Calendar.YEAR),
        now.get(java.util.Calendar.MONTH) + 1,
        now.get(java.util.Calendar.DAY_OF_MONTH),
    )

    /** Imperial devotional day name (or "Andarjah N" for epagomenal days). */
    fun imperialDayName(locale: AppLocale, imp: ImperialDate): String {
        if (imp.month == 13) {
            return I18n.andarjahLabel(locale) + " " + I18n.num(locale, imp.day)
        }
        val idx = imp.dayNameIndex ?: (imp.day - 1)
        return I18n.imperialDayName(locale, idx)
    }

    /**
     * Weekly day-off resolution (round 14 — Kotlin port of the web's
     * lib/calendar/weekend.ts). AUTO follows the locale convention
     * (Persian → Friday; en/ja → none); the other codes force a weekday.
     */
    fun isWeeklyDayOff(weekendDay: WeekendDay, locale: AppLocale, weekday: Int): Boolean =
        when (weekendDay) {
            WeekendDay.FRIDAY -> weekday == 5
            WeekendDay.SATURDAY -> weekday == 6
            WeekendDay.SUNDAY -> weekday == 0
            WeekendDay.NONE -> false
            WeekendDay.AUTO -> locale == AppLocale.FA && weekday == 5
        }
}
