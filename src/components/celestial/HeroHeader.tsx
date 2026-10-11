// Celestial — seasonal hero header with dual-date overlay + view switcher.
// Also exports the cross-view date formatting helpers (hijri month names etc).
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarSearch, Keyboard, Plus, Search, Settings2 } from "lucide-react";
import {
  gregorianMonthName,
  getDict,
  jalaliMonthName,
  num,
  weekdayShort,
} from "@/lib/i18n";
import type { LocaleCode, LocaleDict } from "@/lib/i18n";
import {
  gregorianToHijri,
  gregorianToImperial,
  gregorianToJalali,
  systemToGregorian,
  systemDateOf,
  todayGregorian,
} from "@/lib/calendar";
import { jdnWeekday, toJdn } from "@/lib/calendar/jdn";
import type { HijriDate, SimpleDate, ImperialDate } from "@/lib/calendar";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeasonalParticles } from "./SeasonalParticles";
import type { Season } from "./SeasonalParticles";

/* ---------------- shared date display helpers ---------------- */

const HIJRI_MONTHS: Record<LocaleCode, string[]> = {
  en: [
    "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
    "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaban",
    "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah",
  ],
  ja: [
    "ムハッラム", "サファル", "ラビー・アル=アウワル", "ラビー・アッ=サーニー",
    "ジュマーダー・アル=アウワル", "ジュマーダー・アッ=サーニー", "ラジャブ", "シャアバーン",
    "ラマダーン", "シャウワール", "ズー・アル=カアダ", "ズー・アル=ヒッジャ",
  ],
  fa: [
    "محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی",
    "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان",
    "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه",
  ],
};

export function hijriMonthName(locale: LocaleCode, month: number): string {
  return HIJRI_MONTHS[locale][month - 1] ?? "";
}

export function formatGregorianDate(
  locale: LocaleCode,
  g: SimpleDate,
  dict: LocaleDict,
): string {
  return `${gregorianMonthName(locale, g.month)} ${num(locale, g.day)}, ${num(locale, g.year)} ${dict.eraGregorian}`;
}

export function formatJalaliDate(
  locale: LocaleCode,
  j: SimpleDate,
  dict: LocaleDict,
): string {
  return `${jalaliMonthName(locale, j.month)} ${num(locale, j.day)}, ${num(locale, j.year)} ${dict.eraJalali}`;
}

export function formatHijriDate(
  locale: LocaleCode,
  h: HijriDate,
  dict: LocaleDict,
): string {
  return `${hijriMonthName(locale, h.month)} ${num(locale, h.day)}, ${num(locale, h.year)} ${dict.hijriLabel}`;
}

export function formatImperialDate(
  locale: LocaleCode,
  imp: ImperialDate,
  dict: LocaleDict,
): string {
  if (imp.month === 13) {
    return `${dict.andarjah} ${num(locale, imp.day)}, ${num(locale, imp.year)} ${dict.eraImperial}`;
  }
  return `${jalaliMonthName(locale, imp.month)} ${num(locale, imp.day)}, ${num(locale, imp.year)} ${dict.eraImperial}`;
}

/* ---------------- season helpers ---------------- */

const SEASON_START: Record<Season, number> = {
  spring: 3,
  summer: 6,
  autumn: 9,
  winter: 12,
};

const SEASON_EMOJI: Record<Season, string> = {
  spring: "🌸",
  summer: "✨",
  autumn: "🍂",
  winter: "❄️",
};

/** Gregorian month 3-5 → spring, 6-8 summer, 9-11 autumn, 12-2 winter */
export function seasonOf(gMonth: number): Season {
  if (gMonth >= 3 && gMonth <= 5) return "spring";
  if (gMonth >= 6 && gMonth <= 8) return "summer";
  if (gMonth >= 9 && gMonth <= 11) return "autumn";
  return "winter";
}

/** /seasonal/{season}-{1|2}.jpg — consecutive months alternate variants */
export function seasonImageSrc(gMonth: number): string {
  const season = seasonOf(gMonth);
  const start = SEASON_START[season];
  const idxInSeason = (gMonth - start + 12) % 12;
  const variant = (idxInSeason % 2) + 1;
  return `/seasonal/${season}-${variant}.jpg`;
}

/* ---------------- hero header ---------------- */

