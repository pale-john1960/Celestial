# Celestial — Android app

Kotlin + Jetpack Compose (Material 3) port of the Celestial multi-calendar web
app: Gregorian · Shamsi (Jalali) · Persian Imperial · Hijri, with trilingual UI
(English / 日本語 / فارسی, RTL for Persian), curated holiday & event datasets,
home-screen widgets, a persistent status-bar date and NTP time sync.

- **Package:** `com.celestial.calendar` · minSdk **26**, target/compileSdk **35**
- **Toolchain:** Kotlin 2.0.21, AGP 8.7.3, Compose BOM 2024.10.01, KSP, Room, DataStore, WorkManager
- **Design:** primary `#C2185B`, cream bg `#FDFBF7`, white surfaces — no blue/indigo anywhere; system fonts only (Android ships Noto Sans JP + Noto Naskh Arabic, so no fonts are bundled)

---

## 1. Getting started

Open this folder (`android/`) as a project in **Android Studio** (Ladybug or
newer, JDK 17).

> **Gradle wrapper step (required once)**
>
> The Gradle wrapper **jar/scripts are intentionally NOT committed** (repo
> policy — no binaries). `gradle/wrapper/gradle-wrapper.properties` *is*
> committed and pins **Gradle 8.9**. Generate the real wrapper first with any
> local Gradle (or let Android Studio do it):
>
> ```bash
> cd android
> gradle wrapper --gradle-version 8.9
> ```
>
> This creates the working `gradlew` / `gradlew.bat` + `gradle/wrapper/gradle-wrapper.jar`
> (the committed `gradlew*` files here are **stubs** that only remind you of
> this step). Then build normally:
>
> ```bash
> ./gradlew assembleDebug        # or Run ▶ in Android Studio
> ```

No API keys, no secrets — the app is fully offline-capable by design.

## 2. Feature list

