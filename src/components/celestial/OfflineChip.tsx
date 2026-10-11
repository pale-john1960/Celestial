// Celestial — footer offline chip (visible only while offline)
// Two signals, either one shows the chip:
//   1. navigator.onLine === false (subscribed via online/offline window
//      events, read through useSyncExternalStore — no hydration mismatch:
//      the server snapshot assumes online),
//   2. the last events response was the client-side builtin fallback
//      (offline: true from fetchEvents — catches network-level failures
//      even while navigator.onLine still claims online).
// Renders null while fully online — no layout shift (the footer row is
// flex-wrap; the chip simply wraps when it appears, same as InstallChip).
"use client";

import { useEffect, useRef } from "react";
import { useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { getEventsOffline, subscribeEventsOffline } from "@/lib/client/api";

const onlineSubscribe = (listener: () => void) => {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
};
const getOnlineSnapshot = () => navigator.onLine;
const getOnlineServerSnapshot = () => true; // assume online on the server

/** Live network connection state (navigator.onLine + online/offline events). */
function useIsOnline(): boolean {
  return useSyncExternalStore(
    onlineSubscribe,
    getOnlineSnapshot,
    getOnlineServerSnapshot,
  );
}

/** Was the last events response computed client-side (offline fallback)? */
function useEventsOffline(): boolean {
  return useSyncExternalStore(
    subscribeEventsOffline,
    getEventsOffline,
    () => false,
  );
}

export function OfflineChip() {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale);
  const online = useIsOnline();
  const eventsOffline = useEventsOffline();
  const queryClient = useQueryClient();

  // Reconnect freshness: queries that ran while offline returned builtin-only
  // fallback data (offlineFirst lets them run). TanStack only auto-refetches
  // PAUSED queries on "online" — ours completed — so re-fetch them ourselves
  // the first time connectivity returns after a degraded-data session.
  const sawFallbackRef = useRef(false);
  useEffect(() => {
    if (eventsOffline) sawFallbackRef.current = true;
  }, [eventsOffline]);
  useEffect(() => {
    const onOnline = () => {
      if (!sawFallbackRef.current) return;
      sawFallbackRef.current = false;
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [queryClient]);

  if (online && !eventsOffline) return null;

  return (
    <>
      <span aria-hidden>·</span>
      <span
        role="status"
        title={dict.offlineDesc}
        aria-label={dict.offlineDesc}
        className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-600/30 bg-amber-500/10 px-2.5 text-xs text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300"
      >
        <WifiOff className="size-3.5" aria-hidden />
        {dict.offlineTitle}
      </span>
    </>
  );
}
