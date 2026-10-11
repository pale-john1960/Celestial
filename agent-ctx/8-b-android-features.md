# Task 8-b — Android: parity (solstice/equinox, event editing, recurring events, ICS import)

You are extending the **Celestial Android app** (Kotlin + Compose Material3, `/home/z/my-project/android/`). Complete + statically verified (Tasks 3-b, 6-b in worklog). **No Android SDK in sandbox** — verification is STRICT STATIC REVIEW (R.* resolution, string parity across 3 locales, symbol cross-checks, pattern consistency). Quality bar: compiles first-try on a real SDK machine.

**Read FIRST (context-manage carefully — read ONLY these):**
1. `/home/z/my-project/agent-ctx/8-b-android-features.md` (this spec)
2. worklog Task 3-b section (`sed -n '80,105p' /home/z/my-project/worklog.md`) + Task 6-b section (`sed -n '156,178p'`) + Task 8-a section (will exist at the end — for the solstice constants; if not present yet, use the constants in THIS spec — they are coordinator-validated)
3. The files you'll touch (see below), in the existing code style.

**DO NOT** run git / create tests / touch src/, prisma/, public/ (web agent works in parallel). Worklog append at end (Task ID: 8-b, template at file top).

## Constraints (unchanged)
LOW POWER: only the existing 300ms view-swap AnimatedContent; ripple only; NO new animations. Offline-first. Emoji-based iconography. Room + DataStore + existing architecture (CelestialViewModel state, LocalStrings i18n, res/values{,-ja,-fa} parity REQUIRED).

## Feature 1 — Solstice & equinox (algorithm IDENTICAL to web — coordinator-validated, 8/8 anchors within ±17 min)

New `engine/SolsticeEngine.kt`:
```
sunLon(jd):  d = jd − 2451545.0
  L  = norm(280.46646 + 0.9856474·d)                 // mean longitude (deg)
  g  = norm(357.529  + 0.98560028·d)                 // mean anomaly (deg; rad for sin)
  λ  = norm(L + 1.914602·sin g + 0.019993·sin 2g + 0.000289·sin 3g)
solve(target 0/90/180/270, seedJd): Newton ×6: t += signedNorm(target − λ(t)) / 0.9856474
seeds (12:00 UTC): Mar 20 (λ0), Jun 21 (λ90), Sep 22 (λ180), Dec 21 (λ270) of the year
Marker on Gregorian date D iff event instant ∈ [D 00:00, D+1 00:00) DEVICE-LOCAL —
  use the SAME offset convention as MoonEngine.kt's working code (copy its exact pattern).
Safety: if residual |λ(t) − target| > 0.5° after iterations → null.
```
Anchors for your Python-mirror validation (do it like Task 6-b did for moon): Mar eq 2024 = 03-20 03:06Z, Jun sol 2024 = 06-20 20:51Z, Sep eq 2024 = 09-22 12:44Z, Dec sol 2024 = 12-21 09:20Z, Mar eq 2026 = 03-20 14:46Z, Jun sol 2026 = 06-21 08:24Z, **Sep eq 2026 = 09-23 00:05Z**, Dec sol 2026 = 12-21 ~20:50Z (±20 min tolerance).
API: `enum SeasonEvent { MAR_EQUINOX, JUN_SOLSTICE, SEP_EQUINOX, DEC_SOLSTICE }`, `data class SeasonInfo(event, jd)`, `fun eventOn(g: SimpleDate): SeasonInfo?`, `fun eventsOfYear(year): List<SeasonInfo>`. KDoc: validated accuracy + identical to web solstice.ts.
Display: DayView astronomy row appended to the existing moon card (glyph ♈♋♎♑ + localized name + "Occurs at HH:MM" local + note); MonthView/WeekView cells: glyph joins the moon glyph's bottom-end cluster (9.sp, alpha 0.6, same cluster layout as 6-b).
Strings ×3: season_mar_equinox ("March equinox"/「春分」/"اعتدال بهاری"), season_jun_solstice ("June solstice"/「夏至」/"انقلاب تابستانی"), season_sep_equinox ("September equinox"/「秋分」/"اعتدال پاییزی"), season_dec_solstice ("December solstice"/「冬至」/"انقلاب زمستانی"), season_occurs_at ("Occurs at %1$s"/「%1$s に起こる」/"رخداد در ساعت %1$s"), season_note_equal ("Day and night are about equal"/「昼と夜の長さがほぼ等しい」/"طول روز و شب تقریباً برابر است"), season_note_longest ("Longest day of the year (N. hemisphere)"/「北半球で一年で最も昼が長い」/"بلندترین روز سال (نیمکره شمالی)"), season_note_shortest ("Shortest day of the year (N. hemisphere)"/「北半球で一年で最も昼が短い」/"کوتاه‌ترین روز سال (نیمکره شمالی)"), season_glyph_desc (contentDescription "Season marker: %1$s" ×3).

