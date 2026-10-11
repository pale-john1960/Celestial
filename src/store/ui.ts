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

export type ViewMode = "month" | "week" | "year" | "day" | "agenda";

/** target of the add/edit dialog when editing an existing event row */
export interface EditEventTarget {
  id: string; // ImportedEvent row id
  iso: string;
  title: string;
  description: string;
  isHoliday: boolean;
  recurYearly: boolean;
  color: string | null; // per-event dot color — null = category default
}

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
  /** add-event dialog (create mode) */
  addEventOpen: boolean;
  /** add-event dialog (edit mode) — non-null while editing an event row */
  editEvent: EditEventTarget | null;
  /** keyboard shortcuts help dialog */
  shortcutsOpen: boolean;
  /** trilingual date converter dialog */
  converterOpen: boolean;
  /** event shown in the detail dialog */
  activeEvent: EventInstance | null;
  setView: (view: ViewMode) => void;
  setCursor: (cursor: { year: number; month: number }) => void;
  setCursorMonth: (year: number, month: number) => void;
  /** select a day, staying in the current view */
  selectDay: (iso: string) => void;
  /** select a day + move the cursor to that day's month (week nav / keyboard) */
  selectDaySync: (iso: string) => void;
  /** select a day + jump to Day view (cursor follows) */
  gotoDay: (iso: string) => void;
  goToday: () => void;
  /** re-derive the cursor from the selected day after a system switch */
  rederive: (system: SystemCode) => void;
  setSettingsOpen: (open: boolean) => void;
  setImportOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setAddEventOpen: (open: boolean) => void;
  /** open the add-event dialog with a fresh form */
  openAddDialog: () => void;
  /** open the dialog in edit mode for an existing event row */
  openEditDialog: (evt: EditEventTarget) => void;
  /** close the add/edit dialog in either mode */
  closeEventEditor: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setConverterOpen: (open: boolean) => void;
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
  addEventOpen: false,
  editEvent: null,
  shortcutsOpen: false,
  converterOpen: false,
  activeEvent: null,

  setView: (view) => set({ view }),
  setCursor: (cursor) => set({ cursor }),
  setCursorMonth: (year, month) => set({ cursor: { year, month } }),

  selectDay: (iso) => set({ selectedIso: iso }),

  selectDaySync: (iso) => {
    const system = useSettings.getState().system;
    set({ selectedIso: iso, cursor: cursorOf(iso, system) });
  },

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
  setAddEventOpen: (open) =>
    set(open ? { addEventOpen: true, editEvent: null } : { addEventOpen: false }),
  openAddDialog: () => set({ addEventOpen: true, editEvent: null }),
  openEditDialog: (evt) => set({ editEvent: evt, addEventOpen: false }),
  closeEventEditor: () => set({ addEventOpen: false, editEvent: null }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setConverterOpen: (converterOpen) => set({ converterOpen }),
  setEventDialog: (activeEvent) => set({ activeEvent }),
}));


