// Celestial — themed hero header with dual-date overlay + view switcher.
// Also exports the cross-view date formatting helpers (hijri month names etc).
// Round 13: 7 artwork themes (seasonal + 6 fixed), wind-driven particle
// system, static imagery (no kenburns), optional Hijri year line.
// Round 14: locale-ordered date formats (en "Month D, Y" / ja "Y年M月D日" /
// fa day-first), full weekday names + locale-aware weekday·date composition,
// activeDateText for all 5 systems, 12-per-month theme pools + themeImageSrc
// (shared with the YearView month cards).
// Round 15: every theme now has 12 unique pieces (one per Gregorian month;
// seasonal = 3 per season) — no month shares artwork in any theme.
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, CalendarSearch, Keyboard, Plus, Search, Settings2 } from "lucide-react";
import {
  gregorianMonthName,
  getDict,
  jalaliMonthName,
  num,
  weekdayLong,
} from "@/lib/i18n";
import type { LocaleCode, LocaleDict } from "@/lib/i18n";
import {
  ANCIENT_MONTH_NAMES,
  IMPERIAL_EPOCH_OFFSET,
  buildDayCell,
  gregorianToHijri,
  systemMonthName,
  systemTripleOf,
  systemToGregorian,
  systemDateOf,
  todayGregorian,
} from "@/lib/calendar";
import { jdnWeekday, toJdn } from "@/lib/calendar/jdn";
import type {
  CalendarSystem,
  DayCell,
  HijriDate,
  ImperialDate,
  SimpleDate,
} from "@/lib/calendar";
import { useSettings } from "@/store/settings";
import type { HeaderThemeCode } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeasonalParticles } from "./SeasonalParticles";
import type { ParticleTone, ParticleVariant, Season } from "./SeasonalParticles";
import { NextDayOffChip } from "./NextDayOffChip";

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

/**
 * Locale-ordered date composition (round 14 — every locale used to render
 * "Month Day, Year Era", producing e.g. "مهر ۲۹" in Persian):
 *  - en: "March 21, 2026 CE"
 *  - ja: "2026年3月21日 西暦" (Gregorian months are "3月", so the 月 comes
 *    from the month name itself; Jalali months are katakana → "1405年メフル29日")
 *  - fa: "۲۱ مارس ۲۰۲۶ میلادی" (day BEFORE month — Persian reads day-first)
 */
function composeDate(
  locale: LocaleCode,
  parts: { year: string; month: string; day: string; era: string },
): string {
  if (locale === "ja") {
    return `${parts.year}年${parts.month}${parts.day}日 ${parts.era}`;
  }
  if (locale === "fa") {
    return `${parts.day} ${parts.month} ${parts.year} ${parts.era}`;
  }
  return `${parts.month} ${parts.day}, ${parts.year} ${parts.era}`;
}

export function formatGregorianDate(
  locale: LocaleCode,
  g: SimpleDate,
  dict: LocaleDict,
): string {
  return composeDate(locale, {
    year: num(locale, g.year),
    month: gregorianMonthName(locale, g.month),
    day: num(locale, g.day),
    era: dict.eraGregorian,
  });
}

export function formatJalaliDate(
  locale: LocaleCode,
  j: SimpleDate,
  dict: LocaleDict,
): string {
  return composeDate(locale, {
    year: num(locale, j.year),
    month: jalaliMonthName(locale, j.month),
    day: num(locale, j.day),
    era: dict.eraJalali,
  });
}

export function formatHijriDate(
  locale: LocaleCode,
  h: HijriDate,
  dict: LocaleDict,
): string {
  return composeDate(locale, {
    year: num(locale, h.year),
    month: hijriMonthName(locale, h.month),
    day: num(locale, h.day),
    era: dict.hijriLabel,
  });
}

/** options for the Imperial-family formatters */
export interface ImperialFormatOptions {
  /** era suffix — defaults to dict.eraImperial ('ancient' passes eraAncient) */
  era?: string;
  /** use the ancient Zoroastrian month names (royalMonthNames setting) */
  royal?: boolean;
}

export function formatImperialDate(
  locale: LocaleCode,
  imp: ImperialDate,
  dict: LocaleDict,
  opts?: ImperialFormatOptions,
): string {
  const month =
    opts?.royal && imp.month >= 1 && imp.month <= 12
      ? ANCIENT_MONTH_NAMES[locale][imp.month - 1]
      : jalaliMonthName(locale, imp.month); // 13 → Andarjah label
  return composeDate(locale, {
    year: num(locale, imp.year),
    month,
    day: num(locale, imp.day),
    era: opts?.era ?? dict.eraImperial,
  });
}

