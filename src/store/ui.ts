// Celestial — ephemeral UI state (view, cursor in ACTIVE system space, dialogs)
import { create } from "zustand";
import type { EventInstance } from "@/lib/events";
import {
  isoDate,
  parseIso,
  systemDateOf,
  todayGregorian,
} from "@/lib/calendar";
import { useSettings } from "./settings";
import type { SystemCode } from "./settings";

export type ViewMode = "month" | "year" | "day" | "agenda";

const today = todayGregorian();
const todayIso = isoDate(today);

interface UiState {
  view: ViewMode;
  /** year/month in the ACTIVE calendar system's space */
  cursor: { year: number; month: number };
  selectedIso: string;
  settingsOpen: boolean;
  importOpen: boolean;
  searchOpen: boolean;
  /** event shown in the detail dialog */
  activeEvent: EventInstance | null;
  setView: (view: ViewMode) => void;
  setCursor: (cursor: { year: number; month: number }) => void;
  setCursorMonth: (year: number, month: number) => void;
  /** select a day, staying in the current view */
  selectDay: (iso: string) => void;
  /** select a day + jump to Day view (cursor follows) */
  gotoDay: (iso: string) => void;
  goToday: () => void;
  /** re-derive the cursor from the selected day after a system switch */
  rederive: (system: SystemCode) => void;
  setSettingsOpen: (open: boolean) => void;
  setImportOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setEventDialog: (inst: EventInstance | null) => void;
}

function cursorOf(iso: string, system: SystemCode) {
  const g = parseIso(iso) ?? today;
  return systemDateOf(system, g);
}

export const useUi = create<UiState>()((set, get) => ({
  view: "month",
  cursor: cursorOf(todayIso, "jalali"),
  selectedIso: todayIso,
  settingsOpen: false,
  importOpen: false,
  searchOpen: false,
  activeEvent: null,

  setView: (view) => set({ view }),
  setCursor: (cursor) => set({ cursor }),
  setCursorMonth: (year, month) => set({ cursor: { year, month } }),

  selectDay: (iso) => set({ selectedIso: iso }),

  gotoDay: (iso) => {
    const system = useSettings.getState().system;
    set({ selectedIso: iso, cursor: cursorOf(iso, system), view: "day" });
  },

  goToday: () => {
    const t = todayGregorian();
    const iso = isoDate(t);
    set({ selectedIso: iso, cursor: cursorOf(iso, useSettings.getState().system) });
  },

  rederive: (system) => {
    set({ cursor: cursorOf(get().selectedIso, system) });
  },

  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setImportOpen: (importOpen) => set({ importOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setEventDialog: (activeEvent) => set({ activeEvent }),
}));


