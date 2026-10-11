// Celestial — persisted user settings (localStorage: celestial-settings)
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "en" | "ja" | "fa";
/** Calendar systems (round 14 adds two):
 *  - imperialSolar: Shahanshahi YEAR + standard Jalali (Shamsi) months/days
 *  - ancient: the 30-day Fasli structure with ancient Zoroastrian month names */
export type SystemCode =
  | "gregorian"
  | "jalali"
  | "imperial"
  | "imperialSolar"
  | "ancient";
/** Weekly day-off preference. "auto" follows the locale convention
 *  (fa → Friday, en/ja → none); the rest force a specific weekday. */
export type WeekendDayCode = "auto" | "none" | "friday" | "saturday" | "sunday";
export type WeekStartCode = 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday
export type ThemeCode = "light" | "dark" | "system";

/** A place on Earth used for the sun-times card (label is a city name or
 *  "My location"). */
export interface SunLocation {
  label: string;
  lat: number;
  lng: number;
  /** IANA timezone name — the sun times are rendered in this zone */
  tz: string;
}

/** Hero header artwork theme (round 13). "seasonal" = the original
 *  season-rotating artwork; the rest are fixed rich themes. */
export type HeaderThemeCode =
  | "seasonal"
  | "celestial"
  | "magical"
  | "shahanshahi"
  | "japanese"
  | "korean"
  | "chinese";

export interface SourceFlags {
  international: boolean;
  us: boolean;
  japan: boolean;
  persianCultural: boolean;
  persianReligious: boolean;
  persianNational: boolean;
  imported: boolean;
  online: boolean;
}

/** Locale-aware default week start: fa → Saturday, en/ja → Sunday */
export function defaultWeekStartFor(locale: Locale): WeekStartCode {
  return locale === "fa" ? 6 : 0;
}

interface SettingsState {
  locale: Locale;
  system: SystemCode;
  weekStart: WeekStartCode;
  sources: SourceFlags;
  theme: ThemeCode;
  /** event notifications (opt-in) — daily "today's events" browser notification */
  notifyEvents: boolean;
  /** show the Hijri (AH) year line in the hero + secondary date rows */
  showHijri: boolean;
  /** daily horoscope card in Day view (zodiac of the day) */
  showHoroscope: boolean;
  /** hero header artwork theme (round 13) */
  headerTheme: HeaderThemeCode;
  /** show the ISO week-number column in the month grid (off by default) */
  showWeekNumbers: boolean;
  /** round 14: weekly day-off selection (auto follows locale) */
  weekendDay: WeekendDayCode;
  /** round 14: use ancient Zoroastrian month names in the Imperial systems */
  royalMonthNames: boolean;
  /** round 14: location for the sun-times card (defaults to Tehran) */
  sunLocation: SunLocation;
  /** round 14: world-clock zones (IANA names, persisted; empty = empty-state) */
  worldClockZones: string[];
  setLocale: (locale: Locale) => void;
  setSystem: (system: SystemCode) => void;
  setWeekStart: (weekStart: WeekStartCode) => void;
  setSource: (key: keyof SourceFlags, value: boolean) => void;
  setTheme: (theme: ThemeCode) => void;
  setNotifyEvents: (value: boolean) => void;
  setShowHijri: (value: boolean) => void;
  setShowHoroscope: (value: boolean) => void;
  setHeaderTheme: (value: HeaderThemeCode) => void;
  setShowWeekNumbers: (value: boolean) => void;
  setWeekendDay: (value: WeekendDayCode) => void;
  setRoyalMonthNames: (value: boolean) => void;
  setSunLocation: (value: SunLocation) => void;
  setWorldClockZones: (value: string[]) => void;
}

const allSources: SourceFlags = {
  international: true,
  us: true,
  japan: true,
  persianCultural: true,
  persianReligious: true,
  persianNational: true,
  imported: true,
  online: true,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      locale: "en",
      system: "jalali",
      weekStart: defaultWeekStartFor("en"),
      sources: { ...allSources },
      theme: "light",
      // persisted version stays 1 — zustand's persist default-merges the
      // stored state over these defaults, so existing users simply gain the
      // new keys (notifyEvents, showHijri, showHoroscope, headerTheme,
      // showWeekNumbers) without any migration
      notifyEvents: false,
      showHijri: true,
      showHoroscope: true,
      headerTheme: "seasonal",
      showWeekNumbers: false,
      weekendDay: "auto",
      royalMonthNames: false,
      sunLocation: { label: "Tehran", lat: 35.6892, lng: 51.389, tz: "Asia/Tehran" },
      worldClockZones: ["Asia/Tehran", "Asia/Tokyo", "America/New_York"],
      setLocale: (locale) => {
        const prev = get().locale;
        const prevDefault = defaultWeekStartFor(prev);
        const nextDefault = defaultWeekStartFor(locale);
        // follow the locale's week-start convention unless the user chose one
        const weekStart =
          get().weekStart === prevDefault ? nextDefault : get().weekStart;
        set({ locale, weekStart });
      },
      setSystem: (system) => set({ system }),
      setWeekStart: (weekStart) => set({ weekStart }),
      setSource: (key, value) =>
        set((s) => ({ sources: { ...s.sources, [key]: value } })),
      setTheme: (theme) => set({ theme }),
      setNotifyEvents: (value) => set({ notifyEvents: value }),
      setShowHijri: (value) => set({ showHijri: value }),
      setShowHoroscope: (value) => set({ showHoroscope: value }),
      setHeaderTheme: (value) => set({ headerTheme: value }),
      setShowWeekNumbers: (value) => set({ showWeekNumbers: value }),
      setWeekendDay: (value) => set({ weekendDay: value }),
      setRoyalMonthNames: (value) => set({ royalMonthNames: value }),
      setSunLocation: (value) => set({ sunLocation: value }),
      setWorldClockZones: (value) => set({ worldClockZones: value }),
    }),
    {
      name: "celestial-settings",
      version: 1,
    },
  ),
);
