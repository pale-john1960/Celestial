# Task 6-a — Web: new features + Framer Motion styling polish

You are implementing new features for the **Celestial** calendar web app (Next.js 16, App Router, single route `/`, Tailwind 4 + shadcn/ui, Zustand, TanStack Query). The app is STABLE and fully QA'd — do not break existing behavior.

**MUST read before working:** `/home/z/my-project/worklog.md` (all sections — especially Tasks 0, 2, 3-a, 4+5) and `agent-ctx/3-a-web-ui.md`.

**MUST append your work record to worklog.md at the end (append, never overwrite, `---` separator, use the template).**

**DO NOT run git commands** (no commit/push — coordinator handles git).
**DO NOT create tests.** Verify with `bun run lint` + `bunx tsc --noEmit` (src/ only) + `agent-browser` QA.

## Design tokens (unchanged, mandatory)
Primary #C2185B magenta, bg #FDFBF7 cream, card #FFF, text #1A1A1A, **NO indigo/blue**. Dark mode variants exist in globals.css. RTL: fa locale flips dir. All animations must respect `prefers-reduced-motion`.

## Features to implement (all 6)

### 1. Week view (spec gap — reference UI had Year/Month/Week/Day/Agenda)
- Add `"week"` to `ViewMode` union in `src/store/ui.ts`. Order in UI: month, week, year, day, agenda.
- New component `src/components/celestial/WeekView.tsx`:
  - Week = 7 days starting at `weekStart`, containing **selectedIso** (selection-driven).
  - Derive: `firstDayJdn = toJdn(parseIso(selectedIso)) - offset` where offset = (weekday(selectedIso) - weekStart + 7) mod 7 (use `jdnWeekday` from `@/lib/calendar/jdn`). Render 7 consecutive days via `fromJdn`.
  - Layout: responsive grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7`; each day = a Card: header (weekday long, active-system day number big + `num()`, month name when day is 1st of month, secondary systems small line, Hijri date tiny; holiday → red text + 🌙; today → ring-2 ring-primary; out-of-week never happens), body = event list (same event card styling as DayView: emoji, name, category dot color, description 1-line clamp, holidayOnly rule → show "day off" chip only). Empty day → muted "no events" line.
  - Events: reuse the SAME TanStack query pattern as MonthView (range = first..last day of the week, same key shape so cache is shared when ranges overlap).
  - Navigation bar above grid: ‹ prev week / › next week (shift selectedIso ±7 days via `selectDay` — cursor follows so HeroHeader month updates when the week crosses months), week range label (e.g. "Mehr 25 – Aban 1, 1405"), "This week" button (goes to today's week). aria-labels via dict.
  - Cell click → `selectDay(iso)`; 2nd tap on already-selected day or "Open day" → `gotoDay`.
- HeroHeader tabs: `grid-cols-4` → `grid-cols-5`, add `["week", dict.viewWeek]` between month and year.
- page.tsx view switch: add `{view === "week" && <WeekView />}`.

### 2. Moon phases (thematic for "Celestial")
- New `src/lib/calendar/moon.ts` (pure, shared later with Android):
  ```ts
  export interface MoonInfo {
    phaseIndex: number;   // 0..7 → 0 new 🌑, 1 waxing crescent 🌒, 2 first quarter 🌓, 3 waxing gibbous 🌔, 4 full 🌕, 5 waning gibbous 🌖, 6 last quarter 🌗, 7 waning crescent 🌘
    phase: number;        // 0..1 of synodic cycle
    illum: number;        // 0..1 illuminated fraction (at local noon)
    ageDays: number;      // days since the true new moon of this cycle (at local noon)
    major: 'new' | 'firstQ' | 'full' | 'lastQ' | null;  // major-phase event falling on THIS date (local day window)
  }
  export function moonInfo(g: SimpleDate): MoonInfo
  // internally: jdn = toJdn(g); off = -new Date(g.year, g.month-1, g.day).getTimezoneOffset()/1440 (days east of UTC)
  ```
  ALGORITHM (VALIDATED by coordinator against icalendar37.net live API — 149/153 day-markers agree; new/full anchors within ±5 min). Implement EXACTLY:
  ```
  SYNODIC = 29.530588853
  BASE     = 2451550.09766   // Meeus ch.49 mean new-moon epoch (k=0), NOT the 18:14 true instant
  MAJORS   = [ {m:'new',pos:0}, {m:'firstQ',pos:7.38264721}, {m:'full',pos:14.76529443}, {m:'lastQ',pos:22.14794164} ]

  anomalies(jd): d = jd - 2451545.0
    Mp = TAU * frac(134.963/360 + 13.064993*d/360)   // moon mean anomaly (Meeus M')
    Ms = TAU * frac(357.529/360  + 0.98560028*d/360) // sun mean anomaly (Meeus M)

  corrAt(jd, pos): // Meeus ch.49, two dominant terms per table, E≈1
    if pos is 7.38264721 or 22.14794164:  -0.62814*sin(Mp) + 0.17172*sin(Ms)   // QUARTER table
    else:                                  -0.40720*sin(Mp) + 0.17241*sin(Ms)   // NEW/FULL table

  // per calendar date D (jdn = toJdn(gregorian(D)), noon UTC; off = -new Date(D).getTimezoneOffset()/1440, days east):
  localNoon     = jdn + off
  ageMean       = mod(localNoon - BASE, SYNODIC)
  cycleStart    = localNoon - ageMean                  // MEAN new moon that started this cycle
  trueNewStart  = cycleStart + corrAt(cycleStart, 0)
  age           = localNoon - trueNewStart              // → phase = age/SYNODIC, illum = (1-cos(TAU*phase))/2, phaseIndex = floor(phase*8+0.5)%8
  markers = []  // which major glyphs fall on D's LOCAL day:
  for shift of [-SYNODIC, 0, SYNODIC]:
    for {m,pos} of MAJORS:
      meanEvt = cycleStart + shift + pos
      evt     = meanEvt + corrAt(meanEvt, pos)
      if evt >= jdn - 0.5 + off && evt < jdn + 0.5 + off: markers.push({m, evt})  // D 00:00..D+1 00:00 local time
  // normally 0 or 1 marker; if 2 (boundary), keep the one with smaller |evt - localNoon|
  ```
  Validation anchors (MUST verify in QA, all pass with this algorithm):
  - 2024-04-08 (UTC off=0): marker `new`, event ≈18:19 UTC (true 18:21 — total solar eclipse)
  - 2024-09-18 (UTC): marker `full`, event ≈02:33 UTC (true 02:34 — lunar eclipse)
  - 2024-04-08 in Asia/Tokyo (off=+9/24): marker on **2024-04-09** (03:19 JST), none on 04-08
  - 2026-10 (UTC): lastQ Oct 3, new Oct 10, firstQ Oct 18, full Oct 26 (matches icalendar37.net)
  Accuracy: new/full ±5 min, quarters ±2 h; day-markers agree with live reference in 149/153 cases (disagreements only when the true event is within ~1 h of local midnight). Document this in KDoc/comment.
- Display:
  - **MonthView cells**: bottom-right tiny glyph (text-[10px] leading-none opacity-60): 🌑/🌓/🌕/🌗 by `major`, only when major ≠ null. Position `absolute bottom-1 end-1` (end = logical, RTL-safe). Must NOT collide with category dots (dots are bottom-left `start` side — verify actual current layout and adapt).
  - **DayView**: new "Moon" card after the date header block (before events): phase icon = emoji per phaseIndex (🌑🌒🌓🌔🌕🌖🌗🌘), phase name (i18n), `illum`% and `age` days (num() for fa), styled like other DayView cards. Show on every day.
  - **WeekView**: same tiny glyph rule as MonthView (major only), in the day-card header end corner.
- i18n keys (types.ts + en/ja/fa dicts — ALL must stay type-complete): `moonPhaseTitle` ("Moon phase"/「月相」/"فاز ماه"), `moonNew`..`moonWaningCrescent` (8 names), `moonIllumination` ("Illumination"/「輝面比」/"روشنایی"), `moonAge` ("Moon age"/「月齢」/"سن ماه"). Use proper Japanese: 新月, 三日月 (waxing crescent), 上弦 (first quarter), 十三夜月... use standard: 新月/三日月/上弦の月/盈凸月(わいたりづき? use 盈月)... FINAL Japanese set (use exactly): 新月, 三日月, 上弦の月, 盈凸月, 満月, 虧凸月, 下弦の月, 有明月. Persian: ماه نو, هلال ربع اول (three-quarter?) — use: ماه نو, هلال نو‌ظهور... FINAL Persian set (use exactly): «ماه نو», «هلال صعودی», «ربع اول», «ماه شکوفه»... simpler & correct: «ماه نو», «هلال صعودی», «ربع اول», «ماه گیب صعودی», «ماه کامل», «ماه گیب نزولی», «ربع آخر», «هلال نزولی».

### 3. Manual event creation (CRUD gap — currently only file import)
- API `POST /api/events/custom/route.ts`: body `{ iso, title, description?, isHoliday? }`. Validate: iso parseable, title trim 1..120 chars, description ≤500, booleans. Insert `ImportedEvent` row with `sourceName: "manual"`, `jalaliIso` via `gregorianToJalali`. Return created row. 400 on invalid with `{ error }`.
- `GET /api/events/route.ts` `rowToInstance`: when `row.sourceName === "manual"` → `emoji: "✍️"`, `source: "manual"`, `provider: "manual"`. Extend the `source` union in `src/lib/events/types.ts` EventInstance: `'builtin' | 'online' | 'imported' | 'manual'` (keep dbId so delete works).
- `SourceBadge` (DayView.tsx exports it — check AgendaView/EventDialog too): add ✍️ manual case (label from new i18n `sourceManual`: "Manual"/「手動」/"دستی").
- New `AddEventDialog.tsx`: trigger = new icon button in HeroHeader top bar (lucide `Plus`, aria-label dict.addEvent) next to Search. Dialog:
  - Date: `<Input type="date">` default selectedIso, min 1900-01-01 max 2100-12-31. Below it, live conversion line (all systems + Hijri) that updates as date changes — reuse formatting from DayView.
  - Title Input (required), description Textarea, isHoliday Switch (label dict.dayOff with hint), category stays "imported".
  - Submit → POST → invalidate `events` + `imported` queries → toast (sonner) success dict.addEventSaved; errors → toast destructive.
  - Deleting manual events works via existing ImportDialog row delete (dbId) — in ImportDialog, render sourceName badge (✍️ for manual rows, 📥 otherwise) so users can manage them there.
- i18n keys: `addEvent` ("Add event"/「イベントを追加」/"افزودن رویداد"), `addEventTitle` ("New event"/「新しいイベント」/"رویداد جدید"), `addEventDate` ("Date"/「日付」/"تاریخ"), `addEventName` ("Title"/「タイトル」/"عنوان"), `addEventNamePh` ("e.g. Family gathering"/「例：家族の集まり」/"مثلاً دیدار خانوادگی"), `addEventDesc` ("Description"/「説明」/"توضیحات"), `addEventHoliday` ("Mark as day off"/「休日にする」/"تعطیل رسمی"), `addEventSaved` ("Event added"/「イベントを追加しました」/"رویداد افزوده شد"), `sourceManual`.

### 4. Keyboard navigation + shortcuts help
- Global keydown in page.tsx (skip when e.target is input/textarea/select or contentEditable, skip when any dialog/sheet open — check via useUi flags + document.activeElement):
  - `←`/`→`: month view → cursor ±1 month (setCursorMonth with clamp via shiftMonth, selectedIso unchanged); week/day view → selectedIso ∓/±1 day (selectDay, cursor follows; in week view if crossing week edge it naturally moves because week is derived from selectedIso); year view → cursor.year ±1.
  - `t`/`T`: goToday (keep view). `m` `y` `w` `d` `a`: switch views. `s`: open settings. `?` (shift+/): open shortcuts dialog. `/`: focus/open search (Ctrl+K already exists).
  - RTL note: ←/→ stay PHYSICAL (left key = previous) — do not flip; document in shortcuts dialog.
- New `ShortcutsDialog.tsx` (Dialog, subtle 2-col table: keys badges `<kbd>` styled `rounded border bg-muted px-1.5 font-mono text-[11px]`, labels i18n). Mount in page.tsx. Add small icon button in HeroHeader (lucide `Keyboard`, aria-label dict.shortcuts) next to Plus.
- i18n: `shortcuts` ("Shortcuts"/「ショートカット」/"کلیدهای میان‌بر"), plus a label for each row (~10 rows: prev/next, today, views ×5, search, settings, shortcuts help).

### 5. ICS export (Agenda toolbar)
- `src/lib/client/ics.ts`: `buildIcs(events: EventInstance[], locale: LocaleCode, dict): string`.
  - Header: `BEGIN:VCALENDAR` `VERSION:2.0` `PRODID:-//Celestial//Calendar//EN` `CALSCALE:GREGORIAN`. Per event `VEVENT`: `UID:${id}@celestial`, `DTSTAMP:` now UTC `YYYYMMDDTHHMMSSZ`, `DTSTART;VALUE=DATE:${isoCompact}`, `DTEND;VALUE=DATE:${iso+1day compact}` (exclusive, RFC 5545), `SUMMARY:` name (+ ` (holiday)` if isHoliday — use dict.dayOff), `DESCRIPTION:` description + ` · ` + source badge label. Escape `\` `;` `,` and newlines (`\\n`); fold lines at 74 chars with CRLF + space continuation. CRLF endings throughout.
