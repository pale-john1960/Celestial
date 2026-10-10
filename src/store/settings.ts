// Celestial — persisted user settings (localStorage: celestial-settings)
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "en" | "ja" | "fa";
export type SystemCode = "gregorian" | "jalali" | "imperial";
export type WeekStartCode = 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday
export type ThemeCode = "light" | "dark" | "system";

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
  setLocale: (locale: Locale) => void;
  setSystem: (system: SystemCode) => void;
  setWeekStart: (weekStart: WeekStartCode) => void;
  setSource: (key: keyof SourceFlags, value: boolean) => void;
  setTheme: (theme: ThemeCode) => void;
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
    }),
    {
      name: "celestial-settings",
      version: 1,
    },
  ),
);
