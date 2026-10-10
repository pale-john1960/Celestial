# Task 3-a — Web UI agent (Z.ai Code) — work record

Task: build the web UI for **Celestial** (multi-calendar app). Repo: `/home/z/my-project`.

> NOTE for later agents: the shared worklog `/agent-ctx` path at filesystem root is not writable in
> this sandbox; records live in `/home/z/my-project/agent-ctx/` instead. Previous agents' records:
> Task 0 + 2 wrote `/home/z/my-project/worklog.md` (read it — engine/i18n/events/parse are COMPLETE,
> frozen, consume-only).

## What this task delivered

All files from the task spec, plus QA fixes. Everything is in the working tree, UNCOMMITTED
(coordinator commits — per task rules no `git commit` was made by this agent).

### Files (all under `/home/z/my-project`)

- `src/store/settings.ts` — zustand persist `celestial-settings` (locale/system/weekStart/sources/theme)
- `src/store/ui.ts` — view/cursor (ACTIVE system space)/selectedIso/dialog flags/activeEvent + rederive
- `src/app/api/events/route.ts` — GET aggregate (+ imported rows via Prisma, id-dedupe workaround)
- `src/app/api/events/imported/route.ts` — GET list / DELETE one|all
- `src/app/api/events/import/route.ts` — POST multipart (≤256KB, .json/.txt/.csv, ≤500)
- `src/app/api/time/ntp/route.ts` — live UDP NTP (pool.ntp.org), ok:false+200 on failure
- `src/lib/client/api.ts` — typed fetchers + TanStack Query hooks (useEvents/useNtpSync/…)
- `src/app/layout.tsx` — Vazirmatn + Noto Sans JP, next-themes (default light)
- `src/app/globals.css` — Celestial palette (light/dark), kenburns/fall/fade-swap/pulse-soft,
  reduced-motion guards, thin scrollbars; font safelist for dict.fontClass
- `src/app/page.tsx` — client root: QueryClientProvider, dir+fontClass, view switch, dialogs, Toaster
- `src/components/celestial/` — AppShell, HeroHeader, SeasonalParticles, MonthView, TodayStrip,
  YearView, DayView, AgendaView, EventDialog, SettingsSheet, TimeSyncPanel, ImportDialog,
  SearchDialog, CategoryLegend
- `public/seasonal/{spring,summer,autumn,winter}-{1,2}.jpg` — 8 generated hero images (1344×768
  progressive JPEG); gradient fallbacks still coded for missing images

### Verification performed

- `bun run lint` clean; `bunx tsc --noEmit` → 0 errors under `src/`
- Headless browser (agent-browser): EN/JA/FA + RTL, imperial 13-month dropdown incl. Andarjah
  (5-day grid for 1405), search→day view, agenda 3px color bars, 375px no overflow, sticky footer,
  zero console/page errors after fixes
- API round-trip: import 5 sample events → list → clear all; live NTP ok:true (rtt 8ms)
- dev.log clean apart from historical Fast-Refresh warnings from the prior editing session

## Engine bugs noticed (consume-only — do NOT fix from this task)

1. `aggregateEvents()` (`src/lib/events/index.ts`) emits online US/JP instances once per in-range
   builtin instance of the same category → ~10× duplicates. Worked around by id-dedupe in
   `src/app/api/events/route.ts`. Root fix: hoist the online push out of the per-instance loop.
2. `src/lib/calendar/types.ts` was missing from the Task-2 commit (compile-time `import type`
   erased → validate passed; runtime `export * from './types'` failed). Recreated additively.
3. `systemToGregorian()` imperial branch used invalid shorthand `{year, month, day}` (param is `d`)
   → ReferenceError at runtime for imperial. Single-token fix + comment in
   `src/lib/calendar/index.ts`.

## Spec deviations (all minor, documented in worklog too)

- Month cell: 1st click selects (+ TodayStrip), 2nd click/"Open day" → Day view
- Theme = 3-option RadioGroup (light/dark/system), not a native select
- SearchDialog scope = current month-grid range (shares MonthView query cache)
- Hero secondary line shows the other main system; imperial additionally shows Jalali
- Seasonal images = generated AI illustrations (spec allowed missing + fallback)
