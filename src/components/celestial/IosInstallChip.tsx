// Celestial — footer iOS install hint (Add to Home Screen)
// iOS Safari never fires beforeinstallprompt (the InstallChip stays
// invisible there), so iOS users get this manual-install hint chip instead:
// "Share → Add to Home Screen". Dismissal is persisted (localStorage) and
// the chip hides once running standalone (i.e. actually installed).
// NOTE: renders only inside the footer, which mounts after hydration
// (page.tsx mount gate) — the lazy localStorage read is therefore SSR-safe.
"use client";

import { useState } from "react";
import { Share, X } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";

/** iOS Safari detection — iPadOS 13+ masquerades as desktop macOS, so a
 *  touch-capable "Macintosh" counts too. */
function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const iosDevice = /iphone|ipod|ipad/i.test(ua);
  const ipadAsMac =
    /macintosh/i.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  return iosDevice || ipadAsMac;
}

/** iOS-specific navigator.standalone plus the generic display-mode check. */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches === true
  );
}

const DISMISS_KEY = "celestial-ios-hint-dismissed";

export function IosInstallChip() {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale);
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(DISMISS_KEY) === "1",
  );

  if (dismissed || !isIosSafari() || isStandalone()) return null;

  return (
    <>
      <span aria-hidden>·</span>
      <span
        role="status"
        className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card pl-2.5 pr-1 text-xs text-muted-foreground"
      >
        <Share className="size-3.5 text-primary" aria-hidden />
        {dict.iosInstallHint}
        <button
          type="button"
          aria-label={dict.close}
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          className="grid size-5 place-items-center rounded-full text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3" aria-hidden />
        </button>
      </span>
    </>
  );
}
