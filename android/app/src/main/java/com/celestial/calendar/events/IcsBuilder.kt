package com.celestial.calendar.events

/**
 * One VEVENT payload for the ICS export (already localized by the caller).
 *
 * @param uid stable unique id — becomes `UID:<uid>@celestial`
 * @param iso Gregorian `yyyy-mm-dd` start date (inclusive)
 * @param title event name (escaped by [IcsBuilder])
 * @param description event description (may be blank)
 * @param isHoliday appends " (holiday)" to the summary
 * @param sourceLabel localized source label appended to the description
 */
data class IcsEvent(
    val uid: String,
    val iso: String,
    val title: String,
    val description: String,
    val isHoliday: Boolean,
    val sourceLabel: String,
)

/**
 * Celestial — minimal RFC 5545 ICS writer (port of the web
 * `src/lib/client/ics.ts`, output-identical).
 *
 * Pure Kotlin, no framework imports (java.lang.Math and kotlin.text are
 * default imports) — trivially unit-testable. Rules implemented:
 * - CRLF line endings throughout
 * - lines longer than 74 octets are folded (CRLF + single leading space)
 * - TEXT values escape `\ ; ,` and newlines as `\n`
 * - VEVENT: UID `<id>@celestial`, DTSTAMP now UTC (`yyyyMMddTHHmmssZ`),
 *   DTSTART/DTEND;VALUE=DATE with an exclusive end (iso + 1 day),
 *   SUMMARY `name (" (holiday)")`, DESCRIPTION `description · source label`
 */
object IcsBuilder {

    private const val CRLF = "\r\n"

    /** Serializes [events] into a VCALENDAR 2.0 document. */
    fun build(events: List<IcsEvent>, nowMillis: Long): String {
        val stamp = utcStamp(nowMillis)
        val sb = StringBuilder()
        appendFolded(sb, "BEGIN:VCALENDAR")
        appendFolded(sb, "VERSION:2.0")
        appendFolded(sb, "PRODID:-//Celestial//Calendar//EN")
        appendFolded(sb, "CALSCALE:GREGORIAN")
        for (e in events) appendEvent(sb, e, stamp)
        appendFolded(sb, "END:VCALENDAR")
        return sb.toString()
    }

    private fun appendEvent(sb: StringBuilder, e: IcsEvent, stamp: String) {
        appendFolded(sb, "BEGIN:VEVENT")
        appendFolded(sb, "UID:${e.uid}@celestial")
        appendFolded(sb, "DTSTAMP:$stamp")
        appendFolded(sb, "DTSTART;VALUE=DATE:${e.iso}")
        appendFolded(sb, "DTEND;VALUE=DATE:${isoPlusOne(e.iso)}")
        val summary = escapeText(e.title) + if (e.isHoliday) " (holiday)" else ""
        appendFolded(sb, "SUMMARY:$summary")
        appendFolded(sb, "DESCRIPTION:${descriptionOf(e)}")
        appendFolded(sb, "END:VEVENT")
    }

    private fun descriptionOf(e: IcsEvent): String {
        val desc = escapeText(e.description.trim())
        val source = escapeText(e.sourceLabel)
        return if (desc.isBlank()) source else "$desc · $source"
    }

    /** RFC 5545 TEXT escaping: backslash, semicolon, comma, newlines. */
    private fun escapeText(s: String): String = s
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")

    /** UTF-8 octet length of one code point. */
    private fun cpBytes(cp: Int): Int = when {
        cp < 0x80 -> 1
        cp < 0x800 -> 2
        cp < 0x10000 -> 3
        else -> 4
    }

    private fun utf8Len(s: String): Int {
        var n = 0
        var i = 0
        while (i < s.length) {
            val cp = s.codePointAt(i)
            n += cpBytes(cp)
            i += Character.charCount(cp)
        }
        return n
    }

    /**
     * Emits [line], folding at ≤74 UTF-8 OCTETS with CRLF + a single leading
     * space (RFC 5545 §3.1 — octets, not chars; continuation lines are " " +
     * ≤73 octets so every physical line stays ≤75 octets including the space).
     */
    private fun appendFolded(sb: StringBuilder, line: String) {
        if (utf8Len(line) <= 74) {
            sb.append(line).append(CRLF)
            return
        }
        var rest = line
        var first = true
        while (rest.isNotEmpty()) {
            val budget = if (first) 74 else 73
            var take = 0
            var len = 0
            var i = 0
            while (i < rest.length) {
                val cp = rest.codePointAt(i)
                val cl = cpBytes(cp)
                if (len + cl > budget) break
                len += cl
                take += Character.charCount(cp)
                i += Character.charCount(cp)
            }
            if (take == 0) break // unreachable (≤4-octet cps vs 73/74 budget) — safety only
            if (!first) sb.append(' ')
            sb.append(rest, 0, take).append(CRLF)
            rest = rest.substring(take)
            first = false
        }
    }

    /** `yyyy-mm-dd` + 1 day (exclusive DTEND), with month/year rollover. */
    private fun isoPlusOne(iso: String): String {
        val t = parseIso(iso) ?: return iso
        val (y, m, d) = t
        val ny: Int; val nm: Int; val nd: Int
        if (d < daysInMonth(y, m)) {
            ny = y; nm = m; nd = d + 1
        } else if (m < 12) {
            ny = y; nm = m + 1; nd = 1
        } else {
            ny = y + 1; nm = 1; nd = 1
        }
        return "%04d-%02d-%02d".format(ny, nm, nd)
    }

    private fun parseIso(iso: String): Triple<Int, Int, Int>? {
        val m = Regex("^(\\d{4,5})-(\\d{1,2})-(\\d{1,2})$").find(iso.trim()) ?: return null
        val y = m.groupValues[1].toInt()
        val mo = m.groupValues[2].toInt()
        val d = m.groupValues[3].toInt()
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
        return Triple(y, mo, d)
    }

    private fun daysInMonth(y: Int, m: Int): Int = when (m) {
        1, 3, 5, 7, 8, 10, 12 -> 31
        4, 6, 9, 11 -> 30
        2 -> if (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) 29 else 28
        else -> 30
    }

    /** Epoch millis → UTC `yyyyMMddTHHmmssZ` stamp (pure, no java.time). */
    private fun utcStamp(millis: Long): String {
        val epochDay = Math.floorDiv(millis, 86_400_000L).toInt()
        val secs = (Math.floorMod(millis, 86_400_000L) / 1000L).toInt()
        val hh = secs / 3600
        val mm = (secs % 3600) / 60
        val ss = secs % 60
        // days-since-epoch → civil date (Howard Hinnant's algorithm)
        var z = epochDay + 719468
        val era = Math.floorDiv(z, 146097)
        val doe = z - era * 146097 // [0, 146096]
        val yoe = (doe - doe / 1460 - doe / 36524 + doe / 146096) / 365 // [0, 399]
        var y = yoe + era * 400
        val doy = doe - (365 * yoe + yoe / 4 - yoe / 100) // [0, 365]
        val mp = (5 * doy + 2) / 153 // [0, 11]
        val d = doy - (153 * mp + 2) / 5 + 1 // [1, 31]
        val m = if (mp < 10) mp + 3 else mp - 9 // [1, 12]
        if (m <= 2) y++
        return "%04d%02d%02dT%02d%02d%02dZ".format(y, m, d, hh, mm, ss)
    }
}
