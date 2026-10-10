// Celestial — web UI composition root (client)
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { getDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/celestial/AppShell";
import { MonthView } from "@/components/celestial/MonthView";
import { YearView } from "@/components/celestial/YearView";
import { DayView } from "@/components/celestial/DayView";
import { AgendaView } from "@/components/celestial/AgendaView";
import { SearchDialog } from "@/components/celestial/SearchDialog";
import { ImportDialog } from "@/components/celestial/ImportDialog";
import { EventDialog } from "@/components/celestial/EventDialog";
import { SettingsSheet } from "@/components/celestial/SettingsSheet";

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

  // reflect the locale on <html>
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Ctrl/Cmd + K opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

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
    <div dir={dict.dir} className={dict.fontClass}>
      <AppShell>
        <div className="mx-auto w-full max-w-6xl px-3 pb-8 pt-4 sm:px-4 md:px-6">
          {view === "month" && <MonthView />}
          {view === "year" && <YearView />}
          {view === "day" && <DayView />}
          {view === "agenda" && <AgendaView />}
        </div>
      </AppShell>

      <SettingsSheet />
      <SearchDialog />
      <ImportDialog />
      <EventDialog />

      <Toaster position="top-center" closeButton dir={dict.dir} />
    </div>
  );
}
