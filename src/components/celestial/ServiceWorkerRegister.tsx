// Celestial — service worker registration (static-asset offline shell)
// Registers /sw.js at scope "/" once on mount. Registration failures are
// warned (not errored) so a failed registration never pollutes the console
// error count, and non-http(s) contexts (about:blank iframes etc.) are
// skipped entirely.
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const { protocol } = window.location;
    if (protocol !== "http:" && protocol !== "https:") return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err: unknown) => {
        console.warn(
          "Celestial: service worker registration skipped:",
          err instanceof Error ? err.message : err,
        );
      });
  }, []);

  return null;
}
