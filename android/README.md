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
| Views | Month (7-col grid, week-start aware, weekend red — fa: Thu/Fri, else Sat/Sun; red tint + 🌙 holidays, today ring, secondary date number, category dots) · Year (12/13 cards + year switcher) · Day (all four systems + devotional name + day-off banner) · Agenda (next 90 days grouped) |
| Hero header | Static seasonal banner per season (2 variants each, swap at day 1/15), month+year in the active system, secondary systems line |
| Widgets | **Date widget** (4×2 RemoteViews: today in active system + secondary systems + next event) and **Month widget** (4×5 GridView via `RemoteViewsService`, today highlighted, tap-a-day opens the app) |
| Status-bar date | Persistent silent ongoing notification (IMPORTANCE_LOW) with today's date in the active system; toggle in Settings |
| NTP | `NtpClient` — UDP SNTP to `pool.ntp.org` (3 s timeout, `Dispatchers.IO`), offset persisted in DataStore; syncs on app open (when online) + manual button |
| Import | SAF `OpenDocument` picker → JSON / TXT / CSV parser (Jalali auto-detect: years < 1600, Persian digits normalized) → Room `ImportedEvent` (iso, jalaliIso, title, description, isHoliday, sourceName) |
| i18n | `values/`, `values-ja/`, `values-fa/` string sets (fa = RTL); `android:supportsRtl="true"`; in-app language switching without activity recreation |

## 3. Low-power design notes

The Android port is deliberately *calmer* than the web app:

- **One** animated transition: a 300 ms alpha cross-fade when switching
  Month/Year/Day/Agenda views. Everything else is static.
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
│  ├─ engine/      Jdn, JalaliEngine, HijriEngine, ImperialEngine, Models, I18n, DateFormats
│  ├─ events/      EventRule, RuleDataset (66 rules), EventExpander, EventRepository
│  ├─ import/      ImportParser (JSON/TXT/CSV + Jalali auto-detect)
│  ├─ data/        Room AppDatabase + ImportedEvent, SettingsDataStore
│  ├─ ntp/         NtpClient (SNTP/UDP)
│  ├─ statusbar/   StatusBarDate (persistent date notification)
│  ├─ widgets/     DateWidget, MonthWidget + MonthWidgetService, WidgetUpdater
│  ├─ work/        RefreshScheduler/RefreshWorker + BootReceiver
│  └─ ui/          CelestialApp, CelestialViewModel, Hero/Month/Year/Day/Agenda views,
│                  SettingsSheet, CommonUi, Strings, theme/
└─ app/src/main/res/ values{,-ja,-fa}/strings.xml · drawable/ · layout/ · xml/
```

## 6. Notes & known limitations

- **Hijri variant:** the web engine uses ICU `islamic-umalqura`; Android's
  `IslamicCalendar` here is set to **CIVIL** (tabular). The two can differ by
  ±1 day around month boundaries, and official Iranian dates depend on moon
  sighting — treat religious dates as approximate (noted in `HijriEngine` KDoc).
- Online Nager.Date layer: not ported — the Android app is offline-first; US/JP
  holidays always come from the built-in dataset.
- First-launch `POST_NOTIFICATIONS` prompt (API 33+) is triggered by the
  status-bar date feature (default on).