/**
 * imperialSolar: Shahanshahi YEAR on the standard Jalali month/day structure
 * — `j` is the day's JALALI triple; only the displayed year gets +1180.
 */
export function formatImperialSolarDate(
  locale: LocaleCode,
  j: SimpleDate,
  dict: LocaleDict,
  royal = false,
): string {
  const month =
    royal && j.month >= 1 && j.month <= 12
      ? ANCIENT_MONTH_NAMES[locale][j.month - 1]
      : jalaliMonthName(locale, j.month);
  return composeDate(locale, {
    year: num(locale, j.year + IMPERIAL_EPOCH_OFFSET),
    month,
    day: num(locale, j.day),
    era: dict.eraImperial,
  });
}

/**
 * The ACTIVE system's full date for a DayCell, locale-ordered — one helper
 * for all 5 systems (views used to switch on 3 systems inline).
 * `royal` = the royalMonthNames setting (imperial/imperialSolar only).
 */
export function activeDateText(
  system: CalendarSystem,
  locale: LocaleCode,
  cell: DayCell,
  dict: LocaleDict,
  royal = false,
): string {
  switch (system) {
    case "gregorian":
      return formatGregorianDate(locale, cell.gregorian, dict);
    case "jalali":
      return formatJalaliDate(locale, cell.jalali, dict);
    case "imperial":
      return formatImperialDate(locale, cell.imperial, dict, { royal });
    case "imperialSolar":
      return formatImperialSolarDate(locale, cell.jalali, dict, royal);
    case "ancient":
      // same math as imperial, ALWAYS ancient names, ancient era label
      return formatImperialDate(locale, cell.imperial, dict, {
        era: dict.eraAncient,
        royal: true,
      });
  }
}

/**
 * Locale-aware "weekday + date" composition for list headers and dialogs
 * (round 14 — the agenda showed the truncated "چهار"):
 *  - en / fa: "چهارشنبه · ۲۹ مهر ۱۴۰۵ هجری شمسی" (weekday first, · separator)
 *  - ja: "2026年10月29日（水曜日）" (date first, weekday in full-width parens)
 */
export function weekdayDateText(
  locale: LocaleCode,
  weekday: number,
  dateText: string,
): string {
  if (locale === "ja") {
    return `${dateText}（${weekdayLong(locale, weekday)}）`;
  }
  return `${weekdayLong(locale, weekday)} · ${dateText}`;
}

