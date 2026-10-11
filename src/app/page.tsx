// Celestial — web UI composition root (client)
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { getDict } from "@/lib/i18n";
import { isoDate, parseIso, shiftMonth } from "@/lib/calendar";
import { fromJdn, toJdn } from "@/lib/calendar/jdn";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/celestial/AppShell";
import { MonthView } from "@/components/celestial/MonthView";
import { WeekView } from "@/components/celestial/WeekView";
import { YearView } from "@/components/celestial/YearView";
import { DayView } from "@/components/celestial/DayView";
import { AgendaView } from "@/components/celestial/AgendaView";
import { SearchDialog } from "@/components/celestial/SearchDialog";
import { ImportDialog } from "@/components/celestial/ImportDialog";
import { AddEventDialog } from "@/components/celestial/AddEventDialog";
import { ShortcutsDialog } from "@/components/celestial/ShortcutsDialog";
import { EventDialog } from "@/components/celestial/EventDialog";
import { SettingsSheet } from "@/components/celestial/SettingsSheet";

const MIN_YEAR = 1;
const MAX_YEAR = 3000;

export default function Page() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CelestialApp />
    </QueryClientProvider>
  );
}

const emptySubscribe = () => () => {};
/** hydration-safe mounted flag — true on the client after hydration, false during SSR */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/** true while the user is typing in a form control */
function isTypingTarget(target: EventTarget | null): boolean {
  const t = target as HTMLElement | null;
  if (!t) return false;
  return (
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" ||
    t.isContentEditable
  );
}

/** true while any dialog / sheet is open (keyboard nav must yield) */
function anyDialogOpen(): boolean {
  const ui = useUi.getState();
  return (
    ui.settingsOpen ||
    ui.importOpen ||
    ui.searchOpen ||
    ui.addEventOpen ||
    ui.editEvent !== null ||
    ui.shortcutsOpen ||
    ui.activeEvent !== null
  );
}

function CelestialApp() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const theme = useSettings((s) => s.theme);
  const dict = getDict(locale);

  const view = useUi((s) => s.view);
  const rederive = useUi((s) => s.rederive);
  const goToday = useUi((s) => s.goToday);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const { setTheme } = useTheme();

  // mount guard (avoids SSR/client date & persistence mismatches)
  const mounted = useMounted();

  // initialize cursor + selection from today in the active system
  useEffect(() => {
    goToday();
  }, [goToday]);

  // keep the view on the same day when the calendar system changes
  useEffect(() => {
    rederive(system);
  }, [system, rederive]);

  // settings theme → next-themes
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  // reflect the locale on <html> — including dir, so Radix portals (dialogs/
  // sheets/tooltips mount on document.body, OUTSIDE the wrapper div below)
  // inherit the correct direction for their chrome (close button side, text
  // alignment). The wrapper div keeps its dir too (harmless, same value).
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dict.dir;
  }, [locale, dict.dir]);

  // global keyboard shortcuts (Ctrl/Cmd+K, arrows, view keys, dialogs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K opens search (works everywhere)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUi.getState().setSearchOpen(true);
        return;
      }

      // other shortcuts: never while typing or with modifier keys held
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (anyDialogOpen()) return;

      const ui = useUi.getState();
      const settings = useSettings.getState();

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // PHYSICAL arrows: left = previous, even in RTL
        const dir = e.key === "ArrowLeft" ? -1 : 1;
        e.preventDefault();
        if (ui.view === "month") {
          const next = shiftMonth(
            settings.system,
            ui.cursor.year,
            ui.cursor.month,
            dir,
          );
          if (next.year >= MIN_YEAR && next.year <= MAX_YEAR) {
            ui.setCursorMonth(next.year, next.month);
          }
        } else if (ui.view === "year") {
          const y = ui.cursor.year + dir;
          if (y >= MIN_YEAR && y <= MAX_YEAR) {
            ui.setCursorMonth(y, ui.cursor.month);
          }
        } else if (ui.view === "week" || ui.view === "day") {
          const g = parseIso(ui.selectedIso);
          if (g) ui.selectDaySync(isoDate(fromJdn(toJdn(g) + dir)));
        }
        return;
      }

      const k = e.key.toLowerCase();
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        ui.setShortcutsOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        ui.setSearchOpen(true);
      } else if (k === "t") {
        e.preventDefault();
        ui.goToday();
      } else if (k === "m") {
        e.preventDefault();
        ui.setView("month");
      } else if (k === "w") {
        e.preventDefault();
        ui.setView("week");
      } else if (k === "y") {
        e.preventDefault();
        ui.setView("year");
      } else if (k === "d") {
        e.preventDefault();
        ui.setView("day");
      } else if (k === "a") {
        e.preventDefault();
        ui.setView("agenda");
      } else if (k === "s") {
        e.preventDefault();
        ui.setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <p className="text-2xl font-bold text-primary">Celestial</p>
        <p className="text-sm text-muted-foreground">{dict.tagline}</p>
        <span
          aria-hidden
          className="size-2 animate-pulse-soft rounded-full bg-primary"
        />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div dir={dict.dir} className={dict.fontClass}>
        <AppShell>
          <div className="relative mx-auto w-full max-w-6xl px-3 pb-8 pt-4 sm:px-4 md:px-6">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {view === "month" && <MonthView />}
                {view === "week" && <WeekView />}
                {view === "year" && <YearView />}
                {view === "day" && <DayView />}
                {view === "agenda" && <AgendaView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </AppShell>

        <SettingsSheet />
        <SearchDialog />
        <ImportDialog />
        <AddEventDialog />
        <ShortcutsDialog />
        <EventDialog />

        <Toaster position="top-center" closeButton dir={dict.dir} />
      </div>
    </MotionConfig>
  );
}
