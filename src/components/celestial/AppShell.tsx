// Celestial — app shell: sticky-footer root layout (header / main / footer)
"use client";

import { useEffect, useState } from "react";
import { getDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { useNtpSync } from "@/lib/client/api";
import { HeroHeader } from "./HeroHeader";
import { InstallChip } from "./InstallChip";

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale);
  const now = useLiveClock();
  const ntp = useNtpSync();

  const timeText = now
    ? new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(now)
    : "--:--:--";

  const dotClass = !ntp.data
    ? "bg-muted-foreground/50"
    : ntp.data.ok
      ? "bg-green-500"
      : "bg-red-500";
  const ntpLabel = !ntp.data
    ? dict.loading
    : ntp.data.ok
      ? dict.timeSyncOk
      : dict.timeSyncOff;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeroHeader />
      <main className="flex-1">{children}</main>
      <footer data-no-print className="mt-auto border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-start">
          <div className="min-w-0">
            <span className="font-bold text-foreground">{dict.appName}</span>
            <span className="mx-1.5" aria-hidden>
              ·
            </span>
            {dict.tagline}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="tabular-nums" title={dict.serverClock}>
              {timeText}
            </span>
            <span aria-hidden>·</span>
            <span dir="auto">
              {dict.systemGregorian} / {dict.systemJalali} /{" "}
              {dict.systemImperial}
            </span>
            <span aria-hidden>·</span>
            <span>EN · 日本語 · فارسی</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className={`inline-block size-2 rounded-full ${dotClass}`} />
              <span className="sr-only">{dict.timeSync}</span>
              {ntpLabel}
            </span>
            <InstallChip />
          </div>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" aria-hidden />
      </footer>
    </div>
  );
}