- Button in AgendaView toolbar (next to refresh Button): lucide `Download`, label dict.exportIcs ("Export .ics"/「.ics を書き出す」/"خروجی .ics"). onClick → buildIcs(currently loaded events of the active query incl. filters) → Blob `text/calendar` → `URL.createObjectURL` → `<a download="celestial-agenda-{todayIso}.ics">` click → revoke. Disabled + tooltip when list empty. Toast success with count.
- i18n: `exportIcs`, `exportIcsDone` ("Exported {n} events"/ use plain sentence, ja:「{n}件のイベントを書き出しました」, fa:"{n} رویداد خروجی گرفته شد").

### 6. Framer Motion styling polish (framer-motion@12 already installed)
- `useReducedMotion()` from framer-motion: when true → render without initial/animate (or `MotionConfig reducedMotion="user"` wrapper in page.tsx root — PREFERRED, simpler).
- View transitions in page.tsx: wrap the view container in `<AnimatePresence mode="popLayout" initial={false}>` + `<motion.div key={view} initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} exit={{opacity:0, y:-8}} transition={{duration:0.22, ease:"easeOut"}}>`.
- MonthView: cells → `motion.button` with `initial={{opacity:0, scale:0.96}} animate={{opacity:1, scale:1}} transition={{duration:0.16, delay: Math.min(i*0.006, 0.25)}}` — keyed by month so navigation replays; keep ALL existing classes/handlers/aria. (i = cell index in the 42-grid.)
- Interactive cards lift: DayView event cards + WeekView day cards + AgendaView rows: `whileHover={{ y: -2 }}` + `transition={{duration:0.15}}` on the motion wrapper of clickable card (cursor-pointer). Month nav buttons: add CSS `active:scale-95 transition-transform`.
- HeroHeader: the month-title block gets `motion.div key={heroKey}` (heroKey = active month name+year) fade+rise 240ms.
- IMPORTANT perf rules: transform/opacity only; no new infinite animations; everything under MotionConfig reducedMotion="user"; keep CSS `prefers-reduced-motion` kills as-is.

