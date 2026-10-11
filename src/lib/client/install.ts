// Celestial — shared install-prompt capture (PWA install UX)
// One module-level capture of the browser's `beforeinstallprompt` event,
// shared by the footer InstallChip and the Settings "App" section via
// useSyncExternalStore (no zustand slice needed for this ephemeral state).
"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { getDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";

/** Minimal shape of the browser's deferred install prompt event. */
interface BeforeInstallPromptEvent extends Event {
  /** Standard API resolves void; some wrappers resolve the choice directly. */
  prompt(): Promise<{ outcome?: string } | undefined>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface InstallState {
  /** browser offered install AND app is not installed / not standalone */
  canInstall: boolean;
  /** install completed in this session (appinstalled fired) */
  installed: boolean;
}

const INITIAL_STATE: InstallState = { canInstall: false, installed: false };

const listeners = new Set<() => void>();
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
// Referentially stable between changes — required by useSyncExternalStore.
let state: InstallState = INITIAL_STATE;

function emit() {
  for (const listener of listeners) listener();
}

/** already running as an installed app (standalone display / TWA referrer) */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    document.referrer.includes("android-app://")
  );
}

function refresh() {
  const canInstall = deferred !== null && !installed && !isStandalone();
  if (canInstall !== state.canInstall || installed !== state.installed) {
    state = { canInstall, installed };
    emit();
  }
}

let lastInstallToastAt = 0;

/**
 * Localized "installed" toast. Deduped for a few seconds so the
 * userChoice-accepted path and the appinstalled event never double-fire.
 */
export function notifyInstalled() {
  const now = Date.now();
  if (now - lastInstallToastAt < 4000) return;
  lastInstallToastAt = now;
  toast.success(getDict(useSettings.getState().locale).installDone);
}

/**
 * Show the browser install prompt and report the user's choice
 * ("accepted" | "dismissed"; undefined when unavailable or failed).
 */
export async function promptInstall(): Promise<
  "accepted" | "dismissed" | undefined
> {
  const event = deferred;
  if (!event) return undefined;

  let outcome: "accepted" | "dismissed" | undefined;
  try {
    const direct = await event.prompt();
    if (direct && typeof direct === "object" && direct.outcome) {
      // Non-standard shape: prompt() resolved with the choice itself.
      outcome = direct.outcome === "accepted" ? "accepted" : "dismissed";
    } else {
      const choice = await event.userChoice;
      outcome = choice ? choice.outcome : undefined;
    }
  } catch {
    outcome = undefined;
  } finally {
    // The deferred event is single-use either way — drop it.
    deferred = null;
    refresh();
  }

  if (outcome === "accepted") notifyInstalled();
  return outcome;
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallSnapshot(): InstallState {
  return state;
}

export function getServerInstallSnapshot(): InstallState {
  return INITIAL_STATE;
}

/** Reactive install state (false until the browser offers installation). */
export function useInstallState(): InstallState {
  return useSyncExternalStore(
    subscribeInstall,
    getInstallSnapshot,
    getServerInstallSnapshot,
  );
}

if (typeof window !== "undefined") {
  // Capture the browser's install offer and suppress its own mini-infobar.
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    installed = false;
    refresh();
  });

  // The app was installed (from our chip, the settings row or the browser
  // menu) — clear the capture and celebrate once.
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    refresh();
    notifyInstalled();
  });

  // display-mode can flip at runtime (e.g. devtools emulation) — stay in sync
  window
    .matchMedia?.("(display-mode: standalone)")
    .addEventListener?.("change", refresh);
}
