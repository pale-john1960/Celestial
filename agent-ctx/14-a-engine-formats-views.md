# Task 14-a — Engine + formats + core views (Round 14, wave 1)

Read the shared worklog tail (`/home/z/my-project/worklog.md`, 14-plan section) before starting — this file is my work record per the multi-agent protocol.

## Scope (exclusive)
- `src/lib/calendar/**` (types, index, imperial, jalali, jdn, … + NEW weekend.ts)
- HeroHeader / MonthView / WeekView / DayView / AgendaView / YearView / DateConverterDialog / TodayStrip / NextDayOffChip / SettingsSheet
- Plus two sanctioned out-of-list touches: `EventDialog.tsx` (TASK 2 explicitly assigned its weekday·date line) and `scripts/smoke.ts` (3-line expectation bump for the 5-row converter — old expectation failed on intended new UI and cascaded a false failure).

## What was done (all 7 tasks)
1. **Locale-aware formats** — `composeDate()` in HeroHeader: en "March 21, 2026 CE" / ja "2026年3月21日 西暦" / fa day-first "۲۱ مارس ۲۰۲۶ میلادی". All four format* helpers + Andarjah branch + Hijri.
2. **Full weekday names** — new `weekdayDateText()` (fa/en: `weekday · date`; ja: `date（weekday）`). AgendaView headers, EventDialog, TodayStrip, MonthView aria/tooltip, WeekView aria, HeroHeader today-chip (per-locale order, weekdayLong). Month grid + YearView initials intentionally untouched.
3. **Two new systems** — `imperialSolar` (Shahanshahi year = Jalali + 1180, STANDARD Jalali months, 12 months) and `ancient` (imperial math, ancient names, era `dict.eraAncient`). Facade: systemDateOf / systemToGregorian / systemMonthLength / shiftMonth / yearMonths generalized via new `systemMonthCount()` / `hasAndarjah()` / `systemTripleOf()`.
4. **Ancient month names** — `ANCIENT_MONTH_NAMES` in calendar/imperial.ts (verbatim from spec); ONE helper `systemMonthName(system, locale, month, royal)` in calendar/index.ts (takes the royal flag as a param — no store import). Wired through hero h1, MonthView masthead + select, WeekView, DayView, AgendaView, TodayStrip, YearView, converter.
5. **Weekly day off** — NEW `calendar/weekend.ts` `isWeeklyDayOff(weekendDay, locale, weekday)`; MonthView styling (was hardcoded fa-Friday), AgendaView badge, NextDayOffChip candidate set (dict.weekend label, holidays win ties), WeekView weekday-label tint.
6. **SettingsSheet** — 2 new system radios, royal-month-names Switch (id `royal-month-names`), weekly-day-off Select (id `weekend-day`) next to week-start radios.
7. **Central theme image** — FIXED_HERO_POOL 4 images/theme, heroPool index `gMonth % 4`, NEW exported `themeImageSrc(headerTheme, gMonth)`; YearView MonthCard uses it (headerTheme from settings). `seasonImageSrc` removed (YearView was its only consumer).

## Verification
- `bun /tmp/validate14.ts`: **53/53** checks + **54,300 round-trip cases** (5 systems × 1925–2105) — anchors 2026-10-11→2585/7/19 (imperialSolar) & 2585/7/25 (ancient), Nowruz 2585, 1976→2535, Andarjah 5/6, month counts/wraps, grids, name matrix, weekend matrix.
- Legacy `bun scripts/validate-calendar.ts`: **440/440**.
- `bunx tsc --noEmit`: **0 errors in src/** (pre-existing examples//skills/ sandbox noise only).
- `bun scripts/smoke.ts`: **SMOKE: PASS** (9/9, 0 console errors).
- Live agent-browser spot checks (seeded store): imperialSolar h1 "Mehr 2585 Shahanshahi" + 12-option select; royal ON→"Spandarmad 2585", OFF→"Esfand 2585"; ancient 13-option select w/ Andarjah → "Andarjah 2585 Ancient era"; fa agenda "چهارشنبه · ۲۹ مهر ۱۴۰۵ هجری شمسی" (the exact complaint case — fixed); ja chip "今日 · メフル19日（日曜日）"; en weekend=friday → 🌙 on every Friday cell; all 12 new /hero/*-{3,4}.jpg = HTTP 200.

## Notes for the coordinator
- `use-notifications.ts` localizedTodayLabel (not my file) falls back to the Imperial format for the new systems — cosmetic 3-line fix if wanted.
- `lib/client/backup.ts` system restore-guard only accepts the 3 old codes (restoring a backup made under a new system skips the field — safe default).
- SearchDialog/AddEventDialog still 3-system switches (Imperial-format fallback for new systems; no type errors).
- Full details + decisions: see Task ID 14-a entry in `worklog.md`.
