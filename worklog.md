# Celestial — Worklog

Multi-agent shared worklog. Append sections with `---` separators. Never overwrite.

---
Task ID: 0
Agent: Main Coordinator (Z.ai Code)
Task: Project setup, SSH fix, requirements analysis, architecture definition

Work Log:
- Fixed corrupted SSH key from previous session (`~/.ssh/id_celestial` had lost chars during paste). Copied clean `upload/zai` over it. `git ls-remote origin` now works (exit 0). Remote repo is EMPTY — baseline push pending.
- Analyzed UI reference image `upload/My Calendar_ A Journey Through Time.png` via VLM. Design language: mobile-first card UI, seasonal illustrated hero headers with dual-date (Jalali+Gregorian) overlay, primary magenta #C2185B, cream bg #FDFBF7, white cards, charcoal #1A1A1A text, red holidays, colored event dots, view switcher (Year/Month/Week/Day/Agenda), bottom nav on mobile.
- Analyzed 6 Duck-ai mockups (all UI layouts: mobile + responsive web, seasonal headers spring/summer/autumn/winter with landscape illustration + clear sky area for text overlay).
- Verified internet access: `date.nager.at/api/v3` works — US & JP public holidays incl. Japanese local names (元日 etc.). This is the online event source.
- Dev server running on :3000, clean. Full shadcn/ui set available.

Stage Summary:
- App name: **Celestial** (repo: pale-john1960/Celestial)
- Architecture decided (see below). Key decisions:
  1. **Calendar engine** (`src/lib/calendar/`): Gregorian↔Jalali via JS `Intl` `persian` calendar (exact, no hand-ported algorithm risk; conversion via Farvardin-1 anchor scan + JDN arithmetic using Fourmilab g2d/d2g). Hijri via `Intl` `islamic-umalqura` (only Gregorian→Hijri needed, for Persian religious events). **Persian Imperial calendar**: Jalali year anchor, fixed 30-day months + 5 Andarjah epagomenal days at year end, 30 devotional Zoroastrian day names (Ormazd, Bahman, ...) shown per day.
  2. **i18n** (`src/lib/i18n/`): en/ja/fa dictionaries, fa = RTL. Event names+descriptions translated in all 3 languages.
  3. **Events** (`src/lib/events/`): built-in curated dataset (international, US, JP fallback, persian-cultural, persian-religious incl. Iranian national holidays) + online layer (date.nager.at US/JP with in-memory cache) + imported user events (Prisma, JSON/TXT/CSV parser).
  4. **Religious toggle rule**: hiding `persian-religious` category hides event text, but legal holidays still render as red day-off (per user requirement).
  5. **Web UI** (single route `/`): seasonal hero header (2 rotating images per season, cross-fade) + CSS particle animations (spring cherry-blossom, summer fireflies, autumn leaves, winter snow — transform/opacity only, capped count, `prefers-reduced-motion` respected); views: Month (default), Year, Day, Agenda; settings sheet with per-source toggles, week-start (Sat/Sun/Mon), language (en/ja/fa), calendar system (Gregorian/Shamsi/Imperial); import dialog (JSON/TXT/CSV + downloadable samples); NTP time sync via `/api/time` (dgram UDP client w/ fallback).
  6. **Android** (`android/` dir, Kotlin + Compose Material3): same design language; `android.icu.util.PersianCalendar` + `IslamicCalendar` for engine; home-screen widgets (RemoteViews); persistent notification = status-bar date; low-power (no continuous animations).
  7. State: Zustand + persist (localStorage) for settings; TanStack Query for events; Prisma only for imported events.
- Design tokens: primary #C2185B (magenta), bg #FDFBF7 cream, card #FFF, text #1A1A1A, no indigo/blue.

---
Task ID: 2
Agent: Main Coordinator (Z.ai Code)
Task: Core engine — calendar conversions, i18n, events system

