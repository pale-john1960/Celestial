package com.celestial.calendar.`import`

import com.celestial.calendar.engine.JalaliEngine
import com.celestial.calendar.engine.Jdn
import com.celestial.calendar.engine.SimpleDate
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

/**
 * Celestial — offline event import parsers (JSON / TXT / CSV / ICS).
 *
 * Kotlin port of `src/lib/import/parse.ts` (+ the web 8-a `parseIcs`).
 * Auto-detects Jalali vs Gregorian dates: years < 1600 -> Jalali, >= 1600 ->
 * Gregorian (explicit `calendar` field wins). Persian digits ۰-۹ are
 * normalized. JSON is parsed via org.json; CSV supports quoted fields (""
 * escapes). ICS (RFC 5545) files are unfolded, VEVENTs parsed for
 * DTSTART/DTEND/SUMMARY/DESCRIPTION/RRULE with multi-day expansion (≤ 30
 * days) and FREQ=YEARLY → recurYearly.
 */
object ImportParser {

    data class ImportedEventInput(
        val iso: String,
        val jalaliIso: String,
        val title: String,
        val description: String? = null,
        val isHoliday: Boolean = false,
        val sourceName: String? = null,
        val recurYearly: Boolean = false,
    )

    data class ParsedImportResult(
        val events: List<ImportedEventInput>,
        val errors: List<String>,
        val warnings: List<String> = emptyList(),
    )

    private val faDigits = "۰۱۲۳۴۵۶۷۸۹"

    private fun resolveDate(raw: String, calendar: String?): SimpleDate? {
        val s = raw.trim().map { c -> val i = faDigits.indexOf(c); if (i >= 0) ('0' + i) else c }
            .joinToString("")
        val m = Regex("^(\\d{3,5})[-/.](\\d{1,2})[-/.](\\d{1,2})$").find(s) ?: return null
        var y = m.groupValues[1].toInt()
        val mo = m.groupValues[2].toInt()
        val d = m.groupValues[3].toInt()
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
        var cal = calendar?.lowercase()
        if (cal == null) cal = if (y < 1600) "jalali" else "gregorian"
        if (cal == "jalali" || cal == "shamsi" || cal == "persian") {
            if (y > 1600) y -= 621 // tolerate gregorian-looking jalali input with explicit calendar
            return JalaliEngine.jalaliToGregorian(SimpleDate(y, mo, d))
        }
        return SimpleDate(y, mo, d)
    }

    private fun pushEvent(
        out: MutableList<ImportedEventInput>,
        errors: MutableList<String>,
        line: Int,
        dateRaw: String,
        title: String?,
        description: String?,
        isHoliday: Boolean,
        calendar: String?,
        sourceName: String?,
        recurYearly: Boolean = false,
    ) {
        val g = resolveDate(dateRaw, calendar)
        if (g == null) {
            errors.add("Line $line: invalid date \"$dateRaw\"")
            return
        }
        if (title.isBlank()) {
            errors.add("Line $line: missing title")
            return
        }
        out.add(
            ImportedEventInput(
                iso = Jdn.isoDate(g),
                jalaliIso = Jdn.isoDate(JalaliEngine.gregorianToJalali(g)),
                title = title.trim(),
                description = description?.trim()?.takeIf { it.isNotEmpty() },
                isHoliday = isHoliday,
                sourceName = sourceName,
                recurYearly = recurYearly,
            )
        )
    }