/** era label of the ACTIVE system (imperialSolar shares eraImperial) */
export function systemEraLabel(
  system: CalendarSystem,
  dict: LocaleDict,
): string {
  if (system === "gregorian") return dict.eraGregorian;
  if (system === "jalali") return dict.eraJalali;
  if (system === "ancient") return dict.eraAncient;
  return dict.eraImperial; // imperial + imperialSolar
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

/** season tint layer under the dark scrim — token-based (adapts to dark
 *  mode: spring = brand magenta, summer = amber, autumn = copper, winter = stone) */
const SEASON_TINT: Record<Season, string> = {
  spring: "bg-primary/15",
  summer: "bg-chart-4/15",
  autumn: "bg-chart-2/20",
  winter: "bg-muted-foreground/15",
};

/* ------------- hero artwork themes (round 13; 12-per-month pools, round 15) ------------- */

/** seasonal hero pool — THREE pieces per season, one per month-in-season
 *  (round 15: k0 = first month of the season … k2 = third — no two months in
 *  a season share artwork). spring/summer -3/-4 keep the round-13 pieces and
 *  -5 is new; autumn/winter -1/-2 keep the originals from /seasonal/ */
const SEASONAL_HERO_POOL: Record<Season, readonly string[]> = {
  spring: ["/hero/seasonal-spring-3.jpg", "/hero/seasonal-spring-4.jpg", "/hero/seasonal-spring-5.jpg"],
  summer: ["/hero/seasonal-summer-3.jpg", "/hero/seasonal-summer-4.jpg", "/hero/seasonal-summer-5.jpg"],
  autumn: ["/seasonal/autumn-1.jpg", "/seasonal/autumn-2.jpg", "/hero/seasonal-autumn-3.jpg"],
  winter: ["/seasonal/winter-1.jpg", "/seasonal/winter-2.jpg", "/hero/seasonal-winter-3.jpg"],
};

/** fixed-theme pools — /hero/{theme}-{1..12}.jpg (round 15: TWELVE pieces per
 *  theme, one per Gregorian month — a full year of unique artwork; 1-4 are the
 *  round-13/14 pieces, 5-12 are season-aware within each theme's style).
 *  HeroImage's onError gradient fallback covers any file not yet present */
const FIXED_HERO_POOL: Record<Exclude<HeaderThemeCode, "seasonal">, readonly string[]> = {
  celestial: ["/hero/celestial-1.jpg", "/hero/celestial-2.jpg", "/hero/celestial-3.jpg", "/hero/celestial-4.jpg", "/hero/celestial-5.jpg", "/hero/celestial-6.jpg", "/hero/celestial-7.jpg", "/hero/celestial-8.jpg", "/hero/celestial-9.jpg", "/hero/celestial-10.jpg", "/hero/celestial-11.jpg", "/hero/celestial-12.jpg"],
  magical: ["/hero/magical-1.jpg", "/hero/magical-2.jpg", "/hero/magical-3.jpg", "/hero/magical-4.jpg", "/hero/magical-5.jpg", "/hero/magical-6.jpg", "/hero/magical-7.jpg", "/hero/magical-8.jpg", "/hero/magical-9.jpg", "/hero/magical-10.jpg", "/hero/magical-11.jpg", "/hero/magical-12.jpg"],
  shahanshahi: ["/hero/shahanshahi-1.jpg", "/hero/shahanshahi-2.jpg", "/hero/shahanshahi-3.jpg", "/hero/shahanshahi-4.jpg", "/hero/shahanshahi-5.jpg", "/hero/shahanshahi-6.jpg", "/hero/shahanshahi-7.jpg", "/hero/shahanshahi-8.jpg", "/hero/shahanshahi-9.jpg", "/hero/shahanshahi-10.jpg", "/hero/shahanshahi-11.jpg", "/hero/shahanshahi-12.jpg"],
  japanese: ["/hero/japanese-1.jpg", "/hero/japanese-2.jpg", "/hero/japanese-3.jpg", "/hero/japanese-4.jpg", "/hero/japanese-5.jpg", "/hero/japanese-6.jpg", "/hero/japanese-7.jpg", "/hero/japanese-8.jpg", "/hero/japanese-9.jpg", "/hero/japanese-10.jpg", "/hero/japanese-11.jpg", "/hero/japanese-12.jpg"],
  korean: ["/hero/korean-1.jpg", "/hero/korean-2.jpg", "/hero/korean-3.jpg", "/hero/korean-4.jpg", "/hero/korean-5.jpg", "/hero/korean-6.jpg", "/hero/korean-7.jpg", "/hero/korean-8.jpg", "/hero/korean-9.jpg", "/hero/korean-10.jpg", "/hero/korean-11.jpg", "/hero/korean-12.jpg"],
  chinese: ["/hero/chinese-1.jpg", "/hero/chinese-2.jpg", "/hero/chinese-3.jpg", "/hero/chinese-4.jpg", "/hero/chinese-5.jpg", "/hero/chinese-6.jpg", "/hero/chinese-7.jpg", "/hero/chinese-8.jpg", "/hero/chinese-9.jpg", "/hero/chinese-10.jpg", "/hero/chinese-11.jpg", "/hero/chinese-12.jpg"],
};

/** active pool for the theme + Gregorian month (round 15: seasonal uses the
 *  month-in-season piece out of 3; fixed themes use the month's OWN piece out
 *  of 12 — every month is unique in every theme, hero and YearView agree) */
function heroPool(
  headerTheme: HeaderThemeCode,
  gMonth: number,
): { key: string; urls: readonly string[]; index: number } {
  if (headerTheme === "seasonal") {
    const season = seasonOf(gMonth);
    const idxInSeason = (gMonth - SEASON_START[season] + 12) % 12;
    return {
      key: `seasonal-${season}`,
      urls: SEASONAL_HERO_POOL[season],
      index: Math.min(idxInSeason, 2),
    };
  }
  return { key: headerTheme, urls: FIXED_HERO_POOL[headerTheme], index: (gMonth + 11) % 12 };
}

/**
 * CENTRAL theme image source (round 14): the single active artwork URL for a
 * theme + Gregorian month. The hero and the YearView month cards stay in
 * sync through this one function — the year headers used to be seasonal-only
 * (seasonImageSrc, removed in round 14; YearView now calls themeImageSrc).
 */
export function themeImageSrc(headerTheme: HeaderThemeCode, gMonth: number): string {
  const pool = heroPool(headerTheme, gMonth);
  return pool.urls[pool.index] ?? pool.urls[0];
}

/** night-sky art themes: their artwork carries its own stars, so the DOM
 *  starfield + the extra dark-mode deepening wash are redundant there */
const NIGHT_ART_THEMES: ReadonlySet<HeaderThemeCode> = new Set([
  "celestial",
  "magical",
  "korean",
]);

/** theme → particle system (see SeasonalParticles) */
const PARTICLE_BY_SEASON: Record<Season, ParticleVariant> = {
  spring: "petals",
  summer: "fireflies",
  autumn: "leaves",
  winter: "snow",
};

function heroParticles(
  headerTheme: HeaderThemeCode,
  season: Season,
): { variant: ParticleVariant; tone: ParticleTone } {
  switch (headerTheme) {
    case "seasonal":
      return { variant: PARTICLE_BY_SEASON[season], tone: "default" };
    case "celestial":
      return { variant: "stars", tone: "default" };
    case "magical":
      return { variant: "sparkles", tone: "default" };
    case "shahanshahi":
      return { variant: "goldDust", tone: "default" };
    case "japanese":
      return { variant: "petals", tone: "subdued" };
    case "korean":
      return { variant: "fireflies", tone: "cool" };
    case "chinese":
      return { variant: "goldDust", tone: "redGold" };
  }
}

/* ---------------- dark-mode starfield (deterministic, CSS-only) ---------------- */

/** warm-white star dot #F5F2EC at a given alpha + magenta #C2185B @ 60% */
const STAR = (a: number) => `rgba(245,242,236,${a})`;
const STAR_MAGENTA = "rgba(194,24,91,0.6)";

/** Three star layers over the hero's clear-sky area (top ~55%): each layer is
 *  a single 1-2px span whose box-shadow list paints the dots — fixed
 *  positions (vw across / px down), no JS, one opacity tween per layer.
 *  Layer order: 1 = 1px mid stars, 2 = 2px bright stars, 3 = 1px distant.
 *  Brightness tuned for the deepened dark-mode night scrim (from-black/65). */
const STARS_1 = [
  `2vw 14px 0 0 ${STAR(0.7)}`,
  `6vw 88px 0 0 ${STAR(0.45)}`,
  `11vw 34px 0 0 ${STAR(0.8)}`,
  `16vw 120px 0 0 ${STAR(0.35)}`,
  `21vw 10px 0 0 ${STAR(0.6)}`,
  `26vw 62px 0 0 ${STAR_MAGENTA}`,
  `31vw 142px 0 0 ${STAR(0.5)}`,
  `36vw 26px 0 0 ${STAR(0.75)}`,
  `42vw 104px 0 0 ${STAR(0.4)}`,
  `47vw 48px 0 0 ${STAR(0.85)}`,
  `53vw 16px 0 0 ${STAR(0.55)}`,
  `58vw 128px 0 0 ${STAR(0.45)}`,
  `63vw 70px 0 0 ${STAR(0.8)}`,
  `68vw 30px 0 0 ${STAR_MAGENTA}`,
  `74vw 112px 0 0 ${STAR(0.5)}`,
  `79vw 8px 0 0 ${STAR(0.7)}`,
  `84vw 92px 0 0 ${STAR(0.4)}`,
  `89vw 40px 0 0 ${STAR(0.65)}`,
  `94vw 124px 0 0 ${STAR(0.45)}`,
  `97vw 58px 0 0 ${STAR(0.75)}`,
].join(", ");

const STARS_2 = [
  `4vw 44px 0 0 ${STAR(0.9)}`,
  `13vw 96px 0 0 ${STAR(0.65)}`,
  `19vw 22px 0 0 ${STAR_MAGENTA}`,
  `28vw 134px 0 0 ${STAR(0.75)}`,
  `34vw 12px 0 0 ${STAR(0.85)}`,
  `40vw 76px 0 0 ${STAR(0.6)}`,
  `49vw 116px 0 0 ${STAR(0.95)}`,
  `56vw 38px 0 0 ${STAR_MAGENTA}`,
  `61vw 8px 0 0 ${STAR(0.7)}`,
  `66vw 148px 0 0 ${STAR(0.55)}`,
  `72vw 56px 0 0 ${STAR(0.9)}`,
  `77vw 20px 0 0 ${STAR(0.65)}`,
  `82vw 106px 0 0 ${STAR(0.8)}`,
  `88vw 28px 0 0 ${STAR_MAGENTA}`,
  `92vw 84px 0 0 ${STAR(0.7)}`,
  `96vw 132px 0 0 ${STAR(0.6)}`,
].join(", ");

const STARS_3 = [
  `7vw 70px 0 0 ${STAR(0.5)}`,
  `15vw 118px 0 0 ${STAR(0.35)}`,
  `24vw 6px 0 0 ${STAR(0.55)}`,
  `33vw 90px 0 0 ${STAR(0.4)}`,
  `38vw 150px 0 0 ${STAR(0.3)}`,
  `45vw 60px 0 0 ${STAR(0.5)}`,
  `51vw 108px 0 0 ${STAR(0.35)}`,
  `59vw 24px 0 0 ${STAR(0.55)}`,
  `64vw 138px 0 0 ${STAR(0.4)}`,
  `70vw 84px 0 0 ${STAR(0.3)}`,
  `76vw 46px 0 0 ${STAR(0.5)}`,
  `81vw 12px 0 0 ${STAR(0.45)}`,
  `86vw 126px 0 0 ${STAR(0.35)}`,
  `91vw 66px 0 0 ${STAR(0.5)}`,
  `95vw 100px 0 0 ${STAR(0.4)}`,
].join(", ");

/* ---------------- hero header ---------------- */

export function HeroHeader() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const headerTheme = useSettings((s) => s.headerTheme);
  const showHijri = useSettings((s) => s.showHijri);
  const royal = useSettings((s) => s.royalMonthNames);
  const dict = getDict(locale);

  const cursor = useUi((s) => s.cursor);
  const view = useUi((s) => s.view);
  const setView = useUi((s) => s.setView);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const setShortcutsOpen = useUi((s) => s.setShortcutsOpen);
  const setConverterOpen = useUi((s) => s.setConverterOpen);
  const openAddDialog = useUi((s) => s.openAddDialog);
  const goToday = useUi((s) => s.goToday);

  // month identity in the ACTIVE system (royal names apply to the
  // imperial-family systems; jalali/gregorian are unchanged)
  const monthName = systemMonthName(system, locale, cursor.month, royal);
  const era = systemEraLabel(system, dict);

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

  // hero artwork: active theme's pool + month-parity variant
  const pool = heroPool(headerTheme, firstG.month);
  const isNightArt = NIGHT_ART_THEMES.has(headerTheme);
  const particles = heroParticles(headerTheme, season);

  // secondary line: the other main system(s) + (optional) hijri of the 1st.
  // The Jalali (SH) line shows for every non-Jalali system — including the
  // imperial family, whose own month title sits in the h1 above.
  const secondary: string[] = [];
  if (system !== "gregorian") {
    secondary.push(
      `${gregorianMonthName(locale, firstG.month)} ${num(locale, firstG.year)} ${dict.eraGregorian}`,
    );
  }
  if (system !== "jalali") {
    const j = systemDateOf("jalali", firstG);
    secondary.push(
      `${jalaliMonthName(locale, j.month)} ${num(locale, j.year)} ${dict.eraJalali}`,
    );
  }
  if (showHijri) {
    const hijri = gregorianToHijri(firstG);
    secondary.push(
      `${hijriMonthName(locale, hijri.month)} ${num(locale, hijri.year)} ${dict.hijriLabel}`,
    );
  }

  // today chip label — FULL weekday name (round 14; was the truncated
  // سه/چهار form) + locale-ordered day·month composition:
  //   en "Today · Saturday, March 21" / ja "今日 · 3月21日（土曜日）" /
  //   fa "امروز · شنبه ۲۱ مارس"
  const today = todayGregorian();
  const todayCell = buildDayCell(today, today, true);
  const todaySys = systemTripleOf(system, todayCell);
  const todayDayNum = todaySys.day;
  const todayMonthName = systemMonthName(system, locale, todaySys.month, royal);
  const todayWeekday = weekdayLong(locale, jdnWeekday(toJdn(today)));
  const todayChipLabel =
    locale === "ja"
      ? `${dict.today} · ${todayMonthName}${num(locale, todayDayNum)}日（${todayWeekday}）`
      : locale === "fa"
        ? `${dict.today} · ${todayWeekday} ${num(locale, todayDayNum)} ${todayMonthName}`
        : `${dict.today} · ${todayWeekday}, ${todayMonthName} ${num(locale, todayDayNum)}`;

  return (
    <header data-no-print className="relative h-64 overflow-hidden sm:h-72 lg:h-80">
      <HeroImage poolKey={pool.key} urls={pool.urls} activeIndex={pool.index} />
      {/* season tint layer (subtle color wash, under the dark scrim) —
          seasonal artwork only; fixed themes carry their own palette */}
      {headerTheme === "seasonal" && (
        <div aria-hidden className={`absolute inset-0 ${SEASON_TINT[season]}`} />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/10"
      />
      {/* dark mode only: deepen the clear-sky area into a night sky so the
          starfield + white text read clearly against the photo (light mode
          keeps the photo as-is; night-art themes skip it — already dark) */}
      {!isNightArt && (
        <div
          aria-hidden
          className="absolute inset-0 hidden dark:block bg-gradient-to-b from-black/65 via-black/30 to-black/5"
        />
      )}
      {/* dark-mode night sky: 3 deterministic star layers over the photo's
          upper ~55%, UNDER the date text; opacity-only twinkle (globals.css).
          Hidden for night-art themes — their artwork has its own stars. */}
      {!isNightArt && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[55%] hidden dark:block"
        >
          <span
            className="absolute left-0 top-0 size-px rounded-full bg-transparent animate-twinkle-1"
            style={{ boxShadow: STARS_1 }}
          />
          <span
            className="absolute left-0 top-0 size-[2px] rounded-full bg-transparent animate-twinkle-2"
            style={{ boxShadow: STARS_2 }}
          />
          <span
            className="absolute left-0 top-0 size-px rounded-full bg-transparent animate-twinkle-3"
            style={{ boxShadow: STARS_3 }}
          />
        </div>
      )}
      <SeasonalParticles variant={particles.variant} tone={particles.tone} />

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
            onClick={() => openAddDialog()}
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
            onClick={() => setConverterOpen(true)}
            aria-label={dict.converterOpen}
            className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <ArrowLeftRight className="size-4 rtl:-scale-x-100" aria-hidden />
            <span className="sr-only">{dict.converterOpen}</span>
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
          {/* season chip — seasonal artwork only (fixed themes ARE the vibe) */}
          {headerTheme === "seasonal" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              <span aria-hidden>{SEASON_EMOJI[season]}</span>
              {seasonLabel}
            </span>
          )}
          <button
            type="button"
            onClick={goToday}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white shadow-lg transition hover:bg-primary/85 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
          >
            {todayChipLabel}
          </button>
          {/* next day-off countdown (hidden when loading with no data / none in 90d) */}
          <NextDayOffChip />
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
                className="rounded-lg border-transparent px-2 py-1.5 text-xs font-medium text-white/85 transition-[color,box-shadow,transform] hover:text-white active:scale-[0.97] data-[state=active]:bg-white data-[state=active]:text-foreground sm:text-sm"
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
 * Mounts the ACTIVE theme's image pool; the active variant fades to
 * opacity-100 (700ms crossfade), failures fall back to a magenta gradient
 * (covers the round-14 -3/-4 artwork that is still landing). The pool
 * wrapper is keyed (theme/season) so switching artwork remounts it with a
 * graceful fade-in (animate-fade-swap). Images are STATIC — no kenburns
 * (round 13: user prefers no camera motion). No timers — the crossfade is
 * pure CSS class flipping.
 */
function HeroImage({
  poolKey,
  urls,
  activeIndex,
}: {
  poolKey: string;
  urls: readonly string[];
  activeIndex: number;
}) {
  const [failed, setFailed] = useState<readonly string[]>([]);
  const isFailed = (url: string) => failed.includes(url);
  const activeFailed = isFailed(urls[activeIndex] ?? "");

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {activeFailed && (
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/70 to-primary/40" />
      )}
      <div key={poolKey} className="absolute inset-0 animate-fade-swap">
        {urls.map((url, i) => {
          const active = i === activeIndex && !isFailed(url);
          return (
            <img
              key={url}
              src={url}
              alt=""
              onError={() =>
                setFailed((f) => (f.includes(url) ? f : [...f, url]))
              }
              className={`absolute inset-0 size-full object-cover object-[50%_35%] transition-opacity duration-700 ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