| Area | Details |
| --- | --- |
| Calendar engine | Pure-Kotlin 33-year-cycle Jalali (epoch Farvardin 1 1386 = 2007-03-21), Fourmilab JDN g2d/d2g, Persian Imperial (12 × 30-day months + 5/6 Andarjah + 30 trilingual devotional day names), Hijri via `android.icu.util.IslamicCalendar` |
| Event datasets | All 66 web rules ported **verbatim** (international, US, JP, Persian cultural / national / religious) — names, descriptions and emoji in en/ja/fa, incl. the Yalda = Azar 30 and Sepandarmazgan = Bahman 29 data fixes |
| Religious toggle | Hiding *Persian religious events* keeps legal holidays as red day-off cells (`holidayOnly`) — the event text is never shown, matching the web rule |
| Views | Month (7-col grid, week-start aware, weekend red — fa: Thu/Fri, else Sat/Sun; red tint + 🌙 holidays, today ring, secondary date number, category dots, bottom-end moon/season glyph cluster) · **Week** (7 day-cards in a vertical list, week-start aware, ‹ › ±7 d + “This week”, per-day: weekday, big active-system number, secondary + Hijri tiny, events in Day-view card style) · Year (12/13 cards + year switcher) · Day (all four systems + devotional name + day-off banner + astronomy card: moon phase + solstice/equinox row) · Agenda (next 90 days grouped) |
| Moon phases | `MoonEngine` — Meeus ch. 49-derived mean-lunation algorithm, **constants identical to the web `moon.ts`** (SYNODIC 29.530588853, BASE 2451550.09766, quarter positions 7.38264721/14.76529443/22.14794164, two-term anomaly correction): per-day age / phase / illumination / 8-phase emoji (🌑🌒🌓🌔🌕🌖🌗🌘) + localized names; major-phase day glyph (🌑🌓🌕🌗) in month cells, week cards and a Day-view card. Accuracy: new/full ±5 min, quarters ±2 h; day-markers match the live reference 149/153 |
| Solstice & equinox | `SolsticeEngine` — low-precision solar apparent-longitude series (Meeus ch. 25 truncated: mean longitude 280.46646 + 0.9856474°/d + equation of centre 1.914602/0.019993/0.000289), Newton ×6 solve per event seeded at 12:00 UTC on the canonical date, residual guard 0.5°. **Constants identical to the web `solstice.ts`** — validated 8/8 anchors (2024 + 2026) within ±17 min. Day-marker convention = the moon engine's local-day window. Day view: ♈♋♎♑ row on the astronomy card (localized name, “Occurs at HH:MM” device-local, day/night note); month cells + week cards: glyph in the bottom-end cluster (9/14 sp, α 0.6) |
| Manual events | ✛ button in the hero header → AddEventDialog (title 1–120, description ≤500, “day off” switch, “Repeats yearly” switch, Gregorian `yyyy-mm-dd` field pre-filled with the selected day + live active-system conversion + validation) → Room `ImportedEvent` with sourceName `"manual"`, ✍️ badge everywhere (📥 for file imports); **editable** — ✎ pencil on every imported/manual event card (Day view) and on the settings manager rows, with a destructive Delete in edit mode; jalaliIso recomputed on date change |
| Per-event colors (Task 9) | User-selectable color for manual/imported events: fixed 8-swatch palette (**magenta `#C2185B` · rose `#D95970` · orange `#E07B39` · gold `#B8860B` · green `#2BA84A` · teal `#5B8C85` · violet `#8E7CC3` · slate `#64748B`** — shared spec with the web, no indigo/blue) + a “default” option (null = the category default, teal for imported). Room schema **v3** adds a nullable `color` column (6-digit lowercase hex; non-destructive migration). The override flows through every instance (incl. yearly expansions) and renders in month/Year dots, Day/Week card chips, and agenda rows; the editor preselects it in edit mode (ring + check, TalkBack labels per swatch) |
| Persian zodiac chips (Task 10) | Month-view header shows a small chip with the displayed Jalali month's zodiac glyph + localized sign name — ♈ Aries/牡羊座/حمل for Farvardin … ♓ Pisces/魚座/حوت for Esfand (shared data table with the web; glyphs are the exact Unicode run U+2648..U+2653, the same code points the season markers use). Works in every calendar system: the cursor month's middle day is converted to a Jalali month via the engine facade (day 15 always lands in the majority month and agrees with the Imperial header month name; Andarjah → Esfand). Localized content description (“Zodiac of <month>: <sign>”), RTL-correct, purely static text — no animations |
| Recurring annual events | Rows flagged `recurYearly` (Room schema **v2**, non-destructive `ALTER TABLE … ADD COLUMN recurYearly INTEGER NOT NULL DEFAULT 0` migration) expand like the web: anchor instance `imp-{id}` + synthetic `imp-{id}-y{y}` per year in view (same month/day, **Feb 29 → Feb 28** in non-leap years) — 🔁 outlined chip on the cards, 🔁 badge in the manager; delete-row kills the whole series. ICS export writes only the anchor + `RRULE:FREQ=YEARLY` |
| ICS import | `parseIcs` (port of the web 8-a parser): continuation-line unfolding, VEVENT DTSTART/DTEND (`VALUE=DATE` or date-part; exclusive end), **DURATION** (RFC 5545 §3.3.6 ISO 8601 subset `P{n}W` / `P{n}D` / `P{n}DT{hms}` / `PT{hms}` — consulted only when DTEND is absent, **DTEND wins** per RFC 5545; any time component > 0 rounds the span up to the next whole day, weeks ×7; invalid → single event + error entry), multi-day expansion ≤30 days, TEXT unescaping (`,`, `;`, `\`, `\n`), `RRULE:FREQ=YEARLY` → recurring row, other FREQ → single event + warning count in the result line. SAF picker accepts `.ics` (`text/calendar` + octet-stream fallback) |
| ICS export | Settings → “Export events (.ics)” — SAF `CreateDocument("text/calendar")`, next 90 days of events + one anchor VEVENT per yearly series with `RRULE:FREQ=YEARLY` (expanded instances skipped; `holidayOnly` text never exported), RFC 5545 escaping (`\ ; ,` + newlines), 74-octet line folding, CRLF endings, `DTEND` exclusive |
| Hero header | Static seasonal banner per season (2 variants each, swap at day 1/15), month+year in the active system, zodiac chip (month view), secondary systems line, ✛ add-event button |
| Widgets | **Date widget** (4×2 RemoteViews: today in active system + secondary systems + next event) and **Month widget** (4×5 GridView via `RemoteViewsService`, today highlighted, tap-a-day opens the app) |
| Status-bar date | Persistent silent ongoing notification (IMPORTANCE_LOW) with today's date in the active system; toggle in Settings |
| NTP | `NtpClient` — UDP SNTP to `pool.ntp.org` (3 s timeout, `Dispatchers.IO`), offset persisted in DataStore; syncs on app open (when online) + manual button |
| Import | SAF `OpenDocument` picker → JSON / TXT / CSV / **ICS** parser (Jalali auto-detect: years < 1600, Persian digits normalized; JSON `recurYearly`/`yearly` field; TXT/CSV trailing `yearly` column — backward compatible) → Room `ImportedEvent` (iso, jalaliIso, title, description, isHoliday, sourceName, recurYearly) — listed in Settings with ✍️/📥 source badges + 🔁 + per-row edit/delete |
| i18n | `values/`, `values-ja/`, `values-fa/` string sets (fa = RTL); `android:supportsRtl="true"`; in-app language switching without activity recreation |

## 3. Low-power design notes

The Android port is deliberately *calmer* than the web app:

- **One** animated transition: a 300 ms alpha cross-fade when switching
  Month/Week/Year/Day/Agenda views. Everything else is static.
- No hero cross-fade/ken-burns, **no particles**, no pulsing badges, no
  infinite animations. Material ripple is left on (system-standard, cheap).
- Widgets/notifications refresh only from **WorkManager**: one inexact
  6-hour periodic pass + a one-shot pass scheduled for the next local
  midnight (re-scheduled after each run, and after boot / system clock
  changes). No exact alarms, no polling, `updatePeriodMillis="0"`.
- Engine expansion is cached per Gregorian year in memory and computed on
  `Dispatchers.Default`; event DB reads are suspend + Room.

## 4. Seasonal artwork swap instructions

`res/drawable/seasonal_{spring,summer,autumn,winter}_{1,2}.xml` are **simple
gradient placeholder vectors** (safe to ship). To use real artwork:

1. Export each banner as a webp/png (~1200×480, keep the upper half calm —
   the month name + secondary line are drawn over it with a scrim).
2. Drop the files into `app/src/main/res/drawable-nodpi/` **keeping the same
   resource names** (`seasonal_spring_1.webp`, … `seasonal_winter_2.webp`).
3. Delete the eight placeholder `.xml` files (a resource name can only have
   one entry; same name ⇒ the raster file wins once the xml is removed).
4. No code changes needed — `HeroHeader` resolves `R.drawable.seasonal_*` at
   runtime via `seasonBannerRes()`.

The `ic_celestial` crescent+star mark (`#C2185B`) and the white notification
variant `ic_celestial_white` can be swapped the same way.

## 5. Project layout

```
android/
├─ gradle/libs.versions.toml        # version catalog
├─ settings.gradle.kts, build.gradle.kts, gradle.properties
├─ app/src/main/java/com/celestial/calendar/
│  ├─ engine/      Jdn, JalaliEngine, HijriEngine, ImperialEngine, Models, I18n, DateFormats, MoonEngine, SolsticeEngine
│  ├─ events/      EventRule, RuleDataset (66 rules), EventExpander, EventRepository, IcsBuilder
│  ├─ import/      ImportParser (JSON/TXT/CSV/ICS + Jalali auto-detect)
│  ├─ data/        Room AppDatabase + ImportedEvent, SettingsDataStore
│  ├─ ntp/         NtpClient (SNTP/UDP)
│  ├─ statusbar/   StatusBarDate (persistent date notification)
│  ├─ widgets/     DateWidget, MonthWidget + MonthWidgetService, WidgetUpdater
│  ├─ work/        RefreshScheduler/RefreshWorker + BootReceiver
│  └─ ui/          CelestialApp, CelestialViewModel, Hero/Month/Week/Year/Day/Agenda views,
│                  AddEventDialog, SettingsSheet, CommonUi, Strings, Zodiac, theme/
└─ app/src/main/res/ values{,-ja,-fa}/strings.xml · drawable/ · layout/ · xml/
```

## 6. Notes & known limitations

- **Room schema v3 (Task 9-c):** `imported_events` gained `recurYearly INTEGER
  NOT NULL DEFAULT 0` (v2, Task 8-b) and a nullable `color TEXT` column (v3,
  Task 9-c) via registered, **non-destructive** migrations
  (`AppDatabase.MIGRATION_1_2` + `MIGRATION_2_3`). The old
  `fallbackToDestructiveMigration()` was removed — user data is never silently
  wiped; an unforeseen future schema mismatch now throws instead. Fresh
  installs build v3 directly.
- **Hijri variant:** the web engine uses ICU `islamic-umalqura`; Android's
  `IslamicCalendar` here is set to **CIVIL** (tabular). The two can differ by
  ±1 day around month boundaries, and official Iranian dates depend on moon
  sighting — treat religious dates as approximate (noted in `HijriEngine` KDoc).
- Online Nager.Date layer: not ported — the Android app is offline-first; US/JP
  holidays always come from the built-in dataset.
- Moon-phase day-markers can differ ±1 day from live references when the true
  event falls within ~1 h of local midnight (149/153 agreement — same known
  limitation as the web `moon.ts`).
- Solstice/equinox instants are ±17 min (truncated 3-term solar series — same
  accuracy as the web `solstice.ts`); “Occurs at HH:MM” uses the local-day
  window's timezone offset (DST-transition days can be off by the DST delta).
- Recurring yearly expansion is Gregorian month/day based (Feb 29 → Feb 28 in
  non-leap years); Jalali/Imperial users see the event on the matching
  Gregorian date each year. Editing the anchor edits the whole series.
- ICS import is a minimal reader: parameters on DTSTART/DTEND are ignored
  (VALUE=DATE or date-part only), BYMONTH/BYMONTHDAY are assumed to match
  DTSTART, DURATION accepts no sign/months/years and is clamped to 366 days
  (the expansion cap limits it to 30 anyway), and non-YEARLY RRULEs import
  as single events (reported as warnings).
- Per-event colors never cross the import/export boundary: ICS (and every
  other import format) does not carry the app's color column, and the ICS
  export emits no color property — parity with the web. Invalid stored hex
  falls back to the category color at render time.
- The home-screen widgets don't render event dots (Date widget is text +
  next-event line, Month widget colors only today/holiday day numbers), so
  per-event colors are in-app only.
