// Celestial — daily "today's events" browser notification (opt-in)
// Mounted once by the coordinator inside CelestialApp:
//   import { useNotifications } from "@/hooks/use-notifications";
//   …inside CelestialApp():  useNotifications();
//
// Behaviour: on mount, every 60 s, and when the tab becomes visible again,
// if the user opted in (settings.notifyEvents) AND the browser granted the
// Notification permission, fetch today's events (same source flags as the
// calendar views) and — unless already handled today — fire ONE notification
// listing the first 3 event names. An empty (but successful) day is also
// marked as handled so it does not re-check every 60 s. Fetch failures are
// silently ignored (offline is fine — the next tick retries).
"use client";

import { useEffect } from "react";
import { getDict } from "@/lib/i18n";
import type { LocaleCode, LocaleDict } from "@/lib/i18n";
import {
  gregorianToImperial,
  gregorianToJalali,
  isoDate,
  todayGregorian,
} from "@/lib/calendar";
import type { SimpleDate } from "@/lib/calendar";
import { fetchEvents } from "@/lib/client/api";
import { useSettings } from "@/store/settings";
import type { Locale, SystemCode } from "@/store/settings";
import {
  formatGregorianDate,
  formatImperialDate,
  formatJalaliDate,
} from "@/components/celestial/HeroHeader";

/** localStorage key holding the last iso date a notification was handled for */
export const NOTIF_LAST_KEY = "celestial-notif-last";

/** recheck cadence while the app is open */
const CHECK_INTERVAL_MS = 60_000;

/** Notification.permission, extended with "unsupported" for browsers
 *  that lack the Notification API entirely (e.g. Safari < 16) */
export type PermissionState = NotificationPermission | "unsupported";

/** locale-appropriate name separator for the notification body */
export function nameSeparator(locale: LocaleCode): string {
  return locale === "ja" ? "、" : locale === "fa" ? "، " : ", ";
}

/**
 * Localized "today" label in the ACTIVE calendar system — the exact format
 * TodayStrip uses for the selected day (HeroHeader's format*Date helpers).
 */
export function localizedTodayLabel(
  system: SystemCode,
  locale: LocaleCode,
  dict: LocaleDict,
  today: SimpleDate,
): string {
  if (system === "gregorian") return formatGregorianDate(locale, today, dict);
  if (system === "jalali") {
    return formatJalaliDate(locale, gregorianToJalali(today), dict);
  }
  if (system === "imperialSolar") {
    // Shahanshahi year on the Jalali structure
    const j = gregorianToJalali(today);
    return formatImperialDate(locale, { ...j, year: j.year + 1180 }, dict);
  }
  // imperial + ancient share the 30-day structure
  return formatImperialDate(locale, gregorianToImperial(today), dict);
}

/* ------------------------------------------------------------------ */
/* pure decision helper (no side effects — unit-testable)             */
/* ------------------------------------------------------------------ */

export interface DecideNotificationArgs {
  /** settings flag (user opted in) */
  notifyEvents: boolean;
  /** current Notification.permission ("unsupported" when the API is absent) */
  permission: PermissionState;
  /** value of localStorage["celestial-notif-last"] (null when unset) */
  lastNotifiedIso: string | null;
  /** today's local iso date (yyyy-mm-dd) */
  todayIso: string;
  /** pre-formatted localized today label (see localizedTodayLabel) */
  todayLabel: string;
  /** active locale — picks the event-name language + separator */
  locale: LocaleCode;
  /** templates (notifTitle "{date}" / notifBody "{names}") */
  dict: Pick<LocaleDict, "notifTitle" | "notifBody">;
  /** today's events; only the localized names are read */
  events: ReadonlyArray<{ names: { en: string; ja: string; fa: string } }>;
}

export interface NotificationDecision {
  notify: boolean;
  title: string;
  body: string;
}