Work Log:
- Built `src/lib/calendar/`: jdn.ts (Fourmilab g2d/d2g), jalali.ts (pure-JS 33-year cycle), imperial.ts (Zoroastrian day names + Andarjah), hijri.ts (ICU umalqura), index.ts (facade: monthGrid/shiftMonth/yearMonths/buildDayCell)
- `scripts/validate-calendar.ts`: 432/432 checks passed (Jalali == ICU persian 1930-2090, Nowruz anchors, Hijri spots, Imperial roundtrips). Run: `bun scripts/validate-calendar.ts`
- `src/lib/i18n/`: en/ja/fa dictionaries + month/weekday names + num() (fa→Persian digits). fa = RTL.
- `src/lib/events/`: 6 datasets (~45 rules, 3 languages each), expand.ts (day-scan matcher, cached per year), index.ts (aggregateEvents with SourceSettings + online nager.at layer + holidayOnly flag), import/parse.ts (JSON/TXT/CSV with Jalali auto-detect)
- Data fixes after cross-verification: Yalda = Azar 30 (month 9), Sepandarmazgan = Bahman 29 (month 11)
- Verified: Nowruz 2026-03-21, Eid al-Fitr 2026-03-20, Charshanbe Suri 2026-03-17 (last Tue of Esfand 1404), Sadeh Jan 30, Cyrus Day Oct 29, Sports Day Oct 12
- Prisma: ImportedEvent model (iso + jalaliIso + title + isHoliday + sourceName), db pushed
- Committed 9575bb4, pushed to GitHub

Stage Summary:
- Engine API for UI agents: monthGrid(system, y, m, weekStart, today) → DayCell[]; shiftMonth; yearMonths; imperialDayName(locale, imp); i18n: getDict(locale), gregorianMonthName/jalaliMonthName/weekdayShort/Long, num()
- Events API: aggregateEvents(fromIso, toIso, SourceSettings, imported[]) → { events, usOnline, japanOnline } (SERVER-ONLY due to nager fetch)
- holidayOnly instance = category hidden but legal holiday → render as day-off only
- Import parser: parseAuto(fileName, text) → { events: ImportedEventInput[], errors }
- Design tokens for UI: primary #C2185B, bg #FDFBF7, card #FFF, text #1A1A1A; NO indigo/blue

---
Task ID: 3-a
Agent: Web UI agent (Z.ai Code)
Task: Web UI — state, API routes, client layer, layout/fonts, all views & dialogs

Work Log:
- State: `src/store/settings.ts` (zustand persist `celestial-settings` v1: locale en/ja/fa default en; system gregorian/jalali/imperial default jalali; weekStart 0/1/6, locale-aware default fa→6 else 0 and follows locale switches; 8 source flags default true; theme light/dark/system default light) + `src/store/ui.ts` (view month/year/day/agenda default month; cursor {year,month} in ACTIVE system space via `systemDateOf`; selectedIso default today; open flags for settings/import/search + activeEvent; gotoDay/goToday/rederive — system change re-derives cursor from the SAME selected day)
- API routes (nodejs, force-dynamic):
  - `GET /api/events?from&to` + 8 optional source params (default 1): ImportedEvent rows via Prisma mapped to EventInstance {id:'imp-'+id, ruleId:'imported', category:'imported', iso, gregorian, isHoliday, emoji:'📥', names/descriptions ×3, source:'imported', dbId}; `aggregateEvents(from,to,settings,imported)`; dedupe by id (engine bug workaround, see bottom); returns {events, usOnline, japanOnline}
  - `GET /api/events/imported?from&to` (list) / `DELETE ?id=X|all=1`
  - `POST /api/events/import` (multipart `file` ≤256KB .json/.txt/.csv, `parseAuto`, ≤500 events, jalaliIso via `gregorianToJalali`, sourceName=filename, → {imported, errors})
  - `GET /api/time/ntp` — live `node:dgram` UDP query to pool.ntp.org (packet 0x1b, seconds bytes 40-47 − 2208988800, fraction bytes 44-47, 2.5s timeout) → {ok, ntpMs, deviceMs, offsetMs=ntpMs+rtt/2−deviceMs, rttMs, server}; ok:false + HTTP 200 on failure. Verified live in sandbox: rtt 8ms, offset −5ms