### 6b. Additional styling details (mandatory "more details")
- globals.css: add `@media print` block: hide `[data-no-print]` elements; force `color-scheme: light`; `body { background: white }`; month grid cells `break-inside: avoid`. Add `data-no-print` attr to: HeroHeader root, view Tabs, search/settings/plus/keyboard buttons, footer, CategoryLegend, all nav toolbars (MonthView/WeekView/DayView nav rows, AgendaView toolbar). AgendaView rows keep printing (useful). Add a "Print" item? NO — browser print (Ctrl+P) just works.
- globals.css: `::selection { background: oklch or rgb of primary at 25% }` use `rgba(194,24,91,0.25)`.
- Day numbers: add `tabular-nums` to MonthView/WeekView/DayView numeric displays (font-variant-numeric) for steady grids.
- Empty states: DayView/WeekView/AgendaView empty states get `border-dashed` muted cards with the existing emoji, slightly larger, centered.
- Audit focus-visible: every interactive element (cells, buttons, tabs, switches) must show `focus-visible:ring-2 ring-ring ring-offset-1` — fix gaps found.
- Hover on month cells: keep `hover:bg-accent`, add `hover:z-10` + subtle `hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)]`.

## i18n workflow
ALL new keys go into: `src/lib/i18n/types.ts` LocaleDict interface + all 3 dicts (`en.ts`, `ja.ts`, `fa.ts`) — TypeScript enforces completeness. Natural translations (see suggested strings above; you may refine wording but keep meaning; Japanese polite です/ます style matching existing dict; Persian formal matching existing dict).

