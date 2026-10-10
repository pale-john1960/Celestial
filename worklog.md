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
