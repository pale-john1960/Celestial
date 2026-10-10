package com.celestial.calendar.`import`

import com.celestial.calendar.engine.JalaliEngine
import com.celestial.calendar.engine.Jdn
import com.celestial.calendar.engine.SimpleDate
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

/**
 * Celestial — offline event import parsers (JSON / TXT / CSV).
 *
 * Kotlin port of `src/lib/import/parse.ts`. Auto-detects Jalali vs Gregorian
 * dates: years < 1600 -> Jalali, >= 1600 -> Gregorian (explicit `calendar`
 * field wins). Persian digits ۰-۹ are normalized. JSON is parsed via
 * org.json; CSV supports quoted fields ("" escapes).
 */
object ImportParser {

    data class ImportedEventInput(
        val iso: String,
        val jalaliIso: String,
        val title: String,
        val description: String? = null,
        val isHoliday: Boolean = false,
        val sourceName: String? = null,
    )

    data class ParsedImportResult(
        val events: List<ImportedEventInput>,
        val errors: List<String>,
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
            val calendar = o.optString("calendar").takeIf { it.isNotBlank() }
            pushEvent(out, errors, i + 1, dateRaw, title, description, isHoliday, calendar, sourceName)
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
            pushEvent(out, errors, lineNo, dateRaw, title, description, isHoliday, null, sourceName)
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
        if (hasHeader) {
            dateIdx = header.indexOfFirst { it == "date" || it == "تاریخ" }
            titleIdx = header.indexOfFirst { it == "title" || it == "event" || it == "name" || it == "عنوان" }
            descIdx = header.indexOfFirst { it == "description" || it == "desc" || it == "توضیحات" }
            holidayIdx = header.indexOfFirst { it == "holiday" || it == "isholiday" || it == "تعطیل" }
            calIdx = header.indexOfFirst { it == "calendar" || it == "تقویم" }
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
            pushEvent(out, errors, lineNo, dateRaw, title, description, isHoliday, calendar, sourceName)
        }
        return ParsedImportResult(out, errors)
    }

    fun parseAuto(fileName: String, text: String, sourceName: String? = null): ParsedImportResult {
        val ext = fileName.substringAfterLast('.', "").lowercase()
        if (ext == "json") return parseJsonImport(text, sourceName)
        if (ext == "csv") return parseCsvImport(text, sourceName)
        if (ext == "txt") return parseTxtImport(text, sourceName)
        // sniff content
        val t = text.trim()
        if (t.startsWith("[") || t.startsWith("{")) return parseJsonImport(text, sourceName)
        if (t.contains(",")) return parseCsvImport(text, sourceName)
        return parseTxtImport(text, sourceName)
    }
}
