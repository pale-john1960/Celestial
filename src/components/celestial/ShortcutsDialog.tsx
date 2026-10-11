// Celestial — keyboard shortcuts help dialog (?)
"use client";

import { Keyboard } from "lucide-react";
import { getDict } from "@/lib/i18n";
import type { LocaleDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5">
      <span className="min-w-0 text-sm">{label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}

function shortcutRows(dict: LocaleDict): { keys: string[]; label: string }[] {
  return [
    { keys: ["←", "→"], label: `${dict.shortcutsPrev} / ${dict.shortcutsNext}` },
    { keys: ["T"], label: dict.goToday },
    { keys: ["M"], label: dict.viewMonth },
    { keys: ["W"], label: dict.viewWeek },
    { keys: ["Y"], label: dict.viewYear },
    { keys: ["D"], label: dict.viewDay },
    { keys: ["A"], label: dict.viewAgenda },
    { keys: ["/", "Ctrl", "K"], label: dict.search },
    { keys: ["S"], label: dict.settings },
    { keys: ["?"], label: dict.shortcuts },
  ];
}

export function ShortcutsDialog() {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale);
  const open = useUi((s) => s.shortcutsOpen);
  const setShortcutsOpen = useUi((s) => s.setShortcutsOpen);

  return (
    <Dialog open={open} onOpenChange={(v) => setShortcutsOpen(v)}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5 text-primary" aria-hidden />
            {dict.shortcuts}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {dict.shortcuts}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
          {shortcutRows(dict).map((row) => (
            <ShortcutRow key={row.label} keys={row.keys} label={row.label} />
          ))}
        </div>

        <p className="rounded-xl bg-muted/60 p-2.5 text-xs leading-relaxed text-muted-foreground">
          {dict.shortcutsNote}
        </p>
      </DialogContent>
    </Dialog>
  );
}
