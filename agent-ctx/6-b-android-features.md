# Task 6-b — Android: parity features (Week view, moon phases, manual events, ICS export)

You are extending the **Celestial Android app** (Kotlin + Compose Material3) in `/home/z/my-project/android/`. The app is COMPLETE and statically verified (74 files) — see Task 3-b in worklog. There is **no Android SDK/Gradle in this sandbox** — your work is verified by **strict static review** (pattern consistency, R.* reference resolution, string-key parity across locales, symbol cross-checks). Quality bar: it must compile first-try on a real SDK machine.

**MUST read before working:** `/home/z/my-project/worklog.md` (Tasks 0, 2, 3-a, 3-b, 4+5) + `android/README.md` + the files you will touch.
**MUST append your work record to worklog.md at the end (append, never overwrite, `---` separator, template at file top).**
**DO NOT run git commands.** Coordinator handles git.

## Constraints (unchanged from Task 3-b)
- LOW POWER: only the existing single 300ms AnimatedContent on view swap; ripple only; static drawables; widgets/notification refresh only via existing WorkManager schedule. NO new animations, NO infinite animators.
- Offline-first (no online layer). Emoji-based iconography is the app's language — keep it.
- Existing architecture: `CelestialViewModel` (state), `CelestialApp` (root scaffold + view switch), engine ported 1:1 from web TS, strings in `res/values{,-ja,-fa}/strings.xml` (parity REQUIRED — same key set in all 3), DataStore settings, Room `ImportedEvent`.

## Features (all 4)