- ICS export folds lines by UTF-8 octets (≤74) — strict RFC 5545 compliant.
- First-launch `POST_NOTIFICATIONS` prompt (API 33+) is triggered by the
  status-bar date feature (default on).

## 7. Building the APK

```bash
# prerequisites: JDK 17+ (full JDK with jlink, not a JRE) + Android SDK
cd android
echo "sdk.dir=$HOME/android-sdk" > local.properties   # platforms;android-35 + build-tools;35.0.0
./gradlew assembleDebug          # if you have the Gradle wrapper jar; otherwise:
gradle assembleDebug             # Gradle 8.9 (AGP 8.7.3, Kotlin 2.0.21)
# → app/build/outputs/apk/debug/app-debug.apk
```

- `assembleDebug` produces a debug-keystore-signed APK (~15 MB) that installs
  on any device with "install unknown apps" enabled — fine for testing.
- `assembleRelease` needs a signing config (`keystore.properties`, not
  committed) for distribution.
- The compile toolchain was verified in this sandbox: Temurin JDK 17
  (`-Dorg.gradle.java.home=…` if your default JVM is a JRE), SDK 35,
  Gradle 8.9 — `BUILD SUCCESSFUL`, APK bundled with all 20 header-theme
  drawables.

Round-13 Android parity: Shahanshahi epoch (year = Jalali + 1180, Cyrus 559
BCE), Iranian-Friday day-off styling, Hijri-year toggle, daily horoscope
(deterministic, same picks as the web), header artwork themes (7 × jpg
drawables in `drawable-nodpi/`), month-cell tile borders, and the full
32-entry international observance dataset.