## QA checklist (do ALL, fix everything you find)
1. `bun run lint` clean; `bunx tsc --noEmit` → 0 errors in src/.
2. agent-browser (dev server already running on :3000):
   - EN + JA + FA: all 5 views render; week view navigation ±7 days; week label correct across month boundary; today ring; holiday red + 🌙; moon glyph on a known full-moon day (verify with your algorithm: find the next full moon from today and navigate there).
   - Moon: DayView shows phase card (illumination % sane 0-100, phase name); month view shows 🌕 exactly on the computed day (±1).
   - Add event: create "Test manual" on a chosen date → appears in month view with ✍️ + in agenda + EventDialog shows Manual badge + delete via ImportDialog row icon → gone.
   - ICS: agenda export downloads; verify file content has BEGIN:VCALENDAR, folding, escaping (test an event title containing a comma).
   - Keyboard: ←/→ month nav; w switches to week; t today; ? opens shortcuts; typing in inputs does NOT trigger.
   - RTL fa: week view grid + moon glyph end-corner correct; shortcuts dialog RTL ok.
   - prefers-reduced-motion: emulate `agent-browser set ...`? If not available via CLI, verify MotionConfig reducedMotion="user" code path + CSS media query (code review).
   - Mobile 375px: week view stacks (1 col), no horizontal overflow; print CSS: `agent-browser pdf /tmp/print.pdf` and check it renders (or emulate media print via eval matchMedia).
   - Zero console/page errors.
3. Verify NO regression: religious toggle day-off rule still works on a hidden religious holiday; import flow still works; NTP panel intact.

## Deliverables
- All code + QA fixes above; lint/tsc clean; agent-browser QA log in your worklog entry.
- worklog.md append (template in worklog header) with: files created/modified, exact i18n key list added, moon algorithm constants (for Android porting), QA results, deviations, known issues.