### 1. Week view
- New `ui/WeekView.kt` following MonthView/AgendaView patterns exactly (same paddings, card shape, typography from `ui/theme`).
- Week = 7 days starting at `weekStart` setting, containing the currently **selected day** (derive from VM state; prev/next shift selected day ±7 days; "this week" button resets to today's week — reuse goToday-like VM logic, add `shiftWeek(delta: Int)` to CelestialViewModel).
- Each day card: header (weekday long + big day number in active system + secondary systems small + Hijri tiny; holiday → red + 🌙; today accent), event list (same card style as DayView: emoji, name, description, category dot, holidayOnly → day-off chip only), empty → muted no-events line.
- Add to view switcher in `CelestialApp`/HeroHeader (order: month, week, year, day, agenda) + strings `view_week` ×3 locales: "Week" / 「週」 / "هفته".
- 7 day cards in vertical `LazyColumn` (mobile-first; one card per day) — simplest + lowest power.

### 2. Moon phases
- New `engine/MoonEngine.kt` — port EXACTLY this algorithm (coordinator-validated against the icalendar37.net live API; 149/153 day-markers agree, new/full anchors within ±5 min; web `src/lib/calendar/moon.ts` gets the identical one — constants MUST match):
  ```
  SYNODIC = 29.530588853
  BASE     = 2451550.09766   // Meeus ch.49 mean new-moon epoch (k=0), NOT the 18:14 true instant
  MAJORS: new=0.0, firstQ=7.38264721, full=14.76529443, lastQ=22.14794164

  anomalies(jd): d = jd - 2451545.0
    Mp = TAU * frac(134.963/360 + 13.064993*d/360)   // moon mean anomaly (Meeus M')
    Ms = TAU * frac(357.529/360 + 0.98560028*d/360)  // sun mean anomaly (Meeus M)

  corrAt(jd, pos): // two dominant Meeus ch.49 terms, E≈1
    if pos == 7.38264721 || pos == 22.14794164: -0.62814*sin(Mp) + 0.17172*sin(Ms)  // QUARTER table
    else:                                       -0.40720*sin(Mp) + 0.17241*sin(Ms)  // NEW/FULL table

  // per calendar date D: jdn = Jdn.g2d(D) (noon UTC); off = -TimeZone.getDefault().getOffset(millisOf(D))/86400000.0 (days east)
  localNoon     = jdn + off
  ageMean       = mod(localNoon - BASE, SYNODIC)
  cycleStart    = localNoon - ageMean
  trueNewStart  = cycleStart + corrAt(cycleStart, 0)
  age           = localNoon - trueNewStart  // → phase, illum = (1-cos(TAU*phase))/2, phaseIndex = floor(phase*8+0.5)%8
  markers: for shift in {-SYNODIC, 0, +SYNODIC}, for each major (m, pos):
     meanEvt = cycleStart + shift + pos
     evt     = meanEvt + corrAt(meanEvt, pos)
     if evt in [jdn - 0.5 + off, jdn + 0.5 + off) → D carries glyph m   // D's local calendar day window
  // normally 0 or 1 marker; if 2 (rare boundary), keep smaller |evt - localNoon|
  ```
  Data class `MoonInfo(ageDays, phase, illum, phaseIndex, major)`, `major: MoonMajor?` enum. KDoc: new/full ±5 min, quarters ±2 h; markers match live reference 149/153 (disagreements only when the true event is within ~1 h of local midnight); algorithm identical to web moon.ts.
- Phase names ×3 locales via strings.xml (`moon_new`, `moon_waxing_crescent`, `moon_first_quarter`, `moon_waxing_gibbous`, `moon_full`, `moon_waning_gibbous`, `moon_last_quarter`, `moon_waning_crescent`) + `moon_phase_title` ("Moon phase"/「月相」/"فاز ماه") + `moon_illumination` ("Illumination {n}%" — with format arg) + `moon_age` ("Moon age {n} days" — format arg; see existing format-arg strings pattern). Japanese set: 新月 / 三日月 / 上弦の月 / 盈凸月 / 満月 / 虧凸月 / 下弦の月 / 有明月. Persian: ماه نو / هلال صعودی / ربع اول / ماه گیب صعودی / ماه کامل / ماه گیب نزولی / ربع آخر / هلال نزولی.
- Display: DayView gets a moon card (Row: emoji by phaseIndex — 🌑🌒🌓🌔🌕🌖🌗🌘, phase name, illum % + age, styled like other DayView cards). MonthView cells: tiny major-phase glyph (🌑🌓🌕🌗 by `major`, 9.sp, alpha 0.6f, bottom-end corner) — only when major != null. WeekView same rule in day-card header.

### 3. Manual event creation
- HeroHeader top bar: new `IconButton` (Icons.Default.Add, contentDescription `add_event`) → `AddEventDialog.kt` (Compose AlertDialog, follow SettingsScreen dialog patterns):
  - Fields: title OutlinedTextField (required, 1..120), description OutlinedTextField (≤500), isHoliday Switch (label `add_event_holiday`), date = active-system formatted string of the currently selected day + small OutlinedTextField `yyyy-mm-dd` (Gregorian ISO, validated via engine parseIso-equivalent; pre-filled with selected day ISO; invalid → supportingText error, disable Save).
  - Save → insert into Room `ImportedEvent` (iso, jalaliIso via JalaliEngine, title, description, isHoliday, sourceName = "manual") via repository/VM → refresh events (existing flow) → snackbar/toast `add_event_saved`.
- `EventRepository`: when mapping rows with `sourceName == "manual"` → emoji "✍️" (else 📥). EventDialog/AgendaView source badge: add Manual case (string `source_manual`: "Manual"/「手動」/"دستی").
- Strings: `add_event` ("Add event"/「イベントを追加」/"افزودن رویداد"), `add_event_title` ("New event"/「新しいイベント」/"رویداد جدید"), `add_event_name` ("Title"/「タイトル」/"عنوان"), `add_event_desc` ("Description"/「説明」/"توضیحات"), `add_event_holiday` ("Mark as day off"/「休日にする」/"تعطیل رسمی"), `add_event_date` ("Date (Gregorian yyyy-mm-dd)"/「日付(西暦 yyyy-mm-dd)」/"تاریخ (میلادی yyyy-mm-dd)"), `add_event_saved` ("Event added"/「イベントを追加しました」/"رویداد افزوده شد"), `add_event_invalid_date` ("Invalid date"/「日付が無効です」/"تاریخ نامعتبر است"), `source_manual`.
- Deleting manual events: they appear in the existing imported-events manager list (SettingsSheet) — show sourceName so users can distinguish; existing delete row action works unchanged.

### 4. ICS export
- SettingsScreen: new row (icon Icons.Outlined.FileDownload, label `export_ics` ("Export events (.ics)"/「イベントを書き出す (.ics)」/"خروجی رویدادها (.ics)")):
  - Build ICS from the next 90 days of events (existing repository expand for that range): VCALENDAR/VERSION:2.0/PRODID:-//Celestial//Calendar//EN; per event VEVENT: UID `id@celestial`, DTSTAMP now UTC (yyyyMMddTHHmmssZ), DTSTART;VALUE=DATE, DTEND;VALUE=DATE = iso+1day, SUMMARY name (+ " (holiday)" if isHoliday), DESCRIPTION description · source label. Escape `\ ; ,` and newlines (`\n`); fold >74-char lines (CRLF + space); CRLF endings. Kotlin util `events/IcsBuilder.kt` (pure, unit-testable, no imports beyond stdlib).
  - Share via `rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("text/calendar"))` — launch("celestial-events.ics"); in callback write bytes via `context.contentResolver.openOutputStream(uri)`. Needs `androidx.activity:activity-compose` (already a Compose dependency — verify; if missing, wire through MainActivity callback pattern instead and document).
  - Toast `export_ics_done` with count format arg. No new permissions (CREATE_DOCUMENT needs none).

## Static QA checklist (all mandatory)
1. R.string/R.drawable/R.layout/R.id references all resolve (cross-check against res files).
2. String key parity: values vs values-ja vs values-fa — identical key sets (script it: grep + sort + diff).
3. Kotlin symbol cross-check: every new symbol referenced exists; imports correct; no unused imports (match existing code style: 4-space, trailing commas per existing files).
4. Pattern consistency: WeekView matches MonthView/AgendaView (state hoisting, VM usage); AddEventDialog matches existing dialogs; MoonEngine KDoc'd; no new heavy operations on UI thread (Room via existing coroutine scope patterns).
5. AndroidManifest: no changes needed (CREATE_DOCUMENT permission-free) — verify and document.
6. Update `android/README.md` feature list + any relevant sections.

## Deliverables
- All code + static QA fixes; worklog.md append (template at top of worklog) with: files created/modified, string key list added, moon algorithm constants (must state they match web Task 6-a — if 6-a hasn't finished, state constants as spec'd here), static QA results, deviations, risks.