## Feature 2 — Recurring annual events (Room migration!)

- **AppDatabase.kt**: `ImportedEvent` entity gains `recurYearly: Boolean` with `@ColumnInfo(defaultValue = "0")`. **Bump DB version 1→2 + Migration(1, 2): `ALTER TABLE ImportedEvent ADD COLUMN recurYearly INTEGER NOT NULL DEFAULT 0`** — register via `addMigrations(...)` (NOT destructive). Check how AppDatabase is currently built (builder pattern) and wire the migration idiomatically.
- **EventRepository**: imported rows with recurYearly → expand like the web (see 8-a spec Feature 3): anchor instance id `imp-{id}` + `recurring=true, anchorIso`; extra years y in the query range, ≠ anchor year, date (y, m, d) with Feb-29→Feb-28 fallback in non-leap; id `imp-{id}-y{y}`, same dbId (delete row kills series). Add `recurring/anchorIso` to the Android EventInstance model (check its name — Models or EventRule file). 🔁 chip on recurring event cards (reuse the holiday-chip pattern, outline + string recurring_yearly: "Repeats yearly"/「毎年繰り返す」/"هر سال تکرار می‌شود").
- **AddEventDialog**: "Repeats yearly" Switch (add_event_yearly + add_event_yearly_hint "Birthdays, anniversaries"/「誕生日や記念日」/"تولدها و سالگردها") saved to the Room row.
- **ImportParser.kt**: JSON `recurYearly` field; TXT/CSV trailing `yearly` column (backward compatible); NEW `parseIcs(text)` port from the web 8-a parser (unfold continuation lines → BEGIN:VEVENT blocks → DTSTART VALUE=DATE or date-part, DTEND ≥ start → multi-day expansion ≤30 days/VEVENT, SUMMARY/DESCRIPTION unescaped, RRULE FREQ=YEARLY + BYMONTH/BYMONTHDAY → recurYearly, other FREQ → single + warning). SAF import accepts .ics (mime "text/calendar" + fallback octet-stream).
- **IcsBuilder.kt**: recurring series → export ONLY the anchor instance + `RRULE:FREQ=YEARLY` line; skip expanded instances.
- **SettingsScreen imported-list rows**: 🔁 next to title for recurring rows.

## Feature 3 — Event editing

- DAO: `@Update` (or updateById SQL) for ImportedEvent.
- **AddEventDialog edit mode**: opened via (1) a Pencil `IconButton` on each imported-list row (SettingsScreen manager, next to the existing delete) and (2) an "Edit" button in the event detail (if the Android app has an event detail dialog — check; if it only shows cards in DayView, add a small edit icon on imported/manual event cards' cards or a long-press action — pick the pattern closest to existing UX). Prefill fields; title string edit_event ("Edit event"/「イベントを編集」/"ویرایش رویداد"); Save → VM.updateImported → Room update → flow refresh → toast event_updated ("Event updated"/「イベントを更新しました」/"رویداد به‌روزرسانی شد"); Delete button in edit mode (existing delete path) with delete_event label ("Delete event"/「イベントを削除」/"حذف رویداد").
- VM: `updateImported(event)` + `editingEvent` state (MutableStateFlow) consumed by AddEventDialog.

## Static QA (all mandatory)
1. String parity: values = values-ja = values-fa identical key sets (scripted sort+diff); XML well-formed; no dupes.
2. All R.* references resolve; Kotlin symbols exist; imports correct, no unused.
3. Room migration correctness: version bump, ALTER TABLE matches entity field name/default (Room's expected schema — column name `recurYearly` maps to `recurYearly` unless @ColumnInfo name given; keep them equal), migration registered.
4. SolsticeEngine + parseIcs numerically validated via Python mirror (8 anchors ±20 min; ICS: unfold/unescape/RRULE/multi-day on 3 test strings).
5. Patterns consistent; no new animations; no manifest/dependency changes (check: none needed).
6. Update android/README.md (features + migration note).

## Deliverables
Code + static QA; worklog append (Task ID: 8-b): files, string keys, solstice constants (state they match web — or the spec if web section not yet written), migration details, validation results, deviations, risks.