Round-14 Android parity: two extra calendar systems — **Shahanshahi (Shamsi)**
(Imperial year on the standard Jalali months) and **Ancient (Fasli)** (30-day
structure + ancient Zoroastrian month names, always), the **royal month-names
toggle** (امرداد/اسپندارمذ in the Imperial systems), the **configurable weekly
day off** (auto/Fri/Sat/Sun/none, replacing the hardcoded Iranian Friday),
**locale-aware date formatting** (fa day-first + full weekday names
everywhere outside the month grid, ja 年月日 + （曜日）), a **NOAA sun-times
card** (dawn/sunrise/noon/sunset/dusk, 10-city picker, polar-night aware —
`SunEngine.kt`, constants 1:1 with the web) and a **world-clock card** (live
times, next/previous-day markers, add/remove cities), 4-image hero pools
(+12 drawables = 32 total, `gMonth % 4` rotation), and Year-view month cards
that follow the active header theme's artwork pool. Strings: 240 keys ×3
locales (37 new, byte-identical to the web dictionaries).

Round-15 Android QA round (user device feedback, all fixed):
- **Widget suite** — NEW compact **Today 2×1** widget (accent bar + weekday +
  huge day number + month/year), redesigned 4×2 date widget (header row is now
  icon + weekday only — the app-name label that crowded it is gone; hairline
  divider above the next-event footer), month widget with a localized weekday
  header row + full-date footer + magenta today pill, and new gradient card
  backgrounds (24dp corners, magenta hairline). `WidgetUpdater` refreshes all
  three at midnight/settings change.
