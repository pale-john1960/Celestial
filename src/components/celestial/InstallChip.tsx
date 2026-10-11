// Celestial — footer install chip (appears when the browser offers install)
"use client";

import { Download } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { promptInstall, useInstallState } from "@/lib/client/install";

export function InstallChip() {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale);
  const install = useInstallState();

  // Hidden until the browser fires beforeinstallprompt, and hidden again
  // once installed / running standalone — renders nothing, no layout shift
  // (the footer row is flex-wrap, the chip simply wraps when it appears).
  if (!install.canInstall) return null;

  return (
    <>
      <span aria-hidden>·</span>
      <button
        type="button"
        onClick={() => void promptInstall()}
        aria-label={dict.installApp}
        className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Download className="size-3.5" aria-hidden />
        {dict.installApp}
      </button>
    </>
  );
}
