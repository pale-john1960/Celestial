# 14-d — Android Parity Porter + APK Builder (Round 14)

Task: port the web round-14 features to the Kotlin Android app (android/) and build the APK.
Read the full work record in `/home/z/my-project/worklog.md` → "Task ID: 14-d".

## What was ported

| Web feature | Android surface |
|---|---|
| imperialSolar + ancient systems (14-a) | engine/Models.kt CalendarSystem + CalendarFacade branches (systemMonthCount/hasAndarjah/systemTripleOf/systemMonthName), SettingsScreen 5-system chips |
| ANCIENT_MONTH_NAMES + systemMonthName rule (14-a) | ImperialEngine.ANCIENT_MONTH_NAMES, I18n.ancientMonthName, CalendarFacade.systemMonthName wired into every month-name site (royal param) |
| isWeeklyDayOff + weekendDay setting (14-a) | engine WeekendDay enum + CalendarFacade.isWeeklyDayOff, SettingsDataStore WEEKEND_DAY, MonthView/WeekView/AgendaView setting-driven day-off styling, settings chips |
| locale-aware composeDate / weekdayDateText / activeDateText (14-a) | DateFormats.kt rewrite (ja ${year}年…日 / fa day-first / en unchanged), weekdayDateText, fullSystemDate 5 systems, full weekday names everywhere except month-grid header rows, HeroHeader today chip (new), SelectedDayStrip, AddEventDialog |
| sun.ts + SunTimesCard + WorldClockCard (14-b) | NEW engine/SunEngine.kt (NOAA, tz via java.time ZoneRules at local noon), DayView SunTimesCard + WorldClockCard (30s ticker, day-offset badges, add/remove, cap 8, 10-city picker — permission-free) |
| 4-image fixed hero pools + themeImageSrc (14-a/14-c) | 12 jpgs → drawable-nodpi, heroArtworkRes gMonth % 4, YearView month cards carry artwork banners (central image source) |

## Build

- `cd android && JAVA_HOME=/home/z/jdks/jdk-17.0.20.1+1 /home/z/gradle-8.9/bin/gradle assembleDebug --no-daemon -Dorg.gradle.jvmargs="-Xmx1400m"`
- Run 1 FAILED: Kotlin treats CJK chars as identifier chars → `"$year年"` parsed as `year年`; fixed to `"${year}年"`. Plus unqualified `systemTripleOf` from DateFormats → `CalendarFacade.systemTripleOf`.
- Run 2: **BUILD SUCCESSFUL in 1m33s** → app-debug.apk 17,441,248 bytes, 32 hero drawables verified via `unzip -l`, copied to `public/celestial-debug.apk` (HTTP 200 full-download verified).

## Verification

- /tmp/verify14d.ts (bun + web engine, 1:1 port): **48/48 PASS** — anchors 2026-10-11 → imperialSolar 2585/7/19 + ancient 2585/7/25, Nowruz 2586/1/1 all four Persian systems (2585), Farvardin 2585 = 31d, Andarjah 2585=5/2588=6, royal-name matrix, weekend matrix, Tromsø polar flags, hero %4 rotation.
- Tehran Oct 11 manual trace: dawn 04:42, sunrise 06:06, noon 11:51, sunset 17:36, dusk 19:00 (matches web).
- Strings: 240=240=240 per file (203 + 37 new); all 37 keys byte-identical to web i18n (script diff, 0 mismatches).

## Deviations

1. Geolocation skipped (permission-free 10-city picker only) — sun_use_my_location/sun_locating/sun_loc_error strings not added.
2. Sun/world-clock icons = emoji (no material-icons-extended; avoids debug-APK bloat).
3. Today chip is a new surface (replaces icon-only Today button) — explicit T4 site.
4. YearView artwork banners are new (the themeImageSrc port).
5. DateConverterDialog has no Android equivalent — skipped.
6. APK untested on-device (no emulator in sandbox).
7. Dev server OOM-killed during the gradle build — recovered via double-fork orphan relaunch (`bash -c '( exec setsid nohup bun run dev >> dev.log 2>&1 < /dev/null & )'`); plain nohup/setsid attempts were reaped when the tool call ended.

## Ownership discipline

Only android/ modified (+ the public/celestial-debug.apk overwrite). No web/src changes. No commit (coordinator handles git).
