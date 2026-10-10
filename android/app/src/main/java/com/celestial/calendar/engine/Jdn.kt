package com.celestial.calendar.engine

/**
 * Celestial — Gregorian <-> JDN conversions.
 *
 * Exact Kotlin port of the web engine `src/lib/calendar/jdn.ts` (Fourmilab /
 * jalaali-js derived formulas). The TS `div()` uses `~~(a/b)` (truncation
 * toward zero) — Kotlin's `Int` division already truncates, which is why the
 * port is a literal transcription.
 */
object Jdn {

    /** Truncated division (JS `~~(a/b)`). */
    fun div(a: Int, b: Int): Int = a / b

    /** Truncated remainder (JS `a - ~~(a/b)*b`). */
    fun mod(a: Int, b: Int): Int = a - (a / b) * b

    /** Gregorian y/m/d -> Julian Day Number. */
    fun g2d(gy: Int, gm: Int, gd: Int): Int {
        var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
                div(153 * mod(gm + 9, 12) + 2, 5) +
                gd -
                34840408
        d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
        return d
    }

    /** JDN -> Gregorian y/m/d. */
    fun d2g(jdn: Int): SimpleDate {
        var j = 4 * jdn + 139361631
        j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
        val i = div(mod(j, 1461), 4) * 5 + 308
        val gd = div(mod(i, 153), 5) + 1
        val gm = mod(div(i, 153), 12) + 1
        val gy = div(j, 1461) - 100100 + div(8 - gm, 6)
        return SimpleDate(gy, gm, gd)
    }

    /** Weekday index (0 = Sunday) for a JDN. */
    fun jdnWeekday(jdn: Int): Int = (jdn + 1) % 7

    fun toJdn(d: SimpleDate): Int = g2d(d.year, d.month, d.day)

    fun fromJdn(jdn: Int): SimpleDate = d2g(jdn)

    /** Number of days in a Gregorian month. */
    fun daysInMonth(gy: Int, gm: Int): Int {
        val nxt = if (gm == 12) g2d(gy + 1, 1, 1) else g2d(gy, gm + 1, 1)
        return nxt - g2d(gy, gm, 1)
    }

    fun isGregorianLeap(gy: Int): Boolean =
        (gy % 4 == 0 && gy % 100 != 0) || gy % 400 == 0

    fun gregorianMonthLengths(leap: Boolean): IntArray =
        intArrayOf(31, if (leap) 29 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)

    /** ISO `yyyy-mm-dd` formatting. */
    fun isoDate(d: SimpleDate): String {
        val p = { n: Int -> n.toString().padStart(2, '0') }
        return "${d.year}-${p(d.month)}-${p(d.day)}"
    }

    /** Parse `yyyy-m-d` (1-2 digit m/d tolerated). Returns null when invalid. */
    fun parseIso(s: String): SimpleDate? {
        val m = Regex("^(\\d{4,5})-(\\d{1,2})-(\\d{1,2})$").find(s.trim()) ?: return null
        val y = m.groupValues[1].toInt()
        val mo = m.groupValues[2].toInt()
        val d = m.groupValues[3].toInt()
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
        return SimpleDate(y, mo, d)
    }
}