    fun parseJsonImport(text: String, sourceName: String? = null): ParsedImportResult {
        val out = ArrayList<ImportedEventInput>()
        val errors = ArrayList<String>()
        val arr: JSONArray = try {
            text.trim().let {
                if (it.startsWith("{")) {
                    JSONObject(it).optJSONArray("events")
                        ?: return ParsedImportResult(emptyList(), listOf("JSON must be an array of events (or { \"events\": [...] })"))
                } else {
                    JSONArray(it)
                }
            }
        } catch (e: JSONException) {
            return ParsedImportResult(emptyList(), listOf("Invalid JSON: ${e.message}"))
        }
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i)
            if (o == null) {
                errors.add("Item ${i + 1}: not an object")
                continue
            }
            val dateRaw = strOf(o, "date", "تاریخ")
            val title = strOf(o, "title", "name", "عنوان")
            val description = strOf(o, "description", "desc", "توضیحات")
            val isHoliday = o.optBoolean("isHoliday", false) ||
                    o.optBoolean("holiday", false) ||
                    o.optBoolean("day off", false)
            val recurYearly = o.optBoolean("recurYearly", false) ||
                    o.optBoolean("yearly", false)
            val calendar = o.optString("calendar").takeIf { it.isNotBlank() }
            pushEvent(out, errors, i + 1, dateRaw, title, description, isHoliday, calendar, sourceName, recurYearly)
        }
        return ParsedImportResult(out, errors)
    }

    private fun strOf(o: JSONObject, vararg keys: String): String {
        for (k in keys) {
            val v = o.optString(k, "")
            if (v.isNotBlank()) return v
        }
        return ""
    }

    fun parseTxtImport(text: String, sourceName: String? = null): ParsedImportResult {
        val out = ArrayList<ImportedEventInput>()
        val errors = ArrayList<String>()
        val lines = text.split(Regex("\\r?\\n"))
        for ((idx, line) in lines.withIndex()) {
            val lineNo = idx + 1
            val t = line.trim()
            if (t.isEmpty() || t.startsWith("#") || t.startsWith("//")) continue
            // format: date | title [| description] [| holiday?/category?]
            val parts = t.split("|").map { p -> p.trim() }
            if (parts.size < 2) {
                errors.add("Line $lineNo: expected \"date | title [| description]\"")
                continue
            }
            val dateRaw = parts[0]
            val title = parts[1]
            val description = parts.getOrNull(2)
            val extra = parts.getOrNull(3) ?: ""
            val isHoliday = Regex("^(holiday|تعطیل|true|1)$", RegexOption.IGNORE_CASE).matches(extra)
            // trailing `yearly` column (backward compatible — 4th field stays holiday)
            val yearlyRaw = parts.getOrNull(4) ?: ""
            val recurYearly = Regex("^(yearly|recur|true|1|yes)$", RegexOption.IGNORE_CASE).matches(yearlyRaw)
            pushEvent(out, errors, lineNo, dateRaw, title, description, isHoliday, null, sourceName, recurYearly)
        }
        return ParsedImportResult(out, errors)
    }

    fun parseCsvImport(text: String, sourceName: String? = null): ParsedImportResult {
        val out = ArrayList<ImportedEventInput>()
        val errors = ArrayList<String>()
        // proper CSV parsing with quotes
        val rows = ArrayList<List<String>>()
        var cur = ArrayList<String>()
        val field = StringBuilder()
        var inQuotes = false
        var i = 0
        while (i < text.length) {
            val ch = text[i]
            if (inQuotes) {
                if (ch == '"') {
                    if (i + 1 < text.length && text[i + 1] == '"') {
                        field.append('"'); i++
                    } else {
                        inQuotes = false
                    }
                } else {
                    field.append(ch)
                }
            } else when (ch) {
                '"' -> inQuotes = true
                ',' -> {
                    cur.add(field.toString()); field.setLength(0)
                }
                '\n' -> {
                    cur.add(field.toString()); field.setLength(0)
                    rows.add(cur); cur = ArrayList()
                }
                '\r' -> Unit // skip
                else -> field.append(ch)
            }
            i++
        }
        if (field.isNotEmpty() || cur.isNotEmpty()) {
            cur.add(field.toString()); rows.add(cur)
        }

        if (rows.isEmpty()) return ParsedImportResult(emptyList(), listOf("Empty CSV"))
        val header = rows[0].map { h -> h.trim().lowercase() }
        val hasHeader = header.any { it == "date" || it == "تاریخ" }
        var dateIdx = 0
        var titleIdx = 1
        var descIdx = 2
        var holidayIdx = 3
        var calIdx = 4
        var yearlyIdx = 5
        if (hasHeader) {
            dateIdx = header.indexOfFirst { it == "date" || it == "تاریخ" }
            titleIdx = header.indexOfFirst { it == "title" || it == "event" || it == "name" || it == "عنوان" }
            descIdx = header.indexOfFirst { it == "description" || it == "desc" || it == "توضیحات" }
            holidayIdx = header.indexOfFirst { it == "holiday" || it == "isholiday" || it == "تعطیل" }
            calIdx = header.indexOfFirst { it == "calendar" || it == "تقویم" }
            // trailing `yearly` column (backward compatible when absent)
            yearlyIdx = header.indexOfFirst { it == "yearly" || it == "recuryearly" || it == "سالانه" }
        }
        val dataRows = if (hasHeader) rows.drop(1) else rows
        for ((idx, row) in dataRows.withIndex()) {
            if (row.isEmpty() || row.all { c -> c.isBlank() }) continue
            val lineNo = idx + (if (hasHeader) 2 else 1)
            val dateRaw = row.getOrNull(dateIdx) ?: ""
            val title = row.getOrNull(titleIdx) ?: ""
            val description = if (descIdx >= 0) row.getOrNull(descIdx) else null
            val holidayRaw = if (holidayIdx >= 0) (row.getOrNull(holidayIdx) ?: "").trim() else ""
            val isHoliday = Regex("^(holiday|تعطیل|true|1|yes)$", RegexOption.IGNORE_CASE).matches(holidayRaw)
            val calendar = if (calIdx >= 0) (row.getOrNull(calIdx) ?: "").trim().takeIf { it.isNotEmpty() } else null
            val yearlyRaw = if (yearlyIdx >= 0) (row.getOrNull(yearlyIdx) ?: "").trim() else ""
            val recurYearly = Regex("^(yearly|recur|true|1|yes|سالانه)$", RegexOption.IGNORE_CASE).matches(yearlyRaw)
            pushEvent(out, errors, lineNo, dateRaw, title, description, isHoliday, calendar, sourceName, recurYearly)
        }
        return ParsedImportResult(out, errors)
    }

    fun parseAuto(fileName: String, text: String, sourceName: String? = null): ParsedImportResult {
        val ext = fileName.substringAfterLast('.', "").lowercase()
        if (ext == "json") return parseJsonImport(text, sourceName)
        if (ext == "csv") return parseCsvImport(text, sourceName)
        if (ext == "txt") return parseTxtImport(text, sourceName)
        if (ext == "ics") return parseIcs(text, sourceName)
        // sniff content
        val t = text.trim()
        if (t.startsWith("BEGIN:VCALENDAR", ignoreCase = true)) return parseIcs(text, sourceName)
        if (t.startsWith("[") || t.startsWith("{")) return parseJsonImport(text, sourceName)
        if (t.contains(",")) return parseCsvImport(text, sourceName)
        return parseTxtImport(text, sourceName)
    }

    /**
     * Minimal RFC 5545 ICS reader (port of the web 8-a `parseIcs`).
     *
     * Continuation lines are unfolded first (CRLF + one space/tab), then
     * `BEGIN:VEVENT … END:VEVENT` blocks are read for DTSTART/DTEND
     * (VALUE=DATE or the date part of a date-time), SUMMARY/DESCRIPTION
     * (TEXT unescaping) and RRULE (FREQ=YEARLY → recurYearly; any other
     * FREQ → imported as a single event + warning). DTEND is exclusive;
     * multi-day VEVENTs expand to one event per day, capped at 30 days.
     */
    fun parseIcs(text: String, sourceName: String? = null): ParsedImportResult {
        val out = ArrayList<ImportedEventInput>()
        val errors = ArrayList<String>()
        val warnings = ArrayList<String>()

        // 1. unfold continuation lines (RFC 5545 §3.1)
        val logical = ArrayList<String>()
        val physical = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
        for (raw in physical) {
            if ((raw.startsWith(" ") || raw.startsWith("\t")) && logical.isNotEmpty()) {
                logical[logical.size - 1] = logical.last() + raw.substring(1)
            } else {
                logical.add(raw)
            }
        }

        // 2. collect VEVENT blocks
        val blocks = ArrayList<List<String>>()
        var cur: MutableList<String>? = null
        for (line in logical) {
            val name = propertyName(line)
            if (name == "BEGIN" && blockTail(line) == "VEVENT") {
                cur = ArrayList()
            } else if (name == "END" && blockTail(line) == "VEVENT") {
                if (cur != null) blocks.add(cur)
                cur = null
            } else if (cur != null && line.contains(':')) {
                cur.add(line)
            }
        }

        // 3. parse each block
        for ((bi, block) in blocks.withIndex()) {
            val no = bi + 1
            val props = HashMap<String, String>()
            for (line in block) {
                val name = propertyName(line)
                val value = line.substring(line.indexOf(':') + 1)
                if (name !in props) props[name] = value // first occurrence wins
            }

            // DTSTART: VALUE=DATE form or the date part of a date-time
            val ds = (props["DTSTART"] ?: "").filter { it in '0'..'9' }
            if (ds.length < 8) {
                errors.add("VEVENT $no: missing/invalid DTSTART")
                continue
            }
            val sy = ds.substring(0, 4).toInt()
            val sm = ds.substring(4, 6).toInt()
            val sd = ds.substring(6, 8).toInt()
            if (sm !in 1..12 || sd !in 1..Jdn.daysInMonth(sy, sm)) {
                errors.add("VEVENT $no: invalid DTSTART date")
                continue
            }

            // RRULE: FREQ=YEARLY → recurring; other FREQ → single + warning
            var recurYearly = false
            val rrule = props["RRULE"] ?: ""
            if (rrule.isNotBlank()) {
                var freq = ""
                for (part in rrule.split(';')) {
                    val eq = part.indexOf('=')
                    if (eq > 0 && part.substring(0, eq).equals("FREQ", ignoreCase = true)) {
                        freq = part.substring(eq + 1)
                    }
                }
                if (freq.equals("YEARLY", ignoreCase = true)) {
                    recurYearly = true
                } else {
                    warnings.add("VEVENT $no: unsupported RRULE FREQ=${freq.ifBlank { "?" }} - imported as single event")
                }
            }

            val title = unescapeText(props["SUMMARY"] ?: "").trim()
            if (title.isBlank()) {
                errors.add("VEVENT $no: missing SUMMARY")
                continue
            }
            val description = unescapeText(props["DESCRIPTION"] ?: "").trim()

            // DTEND is exclusive; a missing/invalid one means a single day
            val startJdn = Jdn.g2d(sy, sm, sd)
            var endJdn: Int? = null
            val de = (props["DTEND"] ?: "").filter { it in '0'..'9' }
            if (de.length >= 8) {
                val ey = de.substring(0, 4).toInt()
                val em = de.substring(4, 6).toInt()
                val ed = de.substring(6, 8).toInt()
                if (em in 1..12 && ed in 1..Jdn.daysInMonth(ey, em)) {
                    endJdn = Jdn.g2d(ey, em, ed)
                }
            }
            if (endJdn != null && endJdn < startJdn) {
                errors.add("VEVENT $no: DTEND before DTSTART")
                continue
            }
            var days = if (endJdn != null && endJdn - startJdn >= 1) endJdn - startJdn else 1
            if (days > 30) {
                warnings.add("VEVENT $no: multi-day span capped at 30 days")
                days = 30
            }

            for (k in 0 until days) {
                val g = Jdn.d2g(startJdn + k)
                out.add(
                    ImportedEventInput(
                        iso = Jdn.isoDate(g),
                        jalaliIso = Jdn.isoDate(JalaliEngine.gregorianToJalali(g)),
                        title = title,
                        description = description.takeIf { it.isNotEmpty() },
                        isHoliday = false,
                        sourceName = sourceName,
                        recurYearly = recurYearly,
                    )
                )
            }
        }
        return ParsedImportResult(out, errors, warnings)
    }

    /** `DTSTART;VALUE=DATE:...` → `DTSTART` (uppercase, params stripped). */
    private fun propertyName(line: String): String =
        line.substringBefore(';').substringBefore(':').trim().uppercase()

    /** `BEGIN:VEVENT` → `VEVENT` (value side, uppercase, trimmed). */
    private fun blockTail(line: String): String =
        line.substringAfterLast(':').trim().uppercase()

    /** RFC 5545 TEXT unescaping: `\\n` newline, `\\;` `\\,` `\\\\` literals. */
    private fun unescapeText(s: String): String {
        val sb = StringBuilder(s.length)
        var i = 0
        while (i < s.length) {
            val c = s[i]
            if (c == '\\' && i + 1 < s.length) {
                val n = s[i + 1]
                if (n == 'n' || n == 'N') sb.append('\n') else sb.append(n)
                i += 2
            } else {
                sb.append(c)
                i++
            }
        }
        return sb.toString()
    }
}
