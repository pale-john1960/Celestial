# Task 8-a — Web: solstice/equinox markers, ICS import, event editing, recurring events, holiday countdown, styling polish

You are extending the **Celestial** calendar web app (Next.js 16, App Router, single route `/`, Tailwind 4 + shadcn/ui, Zustand, TanStack Query, Prisma/SQLite). The app is STABLE and fully QA'd (see worklog Tasks 0→7). Do not break existing behavior.

**MUST read first:** `/home/z/my-project/worklog.md` sections Task 3-a (web architecture), 6-a (last web round — components you'll touch) — use `sed -n '52,79p' worklog.md` and `sed -n '132,156p' worklog.md`. Then `agent-ctx/6-a-web-features.md` for style conventions.
**MUST append your work record to worklog.md at the end** (append-only, `---` separator, template at file top, Task ID: 8-a).
**DO NOT** run git commands / create tests / touch android/ (parallel agent works there).
Dev server already runs on :3000 — verify with `bun run lint`, `bunx tsc --noEmit` (src only), agent-browser QA.
Design tokens unchanged: primary #C2185B, bg #FDFBF7, card #FFF, NO indigo/blue. RTL-safe (use logical `start/end`). All motion respects prefers-reduced-motion. i18n: every new key in `types.ts` + en/ja/fa dicts (TS enforces).

## Feature 1 — Solstice & equinox markers (algorithm VALIDATED by coordinator — implement exactly)

New `src/lib/calendar/solstice.ts`:
```ts
export type SeasonEvent = "marEquinox" | "junSolstice" | "sepEquinox" | "decSolstice";
export interface SolsticeInfo { event: SeasonEvent; jd: number; localMs: number }
/** The season event falling on Gregorian date g (device-local day window), or null */
export function seasonEventOn(g: SimpleDate): SolsticeInfo | null
/** All season events for a Gregorian year (for tests/labels) */
export function seasonEventsOfYear(year: number): SolsticeInfo[]
```
ALGORITHM (validated: 8/8 anchors within ±17 min of authoritative instants):
```
SYNODIC-free, pure solar longitude (Meeus ch.25 truncated, 3 terms):
sunLon(jd):  d = jd − 2451545.0
  L  = norm(280.46646 + 0.9856474·d)                 // mean longitude (deg)
  g  = norm(357.529  + 0.98560028·d)                 // mean anomaly (deg; radians for sin)
  λ  = norm(L + 1.914602·sin g + 0.019993·sin 2g + 0.000289·sin 3g)
solve(target ∈ {0, 90, 180, 270}, seedJd):  Newton, 6 iterations:
  diff = signedNorm(target − λ(t))   // signed shortest, ±180
  t += diff / 0.9856474              // deg/day
seeds (12:00 UTC): λ=0 → Mar 20 · λ=90 → Jun 21 · λ=180 → Sep 22 · λ=27 0 → Dec 21 of the year
  (seeds are within ±1.5 d of truth for 1900–2100 — Newton converges; if |diff| > 2.5° after solve, throw/return null — safety)
Day bucketing (same convention as moon.ts): marker on date D iff event instant ∈ [D 00:00, D+1 00:00) LOCAL.
  off = new Date(g.year, g.month−1, g.day).getTimezoneOffset() / 1440  // days WEST (posix sign)
  window = [D_jdn − 0.5 − off, D_jdn + 0.5 − off)  — CHECK the sign against moon.ts's working convention and match it exactly (moon.ts uses the days-west convention that passed the Tokyo/Tehran anchors; replicate ITS exact pattern).
```
Validation anchors (MUST re-verify in QA with a throwaway script — do not commit it): Mar eq 2024 = 03-20 03:06Z (±20 min), Jun sol 2024 = 06-20 20:51Z, Sep eq 2024 = 09-22 12:44Z, Dec sol 2024 = 12-21 09:20Z, Mar eq 2026 = 03-20 14:46Z, Jun sol 2026 = 06-21 08:24Z, **Sep eq 2026 = 09-23 00:05Z**, Dec sol 2026 = 12-21 ~20:50Z.
Display:
- **MonthView + WeekView cells**: glyph in the SAME bottom-end cluster as the moon glyph (flex row gap-0.5, both ≤10px, opacity-60): ♈ marEquinox, ♋ junSolstice, ♎ sepEquinox, ♑ decSolstice. Refactor the moon glyph corner into a small cluster (aria-label from dict). Do NOT collide with dots/holiday 🌙.
- **DayView**: extend the moon card (or adjacent card) — when the day carries a season event show: glyph + localized name + "Occurs at HH:MM" (local time, num() for fa) + localized note. Hide the time if the app runs in a context where it's noisy — no, always show.
- i18n keys (exact set): `seasonMarEquinox` ("March equinox"/「春分」/"اعتدال بهاری"), `seasonJunSolstice` ("June solstice"/「夏至」/"انقلاب تابستانی"), `seasonSepEquinox` ("September equinox"/「秋分」/"اعتدال پاییزی"), `seasonDecSolstice` ("December solstice"/「冬至」/"انقلاب زمستانی"), `seasonOccursAt` ("Occurs at {t}"/「{t} に起こる」/"رخداد در ساعت {t}"), `seasonNoteEqual` ("Day and night are about equal"/「昼と夜の長さがほぼ等しい」/"طول روز و شب تقریباً برابر است"), `seasonNoteLongest` ("Longest day of the year (N. hemisphere)"/「北半球で一年で最も昼が長い」/"بلندترین روز سال (نیمکره شمالی)"), `seasonNoteShortest` ("Shortest day of the year (N. hemisphere)"/「北半球で一年で最も昼が短い」/"کوتاه‌ترین روز سال (نیمکره شمالی)"), `moonPhaseTitle` already exists.
- Optionally show the season glyph in the HeroHeader season chip tooltip — skip, keep scope.

## Feature 2 — ICS import (closes the loop with export)

`src/lib/import/parse.ts` — add `parseIcs(text: string): { events: ImportedEventInput[]; errors: string[] }`:
1. **Unfold** first: physical lines joined when a line starts with SPACE or TAB (remove CRLF/LF + exactly one leading WSP). Normalize \r\n → \n.
2. Parse `BEGIN:VEVENT` … `END:VEVENT` blocks; skip VTIMEZONE/VTODO/VJOURNAL/VALARM content. Property lines: split at the FIRST `:`; left side `NAME;PARAMS` (params ignored except where noted).
3. Per VEVENT:
   - `DTSTART`: if param `VALUE=DATE` → value `YYYYMMDD` → iso. Else datetime `YYYYMMDDTHHMMSS(Z)?` → take the DATE part (document: time-of-day ignored, timezone approximated — acceptable for an all-day calendar).
   - `DTEND` (VALUE=DATE or date part): duration = end − start (days). If ≥ 1 → multi-day: create one event per day (same title/desc), cap 30 days per VEVENT (beyond → error entry "…truncated"). If no DTEND → single day.
   - `SUMMARY` → title; `DESCRIPTION` → description — both **unescaped**: `\\n`→newline, `\\,`→`,`, `\\;`→`;`, `\\\\`→`\`.
   - `RRULE`: parse `FREQ=YEARLY` → recurYearly=true (see Feature 3); if `BYMONTH=m;BYMONTHDAY=d` present → use as the anchor month/day. FREQ=DAILY/WEEKLY/MONTHLY → import as single event on DTSTART + errors entry "RRULE {FREQ} not supported — imported as single event".
   - Skip events without valid DTSTART or empty SUMMARY (errors entry each).
   - Detect our own exports: `UID:…@celestial` — works automatically (they parse like any VEVENT).
4. Cap total events 500 (existing route rule), jalaliIso computed by the existing route logic (match how parseAuto results flow).

Wire-up:
- `src/app/api/events/import/route.ts`: accept `.ics` extension (content-type text/calendar or application/octet-stream — sniff by extension, size cap unchanged 256KB), call parseIcs when fileName endsWith .ics.
- `public/samples/events.ics` — NEW sample: 5 events — (a) simple single-day "Conference day" 2026-11-05, (b) yearly RRULE birthday 1990-06-14 (SUMMARY "Amir's birthday"), (c) 3-day trip DTSTART 2027-04-02 DTEND 2027-04-05 "Kyoto trip", (d) isHoliday-ish note: put "(Day off)" in SUMMARY? NO — import parser has no holiday concept… see Feature 3 for the holiday flag: NOT supported via ICS (RFC has no holiday flag) — document in ImportDialog hint. (e) an event with a comma + semicolon in SUMMARY to prove escaping ("Tea, cookies; and talks").
- `ImportDialog.tsx`: accept attr adds `.ics`; format list gains an ICS row (i18n `importFormatIcs`: "Calendar file (.ics) — Google/Apple/Outlook exports; yearly RRULE and multi-day events supported"/ja/fa); sample link `samples/events.ics`.
- i18n: `importFormatIcs` + any toast strings reused from existing keys.

## Feature 3 — Recurring annual events (birthdays!)

- **Prisma schema**: `ImportedEvent` gains `recurYearly Boolean @default(false)`. Edit `prisma/schema.prisma`, then run `bun run db:push` (safe, additive). Existing rows default false.
- **Expansion in `src/app/api/events/route.ts` GET**: when a row has recurYearly:
  - Anchor instance: existing mapping (id `imp-{id}`, iso = stored iso) + `recurring: true, anchorIso: row.iso`.
  - Additional years: for each year y in [fromG.year .. toG.year] where y ≠ anchor year: event date = (y, row month/day) EXCEPT Feb 29 anchor in non-leap y → Feb 28 (documented fallback). Only include if the resulting iso ∈ [from, to]. id = `imp-{id}-y{y}` (dedupe-safe), same dbId (so deleting the row kills the series), `recurring: true, anchorIso: row.iso`.
  - **EventInstance type** (`src/lib/events/types.ts`): add `recurring?: boolean; anchorIso?: string` (additive).
  - `holidayOnly` + source toggles apply as usual (category 'imported'/'manual').
- **AddEventDialog**: new Switch "Repeats yearly" (i18n `addEventYearly`: "Repeats every year"/「毎年繰り返す」/"هر سال تکرار می‌شود") — hint text (`addEventYearlyHint`: "Birthdays, anniversaries"/「誕生日や記念日」/"تولدها و سالگردها"). Saved to the row.
- **Badges**: 🔁 chip on recurring event cards (DayView/WeekView cards + AgendaView rows + EventDialog) — small outline badge like the holiday one, tooltip/aria "Repeats yearly". i18n `recurringYearly`.
- **ICS export** (`src/lib/client/ics.ts`): export ONLY the anchor instance of each series (instance where `iso === anchorIso` when recurring) and add `RRULE:FREQ=YEARLY` to it; skip the expanded instances. Non-recurring unchanged. (Round-trip: export→import restores recurring ✓)
- **Import parsers**: JSON: optional `"recurYearly": true` field (bump the JSON parser; document in ImportDialog hint + update `public/samples/events.json` to include one recurring entry). TXT/CSV: optional trailing column `yearly` (value `yearly`/`true`/`1`) — keep backward compat (existing files keep working). Update samples + ImportDialog format docs.
- **Edit** (Feature 4) edits the anchor row → whole series updates.
- ImportDialog imported-list rows: recurring rows show 🔁 next to title.

## Feature 4 — Event editing (complete CRUD)

- **API** `PATCH /api/events/custom/route.ts` (or extend the custom route file): body `{ id, iso, title, description?, isHoliday, recurYearly }` — validate like POST; update row by id; 404 if missing. Return updated row.
- **Client api.ts**: `updateEvent(input)` mutation + `useInvalidateEvents()` reuse.
- **ui store**: `addOpen: boolean; editEvent: {id, iso, title, description, isHoliday, recurYearly} | null` + setters + `openAddDialog()` (fresh, date defaults to selectedIso) / `openEditDialog(evt)`. Hero Plus button and all entry points go through the store.
- **AddEventDialog**: when `editEvent` present → edit mode: prefill all fields (incl. recurYearly), title "Edit event", submit → PATCH → toast (`eventUpdated`: "Event updated"/「イベントを更新しました」/"رویداد به‌روزرسانی شد") → invalidate + close. In edit mode add a destructive "Delete" button (existing delete endpoint, confirm via existing pattern) → toast → close.
- **Entry points for Edit**: (1) EventDialog (event detail) — "Edit" button (only when `instance.dbId` exists, i.e. imported/manual); (2) ImportDialog row — pencil icon (lucide `Pencil`) next to the existing delete icon.
- i18n: `editEvent` ("Edit event"/「イベントを編集」/"ویرایش رویداد"), `eventUpdated`, `deleteEvent` ("Delete event"/「イベントを削除」/"حذف رویداد"), `saveChanges` ("Save changes"/「変更を保存」/"ذخیره تغییرات").

## Feature 5 — Next-day-off countdown chip

- New small component `NextDayOffChip.tsx`: useQuery /api/events from=today to=today+90d (same source-flag params as other views — read from settings store), pick first event with isHoliday (holidayOnly included — it IS a day off) strictly ≥ today (0 = today, show "today"), sorted by iso. Render a pill: 🗓 or lucide `CalendarClock` + `nextDayOff: "Next day off: {name} · in {n} days"` (i18n; n via num(); "in 0 days" → `nextDayOffToday: "Next day off today: {name}"`; n=1 → "tomorrow" variant optional — keep {n} but use dict-relative like agenda's existing relative labels if trivial). Name truncated max ~24 chars + title attr. Click → gotoDay(iso). Loading → skeleton pill; none found in 90d → hidden. `data-no-print`.
- Placement: HeroHeader bottom area (next to/near the Today chip — responsive, RTL-safe) OR TodayStrip — pick what integrates cleanly; must not overlap existing elements on 375px.

## Feature 6 — Styling polish (mandatory "more details")

1. **Season-tinted hero scrim**: in HeroHeader, under the existing dark scrim add a season tint layer: spring `bg-[#EC4899]/15`, summer `bg-[#F59E0B]/15`, autumn `bg-[#D97706]/20`, winter `bg-[#78716C]/15` (stone — NO blue). mix-blend-overlay or plain alpha — must look subtle, keep text contrast ≥ AA on the title area. Reduced-motion irrelevant (static).
2. **Sticky agenda month headers**: AgendaView month-group headers get `sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b` (verify it doesn't fight the existing custom-scrollbar container).
3. **EventDialog emoji tile**: emoji sits in `size-12 rounded-2xl bg-primary/10 grid place-items-center text-2xl` tile (visual anchor at top of dialog).
4. **Astronomy glyph cluster** (Feature 1): moon + season glyphs in one bottom-end flex cluster in cells.
5. **Dark mode elevation audit**: cards in dark mode get subtle `dark:shadow-sm` + `dark:border-white/10` where borders currently fade (DayView/WeekView cards, AgendaView rows). Light-touch — don't restyle everything.
6. **Countdown chip** (Feature 5) styled as a polished pill with hover state.
7. Print: countdown chip + sticky headers get `data-no-print`; season glyphs/moon glyphs print fine (tiny).
8. Keep ALL existing behavior: footer sticky, keyboard nav, reduced-motion, tabular-nums.

## QA checklist (all mandatory; fix everything found)
1. `bun run lint` clean · `bunx tsc --noEmit` 0 errors in src/ · zero console/page errors.
2. Season anchors script (temporary, don't commit): 8 anchors within ±20 min (see Feature 1 list).
3. agent-browser (EN + fa, desktop + 375px mobile):
   - Month view: Sep 2026 shows ♎ on **Sep 23** (sandbox browser is UTC); Mar 2026 ♈ on Mar 20; Jun 2026 ♋ on Jun 21; Dec 2026 ♑ on Dec 21. DayView card on Sep 23 2026: "September equinox · Occurs at 00:06" (browser UTC) + equal-day note. Moon glyph + season glyph never collide (find a day with… they're on different days mostly — just verify cluster layout visually).
   - Nowruz tie-in: Mar 20 2026 shows BOTH ♈ and (Farvardin 1) Nowruz event — nice screenshot.
   - ICS import: upload `public/samples/events.ics` → toast count; birthday (yearly, 1990-06-14 anchor) appears in June 2026 month view with 🔁; Kyoto trip = 3 events Apr 2-4 2027; escaped-title event correct. Then export agenda → re-import the exported file → recurring exported with RRULE (verify file content: RRULE:FREQ=YEARLY present, only ONE instance of the series in the file) → round trip.
   - Edit: create manual event → EventDialog → Edit → change title + mark yearly → PATCH → card updates + 🔁 + appears next year (navigate month +1y) → Delete via dialog → gone.
   - JSON import with recurYearly + CSV with `yearly` column still work (backward compat: old samples still import).
   - Countdown chip: shows "Next day off: … · in 1 days" (Oct 12 2026 = Columbus/Sports Day) — click → Day view. Hidden if all holiday sources toggled off.
   - Religious-toggle regression: Tir 4 1405 (Jun 25 2026) day-off-only rule still intact. Week view/moon/keyboard/NTP/footer quick regression.
   - fa RTL: cluster position end-corner correct; countdown pill RTL; sticky headers RTL.
   - Mobile 375px: no horizontal overflow anywhere; countdown chip wraps gracefully.
   - Screenshots: month Sep 2026 (♎ + holidays), DayView Sep 23 (astronomy card), agenda sticky headers, hero season tint (4 seasons if cheap — at least autumn+spring).
4. VLM check 2-3 key screenshots; fix real findings (ignore false alarms — document).

## Deliverables
Code + QA fixes; lint/tsc clean; worklog.md append (Task ID: 8-a): files, i18n keys added, solstice algorithm constants (for Android port), QA results incl. anchor verification table, deviations, known issues.