export function HeroHeader() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const dict = getDict(locale);

  const cursor = useUi((s) => s.cursor);
  const view = useUi((s) => s.view);
  const setView = useUi((s) => s.setView);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const setAddEventOpen = useUi((s) => s.setAddEventOpen);
  const setShortcutsOpen = useUi((s) => s.setShortcutsOpen);
  const goToday = useUi((s) => s.goToday);

  // month identity in the ACTIVE system
  const monthName =
    system === "gregorian"
      ? gregorianMonthName(locale, cursor.month)
      : jalaliMonthName(locale, cursor.month);
  const era =
    system === "gregorian"
      ? dict.eraGregorian
      : system === "jalali"
        ? dict.eraJalali
        : dict.eraImperial;

  const firstG = systemToGregorian(system, cursor.year, cursor.month, 1);
  const season = seasonOf(firstG.month);
  const seasonLabel =
    season === "spring"
      ? dict.seasonSpring
      : season === "summer"
        ? dict.seasonSummer
        : season === "autumn"
          ? dict.seasonAutumn
          : dict.seasonWinter;

  // secondary line: the other main system(s) + hijri of the 1st of month
  const secondary: string[] = [];
  if (system !== "gregorian") {
    secondary.push(
      `${gregorianMonthName(locale, firstG.month)} ${num(locale, firstG.year)} ${dict.eraGregorian}`,
    );
  }
  if (system !== "jalali" && system !== "imperial") {
    const j = systemDateOf("jalali", firstG);
    secondary.push(
      `${jalaliMonthName(locale, j.month)} ${num(locale, j.year)} ${dict.eraJalali}`,
    );
  }
  if (system === "imperial") {
    const j = systemDateOf("jalali", firstG);
    secondary.push(
      `${jalaliMonthName(locale, j.month)} ${num(locale, j.year)} ${dict.eraJalali}`,
    );
  }
  const hijri = gregorianToHijri(firstG);
  secondary.push(
    `${hijriMonthName(locale, hijri.month)} ${num(locale, hijri.year)} ${dict.hijriLabel}`,
  );

  // today chip label
  const today = todayGregorian();
  const todaySys = systemDateOf(system, today);
  const todayDayNum =
    system === "gregorian"
      ? today.day
      : system === "jalali"
        ? gregorianToJalali(today).day
        : gregorianToImperial(today).day;
  const todayMonthName =
    system === "gregorian"
      ? gregorianMonthName(locale, todaySys.month)
      : jalaliMonthName(locale, todaySys.month);
  const todayWeekday = weekdayShort(locale, jdnWeekday(toJdn(today)));

  return (
    <header data-no-print className="relative h-64 overflow-hidden sm:h-72 lg:h-80">
      <HeroImage src={seasonImageSrc(firstG.month)} />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/10"
      />
      <SeasonalParticles season={season} />

      {/* top row: brand + actions (flex flips naturally in RTL) */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-3 sm:p-4">
        <div className="flex items-center gap-1.5 text-white/95 drop-shadow-sm">
          <CalendarSearch className="size-5" aria-hidden />
          <span className="text-sm font-bold tracking-wide sm:text-base">
            {dict.appName}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={dict.search}
            className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <Search className="size-4" aria-hidden />
            <span className="sr-only">{dict.search}</span>
          </button>
          <button
            type="button"
            onClick={() => setAddEventOpen(true)}
            aria-label={dict.addEvent}
            className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <Plus className="size-4" aria-hidden />
            <span className="sr-only">{dict.addEvent}</span>
          </button>
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            aria-label={dict.shortcuts}
            className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <Keyboard className="size-4" aria-hidden />
            <span className="sr-only">{dict.shortcuts}</span>
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={dict.settings}
            className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <Settings2 className="size-4" aria-hidden />
            <span className="sr-only">{dict.settings}</span>
          </button>
        </div>
      </div>

      {/* main overlay: month + year + secondary dates + today chip */}
      <div className="absolute inset-x-0 bottom-14 flex flex-col gap-1.5 px-4 sm:bottom-16 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            <span aria-hidden>{SEASON_EMOJI[season]}</span>
            {seasonLabel}
          </span>
          <button
            type="button"
            onClick={goToday}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            {dict.today} · {todayWeekday} {num(locale, todayDayNum)}{" "}
            {todayMonthName}
          </button>
        </div>
        {/* month title block — replays fade+rise when the month changes */}
        <motion.div
          key={`${monthName} ${cursor.year}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-bold leading-tight text-white drop-shadow-md sm:text-4xl">
            {monthName} {num(locale, cursor.year)}{" "}
            <span className="text-lg font-semibold text-white/85 sm:text-xl">
              {era}
            </span>
          </h1>
          <p
            className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/80 sm:text-sm"
            dir="auto"
          >
            {secondary.map((part, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden className="text-white/40">
                    ·
                  </span>
                )}
                {part}
              </span>
            ))}
          </p>
        </motion.div>
      </div>

      {/* view switcher */}
      <div className="absolute inset-x-3 bottom-3 sm:inset-x-6">
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList className="h-auto w-full grid grid-cols-5 gap-1 rounded-xl border border-white/25 bg-black/25 p-1 backdrop-blur-md">
            {(
              [
                ["month", dict.viewMonth],
                ["week", dict.viewWeek],
                ["year", dict.viewYear],
                ["day", dict.viewDay],
                ["agenda", dict.viewAgenda],
              ] as const
            ).map(([key, label]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-lg border-transparent px-2 py-1.5 text-xs font-medium text-white/85 transition-colors hover:text-white data-[state=active]:bg-white data-[state=active]:text-foreground sm:text-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}

/**
 * All 8 seasonal images stay mounted; the active one fades to opacity-100
 * (700ms crossfade), failures fall back to a magenta gradient. No timers —
 * the crossfade is pure CSS class flipping.
 */
const SEASONAL_KEYS = [
  "spring-1",
  "spring-2",
  "summer-1",
  "summer-2",
  "autumn-1",
  "autumn-2",
  "winter-1",
  "winter-2",
] as const;

function HeroImage({ src }: { src: string }) {
  const [failed, setFailed] = useState<readonly string[]>([]);
  const isFailed = (url: string) => failed.includes(url);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
    >
      {isFailed(src) && (
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/70 to-primary/40" />
      )}
      {SEASONAL_KEYS.map((k) => {
        const url = `/seasonal/${k}.jpg`;
        const active = url === src && !isFailed(url);
        return (
          <img
            key={k}
            src={url}
            alt=""
            onError={() =>
              setFailed((f) => (f.includes(url) ? f : [...f, url]))
            }
            className={`absolute inset-0 size-full animate-kenburns object-cover object-[50%_35%] transition-opacity duration-700 ${
              active ? "opacity-100" : "opacity-0"
            }`}
          />
        );
      })}
    </div>
  );
}