/**
 * Decide what to do about today's notification. PURE — no fetches, no
 * localStorage, no Notification side effects.
 *
 * - null                          → nothing to do: feature off, permission not
 *                                  granted, or today was already handled. (The
 *                                  effect also uses this as its PRE-fetch
 *                                  gate: `decideNotification({ …, events: [] })`
 *                                  returns null exactly when fetching is
 *                                  pointless.)
 * - { notify: false, title, body } → the day is settled WITHOUT a
 *                                  notification (zero events today) — the
 *                                  caller should still mark today as handled.
 * - { notify: true, title, body }  → fire the notification, then mark today.
 */
export function decideNotification(
  args: DecideNotificationArgs,
): NotificationDecision | null {
  if (!args.notifyEvents) return null;
  if (args.permission !== "granted") return null;
  if (args.lastNotifiedIso === args.todayIso) return null;

  if (args.events.length === 0) {
    return { notify: false, title: "", body: "" };
  }

  const names = args.events
    .slice(0, 3)
    .map((e) => e.names[args.locale])
    .join(nameSeparator(args.locale));

  return {
    notify: true,
    // replacer functions keep "$…" sequences in event names literal
    title: args.dict.notifTitle.replace("{date}", () => args.todayLabel),
    body: args.dict.notifBody.replace("{names}", () => names),
  };
}

/* ------------------------------------------------------------------ */
/* hook                                                               */
/* ------------------------------------------------------------------ */

/** current permission for the switch UI / test button (SSR → "unsupported") */
export function currentPermission(): PermissionState {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

/**
 * Daily event notification. Subscribes to the notifyEvents flag (re-arms the
 * timers when it toggles) and reads locale/system/sources from the settings
 * store freshly inside every check, so mid-session settings changes apply
 * without re-mounting. Mount ONCE (coordinator wires it in CelestialApp).
 */
export function useNotifications() {
  const notifyEvents = useSettings((s) => s.notifyEvents);

  useEffect(() => {
    // SSR safety + zero overhead while the feature is off
    if (typeof window === "undefined" || !notifyEvents) return;

    const check = async () => {
      const today = todayGregorian();
      const todayIso = isoDate(today);

      // pre-fetch gate — decideNotification returns null exactly when there
      // is nothing to do (feature off / permission missing / already handled
      // today); with events: [] a non-null result just means "gates open"
      const gate = decideNotification({
        notifyEvents: useSettings.getState().notifyEvents,
        permission: currentPermission(),
        lastNotifiedIso: window.localStorage.getItem(NOTIF_LAST_KEY),
        todayIso,
        todayLabel: "",
        locale: useSettings.getState().locale,
        dict: getDict(useSettings.getState().locale),
        events: [],
      });
      if (!gate) return;

      // today's events with the CURRENT source flags (same flags the views
      // use); offline is fine — we simply retry on the next tick
      let events: Awaited<ReturnType<typeof fetchEvents>>["events"];
      try {
        const res = await fetchEvents(
          todayIso,
          todayIso,
          useSettings.getState().sources,
        );
        events = res.events;
      } catch {
        return;
      }

      // final decision with fresh store state (locale may have changed)
      const s = useSettings.getState();
      const dict = getDict(s.locale);
      const decision = decideNotification({
        notifyEvents: s.notifyEvents,
        permission: currentPermission(),
        lastNotifiedIso: window.localStorage.getItem(NOTIF_LAST_KEY),
        todayIso,
        todayLabel: localizedTodayLabel(s.system, s.locale, dict, today),
        locale: s.locale,
        dict,
        events,
      });
      if (!decision) return;

      if (decision.notify) {
        try {
          new Notification(decision.title, {
            body: decision.body,
            tag: "celestial-today",
            icon: "/icons/icon-192.png",
          });
        } catch {
          // some engines throw on the constructor (e.g. Android WebView) —
          // treat as handled so we don't hammer every 60 s
        }
      }

      // mark today as handled (notify OR zero events — but ONLY after a
      // successful fetch, so an offline morning still notifies later)
      window.localStorage.setItem(NOTIF_LAST_KEY, todayIso);
    };

    void check();

    const interval = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [notifyEvents]);
}
