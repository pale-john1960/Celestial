# Celestial 🌙✨

**A journey through time** — a multi-calendar app for the web and Android, celebrating three calendar systems, three languages, and the seasons of the year.

| Web (Next.js 16) | Android (Kotlin + Compose) |
|---|---|
| `/` (this repo root) | [`android/`](android/README.md) |

## Features

- **Three calendar systems**
  - **Gregorian** (CE)
  - **Shamsi / Jalali** (Solar Hijri, ه.ش) — pure engine validated 432/432 against ICU across 1930–2090
  - **Persian Imperial** (optional) — the ancient royal calendar: 12 fixed 30-day months + 5 *Andarjah* epagomenal days, each day carrying its Zoroastrian devotional name (Ormazd, Bahman, …)
  - **Hijri** (AH) shown alongside for religious dates
- **Three languages**: English, 日本語, فارسی (full RTL + Persian digits ۱۴۰۵) — every event name & description is translated
- **Events & holidays**
  - International observances (Valentine's, Earth Day, Halloween …)
  - 🇺🇸 US & 🇯🇵 Japan public holidays — fetched **live from the internet** (Nager.Date) with a built-in offline fallback
  - Persian cultural events (Yalda, Mehregan, Tiregan, Sadeh, Charshanbe Suri, Cyrus Day …)
  - Persian religious events (computed from the Hijri lunar calendar — Ashura, Eid al-Fitr, Eid al-Ghadir …)
  - Iranian national holidays (Nowruz 1–4, Nature Day, 22 Bahman …)
  - **Religious events can be hidden** — but legal holidays still appear as days-off
  - **Manual events** — create personal events right on the selected day (title, description, day-off flag) with ✍️ source badge
- **Moon phases** 🌑🌓🌕 — Meeus-derived engine (identical on web & Android): major-phase glyphs in month/week cells, a full phase card in Day view (name, illumination %, moon age). Validated against a live lunar reference (149/153 day-markers, new/full instants within ±5 min)
- **Offline import** — JSON / TXT / CSV with downloadable samples ([`public/samples/`](public/samples)); Jalali (1405-07-01) and Gregorian (2026-10-01) dates auto-detected, Persian digits accepted
- **ICS export** — download the agenda as a standards-compliant `.ics` (RFC 5545: CRLF, octet folding, escaped text) for Google/Apple/Outlook
- **NTP time sync** — live UDP query to `pool.ntp.org` with offset display
- **Seasonal artwork** — 2 illustrations per season with gentle CSS animations (spring cherry petals, summer fireflies, autumn leaves, winter snow); respects `prefers-reduced-motion`
- **Views**: Month (dual-date cells: big Shamsi + small Gregorian), **Week** (7 day-cards), Year, Day (all systems at once), Agenda (90 days)
- **Keyboard navigation** — arrows to move, `T` today, `M/W/Y/D/A` views, `/` search, `?` shortcut help (works in RTL too)
- **Flexible settings**: week start (Sat/Sun/Mon), theme (light/dark), per-source toggles, online mode
- **Motion & polish** — Framer Motion view transitions, staggered month-cell entrance, card hover lifts (all killed under `prefers-reduced-motion`); print-friendly month grid via `Ctrl+P`
- Android: home-screen **widgets** (date 4×2 + month grid 4×5), **status-bar date** via persistent notification, **manual events + .ics export**, low-power design (no continuous animations)

## Repository layout

```
├─ src/                    # Next.js web app
│  ├─ lib/calendar/        # calendar engine (jdn, jalali, imperial, hijri)
│  ├─ lib/i18n/            # en / ja / fa dictionaries
│  ├─ lib/events/          # datasets + rule expander + online layer
│  ├─ lib/import/          # JSON/TXT/CSV parsers
│  ├─ components/celestial/# UI components
│  └─ app/api/             # events · import · NTP routes
├─ android/                # Kotlin + Jetpack Compose app (see android/README.md)
├─ public/samples/         # sample import files (JSON/TXT/CSV)
├─ public/seasonal/        # seasonal header artwork
├─ scripts/validate-calendar.ts   # engine validation harness (432 checks)
└─ prisma/                 # ImportedEvent model (SQLite)
```

## Running the web app

```bash
bun install
bun run db:push     # SQLite + Prisma client
bun run dev         # http://localhost:3000
bun scripts/validate-calendar.ts   # 432/432 checks
```

## Accuracy notes

- Jalali engine: 33-year cycle (epoch Farvardin 1, 1386 AP = 2007-03-21 CE); matches ICU `persian` and the astronomical calendar for 1930–2090.
- Hijri: ICU `islamic-umalqura` (web) / tabular civil (Android). Religious dates may shift ±1 day with official moon sighting — as they do in real life.
- Moon phases: two-term Meeus ch.49 corrections (separate new/full vs quarter tables), per-timezone day bucketing at local noon. Markers can differ ±1 day when the true event falls within ~1 h of local midnight — 149/153 agreement with a live reference.
- Online holidays: [Nager.Date](https://date.nager.at) v3 (no key, no tracking).

## Credits

Seasonal artwork generated for this project. Built with Next.js 16, Tailwind CSS 4, shadcn/ui, Prisma, Jetpack Compose, and a love for all calendars. 💜
