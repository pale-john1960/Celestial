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

enum class CalendarSystem { GREGORIAN, JALALI, IMPERIAL }

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

/** Position of a date in "system space" — year/month in the ACTIVE system. */
data class SystemDate(val year: Int, val month: Int)

object CalendarFacade {

    fun systemDateOf(system: CalendarSystem, g: SimpleDate): SystemDate = when (system) {
        CalendarSystem.GREGORIAN -> SystemDate(g.year, g.month)
        CalendarSystem.JALALI -> {
            val j = JalaliEngine.gregorianToJalali(g)
            SystemDate(j.year, j.month)
        }
        CalendarSystem.IMPERIAL -> {
            val imp = ImperialEngine.gregorianToImperial(g)
            SystemDate(imp.year, imp.month)
        }
    }

    /** Length of a system-space month (13 = Andarjah for imperial). */
    fun systemMonthLength(system: CalendarSystem, y: Int, m: Int): Int = when (system) {
        CalendarSystem.GREGORIAN -> Jdn.daysInMonth(y, m)
        CalendarSystem.JALALI -> if (m == 13) 0 else JalaliEngine.jalaliMonthLength(y, m)
        CalendarSystem.IMPERIAL -> if (m == 13) {
            // y is a SHAHANSHAI year — the Andarjah leap test runs on the
            // UNDERLYING Jalali year (y - 1180): Shahanshahi = Jalali + 1180.
            if (JalaliEngine.isJalaliLeap(y - ImperialEngine.IMPERIAL_EPOCH_OFFSET)) 6 else 5
        } else 30
    }

    /** Convert a system-space (y/m/d) to Gregorian. */
    fun systemToGregorian(system: CalendarSystem, y: Int, m: Int, d: Int): SimpleDate = when (system) {
        CalendarSystem.GREGORIAN -> SimpleDate(y, m, d)
        CalendarSystem.JALALI -> JalaliEngine.jalaliToGregorian(SimpleDate(y, m, d))
        CalendarSystem.IMPERIAL -> ImperialEngine.imperialToGregorian(ImperialDate(y, m, d))
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
        val step = if (delta > 0) 1 else -1
        var remaining = kotlin.math.abs(delta)
        while (remaining-- > 0) {
            if (system == CalendarSystem.IMPERIAL && month == 13) {
                if (step > 0) {
                    year++; month = 1
                } else {
                    month = 12
                }
            } else if (step > 0) {
                month++
                if (month > (if (system == CalendarSystem.IMPERIAL) 13 else 12)) {
                    month = 1; year++
                }
            } else {
                month--
                if (month < 1) {
                    month = if (system == CalendarSystem.IMPERIAL) 13 else 12
                    year--
                }
            }
        }
        return SystemDate(year, month)
    }

    /** The 12(13) months of a system year, as (index, first Gregorian day). */
    fun yearMonths(system: CalendarSystem, year: Int): List<Pair<Int, SimpleDate>> {
        val count = if (system == CalendarSystem.IMPERIAL) 13 else 12
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
}
