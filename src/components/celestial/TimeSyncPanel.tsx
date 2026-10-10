// Celestial — NTP time-sync panel (lives inside the settings sheet)
"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { useNtpSync } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TimeSyncPanel() {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale);
  const ntp = useNtpSync();

  // live "Celestial time" = device clock + last NTP offset
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const offsetMs = ntp.data?.ok ? ntp.data.offsetMs : null;
  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }),
    [locale],
  );

  const deviceText = timeFmt.format(new Date(nowMs));
  const celestialText = timeFmt.format(new Date(nowMs + (offsetMs ?? 0)));

  const status: {
    dot: string;
    label: string;
  } = ntp.isFetching
    ? { dot: "bg-muted-foreground/60", label: dict.timeSyncChecking }
    : ntp.data?.ok
      ? { dot: "bg-green-500", label: dict.timeSyncOk }
      : ntp.data
        ? { dot: "bg-red-500", label: dict.timeSyncFailed }
        : { dot: "bg-muted-foreground/50", label: dict.deviceClock };

  const offsetText =
    offsetMs === null
      ? "—"
      : `${offsetMs >= 0 ? "+" : "−"}${Math.abs(Math.round(offsetMs))}ms`;

  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn(
              "inline-block size-2.5 rounded-full",
              status.dot,
              ntp.isFetching && "animate-pulse-soft",
            )}
          />
          <span className="text-sm font-semibold">{dict.timeSync}</span>
          <span className="text-xs text-muted-foreground">{status.label}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 rounded-lg text-xs"
          onClick={() => ntp.refetch()}
          disabled={ntp.isFetching}
        >
          {ntp.isFetching ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-3.5" aria-hidden />
          )}
          {dict.syncNow}
        </Button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <div className="flex flex-col">
          <dt className="text-muted-foreground">{dict.ntpServer}</dt>
          <dd className="font-medium">pool.ntp.org</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-muted-foreground">{dict.offset}</dt>
          <dd className="font-medium tabular-nums">{offsetText}</dd>
        </div>
      </dl>

      <div className="mt-3 rounded-lg bg-muted/60 p-2.5 text-center">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {dict.serverClock}
        </p>
        <p className="text-xl font-bold tabular-nums" aria-live="off">
          {celestialText}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
          {dict.deviceClock}: {deviceText}
        </p>
      </div>
    </div>
  );
}