- **Hero header overhaul** — the banner/season/particles now follow the
  DISPLAYED month (was: today's month — the header never changed while
  navigating); 400 ms cross-fade between artworks; **Compose Canvas particle
  systems** ported 1:1 from the web (petals/leaves/snow/fireflies/stars/
  sparkles/gold dust per theme — deterministic mulberry32 layout, honors the
  system "remove animations" switch); the zodiac chip moved to the secondary
  line so long Persian month names can no longer push it out of order.
- **12 artworks per theme** — every fixed theme maps Gregorian month 1:1 to
  its own drawable (72 fixed + 12 seasonal = 84 total in `drawable-nodpi/`);
  the Year view's month-card banners are all unique within a year.
- **Year view** — RTL year-switcher arrows mirror correctly (was `><` in
  Persian), and scroll lag fixed (LruCache + two-pass downsampled banner
  decode at ~256px, stable grid keys, precomputed per-cell day models).
- **Week view** — the week label is locale-ordered («۱۸–۲۴ مهر ۱۴۰۵» in
  Persian, `Mehr 18–24, 1405` in English), and each day card shows its month
  name next to the big number («شنبه ۲۹ مهر»).
- **Month view day strip** — constant height (date line never wraps;
  single-line ellipsis), holiday indicator is a self-contained badge.
- **Status-bar notification** — full localized date (weekday + day + month +
  year + era, e.g. «پنجشنبه · ۷ آبان ۱۴۰۵ هجری شمسی») instead of month-year
  only; the shade's clock time is hidden.
- **Screenshot tests** — `ScreenshotsTest.kt` (Robolectric NATIVE graphics +
  Roborazzi) renders the real Compose screens to PNGs for the root README —
  run `gradle :app:testDebugUnitTest --tests "*.ScreenshotsTest"` (outputs to
  the module dir; requires `roborazzi.test.record`, wired in
  `testOptions.unitTests`). Strings: 242 ×3 locales.
