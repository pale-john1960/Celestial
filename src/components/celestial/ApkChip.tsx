// Celestial — footer Android APK download chip (round 14).
// Always visible: the APK is committed to the repo and served at
// /celestial-debug.apk, so the user can grab the Android build straight
// from the web app (user request: "add apk dl in the web version").
"use client";

import { Smartphone } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";

export function ApkChip() {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale);

  return (
    <>
      <span aria-hidden>·</span>
      <a
        href="/celestial-debug.apk"
        download="celestial-debug.apk"
        aria-label={dict.apkDownload}
        title={dict.apkHint}
        className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Smartphone className="size-3.5" aria-hidden />
        {dict.apkDownload}
      </a>
    </>
  );
}