- Client layer `src/lib/client/api.ts`: typed fetchers + TanStack Query hooks — `useEvents(from,to,sources)` keyed [events,from,to,sourcesHash] staleTime 5m; `useNtpSync()` fetch-once + manual; `useImportedEvents`; `importEventsFile`; `deleteImportedEvents`; `useInvalidateEvents`
- Layout/fonts: `layout.tsx` — next/font Vazirmatn(400,500,700)→--font-vazir as base --font-sans + Noto Sans JP(400,500,700)→--font-noto-jp (preload off); dict.fontClass → font-sans/font-fa/font-jp (safelisted `@source inline` in globals.css); next-themes default light + enableSystem. `globals.css` — Celestial palette (light: bg #FDFBF7, card #FFF, fg #1A1A1A, primary #C2185B, border #EAE4DC; dark: bg #15130F, card #201D18, fg #F5F2EC — no indigo/blue anywhere); keyframes kenburns (24s 1→1.08), fall (9-14s, per-particle --dur/--delay/--drift-x/--rot custom props), fade-swap, pulse-soft (fireflies); all killed under prefers-reduced-motion; thin rounded scrollbars (webkit + firefox)
- Components `src/components/celestial/`: AppShell (min-h-screen flex-col; main flex-1; footer mt-auto + env(safe-area-inset-bottom) — sticky-footer verified); HeroHeader (`/seasonal/{season}-{v}.jpg` crossfade + kenburns + bottom scrim + magenta gradient fallback on error; season chip; big month name + num(year) + era; secondary line = other systems + Hijri month/year; Today chip; view Tabs; Search/Settings buttons top corners; h-64/sm:h-72/lg:h-80); SeasonalParticles (deterministic PRNG → no hydration mismatch; 12 desktop/7 mobile; petals #F9A8C9/#FAD0E0, fireflies #FFD98A pulse, leaves #E8A15A/#C96F35 rotate, snow white; transform/opacity only; motion-reduce hidden); MonthView (42 aspect-square ≥44px cells; primary number in active system + secondary tiny number; weekend red-muted (fa Thu/Fr else Sat/Sun); holiday = red + bg-red-50 dark:bg-red-950/30 + 🌙 top-right; max 4 category dots; today ring-2 ring-primary; selected bg-primary/10; out-month opacity-40; 1st click selects → TodayStrip, 2nd click → Day view; nav ‹› + month dropdown (13 imperial incl. Andarjah) + year stepper/input + Today; aria-labels prevMonth/nextMonth/goToday from dict); YearView (1/2/3/4 col month cards via `yearMonths`; seasonal mini-banners h-16 + gradient fallback; mini 7-col grids text-[10px], 2px dots, red holidays, today mark; click → month view); DayView (weekdayLong + big active date + other 2 systems + Hijri + imperial devotional name via `imperialDayName`; red day-off banner; event cards emoji/name/description/category chip/source badge ⭐🌐📥; empty state; prev/next day); AgendaView (next 90 days grouped by date; active+secondary date; 3px category color left bar; relative labels via Intl.RelativeTimeFormat; holiday badge; max-h-[70vh] custom-scrollbar); EventDialog (full detail incl. all 4 systems + devotional name); SettingsSheet (Sheet side right, flips left in RTL; RadioGroups system (+systemImperialHint)/language/weekStart; 8 source switches + religiousHiddenHolidayNote when OFF + onlineHint on online; theme RadioGroup; TimeSyncPanel; Import button; About "Celestial v1.0 · Nager.Date · pool.ntp.org"); TimeSyncPanel (status dot green/gray/red, offset +Xms, Sync now + spinner, live Celestial time = device+offset ticking 1s HH:mm:ss per locale); ImportDialog (dropzone + file input, auto-POST, sonner toasts, errors max-h-40 scroll, sample links /samples/events.{json,txt,csv} + format descriptions, imported list with both-system dates + sourceName + delete icon, Clear all behind AlertDialog); SearchDialog (substring over names+descriptions in current month range, rows date+emoji+name → click = select + Day view, quick actions Go to today / Open settings, Ctrl/Cmd+K); TodayStrip (selected-day chips + Open day); CategoryLegend (dot+label chips for enabled categories, hidden on xs)
- `page.tsx` ('use client'): QueryClientProvider (staleTime 5m, retry 1); mount-guard splash; root div dir + fontClass from dict; AppShell + view switch (max-w-6xl); mounts Settings/Search/Import/Event dialogs + sonner Toaster; locale→<html lang>; settings theme→next-themes
- Seasonal artwork: generated 8 hero images `public/seasonal/{spring,summer,autumn,winter}-{1,2}.jpg` (1344×768 progressive JPEG ~100-200KB) via z-ai image CLI — soft flat illustrations with calm upper half for overlay text (vision-verified); gradient fallbacks retained
- QA: `bun run lint` clean; `bunx tsc --noEmit` → 0 errors in src/ (remaining errors only in scaffold examples/skills dirs); full headless-browser pass (agent-browser): EN/JA/FA + RTL flip (dir/fontClass/lang, sheet side flip, Persian digits ۱۴۰۵/۱۴۰۶), default jalali "Mehr 1405 SH", imperial 13-month dropdown incl. اندارج + 5-day Andarjah grid (1405 non-leap), search نوروز→click→Day view, agenda color bars, 375px mobile no horizontal overflow, sticky footer, footer live clock + NTP dot, zero console/page errors after fixes; API round-trips: POST import 5 sample events (jalaliIso 1405-07-13 ↔ 2026-10-05 verified) → list → DELETE all=1 → empty; NTP live ok:true
- Fixes applied during QA: (1) SettingsSheet radioRow children inside .map() lacked React keys → key={id} on Label; (2) AgendaView 3px left color bar invisible — `border-s-[3px] … border-s-0` class conflict computed width 0px → width+color now inline styles; (3) YearView mini dots 4px→2px per spec; (4) About line trimmed to exact spec string

Stage Summary:
- Deviations from spec: month-cell click = 1st click select + TodayStrip, 2nd click (or "Open day") → Day view; theme = 3-option RadioGroup not <select>; SearchDialog scope = current month-grid range (shares the MonthView query cache); hero secondary line shows the other *main* system (imperial additionally shows Jalali since they share year numbering); seasonal images generated as AI illustrations (fallback gradients still coded); /api/events dedupes aggregateEvents output (engine bug, below)
- Engine bugs noticed (NOT fixed in engine — workaround only, per task rules):
  1. `aggregateEvents()` duplicates online US/JP instances: the builtin per-instance loop pushes the whole online year list once per in-range builtin instance of the same category (≈10× duplicates). Worked around by id-dedupe in `src/app/api/events/route.ts`. Root fix belongs in `src/lib/events/index.ts` (hoist online push out of the per-instance loop) — do NOT fix in engine from this task
  2. `src/lib/calendar/types.ts` was missing from the Task-2 commit (validate script passed because `import type` erases at compile time, but runtime `export * from './types'` failed) — recreated additively, see file header
  3. `systemToGregorian()` imperial branch used invalid shorthand `{year, month, day}` (param is `d`) → ReferenceError at runtime for imperial — single-token fix + comment in `src/lib/calendar/index.ts`
- Ready for coordinator commit: git add src/components/celestial src/store src/lib/client src/app/api/events src/app/api/time src/app/page.tsx src/app/layout.tsx src/app/globals.css src/lib/calendar/types.ts public/seasonal public/samples agent-ctx
