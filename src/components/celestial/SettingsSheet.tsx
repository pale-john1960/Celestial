// Celestial — settings sheet (system / language / week start / sources / theme / time / import)
"use client";

import { Upload } from "lucide-react";
import { getDict } from "@/lib/i18n";
import type { LocaleDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import type { SourceFlags } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CategoryLegend } from "./CategoryLegend";
import { TimeSyncPanel } from "./TimeSyncPanel";

function sectionTitle(className?: string) {
  return cn(
    "text-xs font-bold uppercase tracking-wide text-muted-foreground",
    className,
  );
}

function radioRow(value: string, id: string, label: string, hint?: string) {
  return (
    <Label
      key={id}
      htmlFor={id}
      className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-transparent p-2.5 transition-colors hover:bg-accent has-[button[data-state=checked]]:border-border has-[button[data-state=checked]]:bg-accent"
    >
      <RadioGroupItem value={value} id={id} className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
    </Label>
  );
}

function sourceRow(
  key: keyof SourceFlags,
  label: string,
  checked: boolean,
  onChange: (v: boolean) => void,
  hint?: string,
) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl p-2.5 hover:bg-accent">
      <div className="min-w-0">
        <Label
          htmlFor={`src-${key}`}
          className="cursor-pointer text-sm font-medium leading-tight"
        >
          {label}
        </Label>
        {hint && (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <Switch
        id={`src-${key}`}
        checked={checked}
        onCheckedChange={onChange}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}

/** theme labels — no engine dict keys for these, kept in sync across locales */
const THEME_LABELS: Record<"en" | "ja" | "fa", Record<string, string>> = {
  en: { title: "Theme", light: "Light", dark: "Dark", system: "System" },
  ja: { title: "テーマ", light: "ライト", dark: "ダーク", system: "システム" },
  fa: { title: "پوسته", light: "روشن", dark: "تاریک", system: "سیستم" },
};

export function SettingsSheet() {
  const locale = useSettings((s) => s.locale);
  const settings = useSettings();
  const dict = getDict(locale) as LocaleDict;
  const nativeLabels = {
    en: getDict("en").label,
    ja: getDict("ja").label,
    fa: getDict("fa").label,
  };

  const settingsOpen = useUi((s) => s.settingsOpen);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const setImportOpen = useUi((s) => s.setImportOpen);

  return (
    <Sheet
      open={settingsOpen}
      onOpenChange={(open) => setSettingsOpen(open)}
    >
      <SheetContent
        side={dict.dir === "rtl" ? "left" : "right"}
        closeLabel={dict.close}
        className="w-full gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="pb-2">
          <SheetTitle>{dict.settings}</SheetTitle>
          <SheetDescription>{dict.tagline}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {/* calendar system */}
          <h3 className={sectionTitle("mt-2")}>{dict.calendarSystem}</h3>
          <RadioGroup
            value={settings.system}
            onValueChange={(v) => settings.setSystem(v as typeof settings.system)}
            className="mt-1.5 gap-0.5"
          >
            {radioRow("gregorian", "sys-gregorian", dict.systemGregorian)}
            {radioRow("jalali", "sys-jalali", dict.systemJalali)}
            {radioRow(
              "imperial",
              "sys-imperial",
              dict.systemImperial,
              dict.systemImperialHint,
            )}
          </RadioGroup>

          <Separator className="my-4" />

          {/* language */}
          <h3 className={sectionTitle()}>{dict.language}</h3>
          <RadioGroup
            value={locale}
            onValueChange={(v) => settings.setLocale(v as typeof locale)}
            className="mt-1.5 gap-0.5"
          >
            {(["en", "ja", "fa"] as const).map((code) =>
              radioRow(code, `sys-locale-${code}`, nativeLabels[code]),
            )}
          </RadioGroup>

          <Separator className="my-4" />

          {/* week start */}
          <h3 className={sectionTitle()}>{dict.weekStart}</h3>
          <RadioGroup
            value={String(settings.weekStart)}
            onValueChange={(v) =>
              settings.setWeekStart(Number(v) as typeof settings.weekStart)
            }
            className="mt-1.5 gap-0.5"
          >
            {radioRow("6", "ws-6", dict.weekStartSat)}
            {radioRow("0", "ws-0", dict.weekStartSun)}
            {radioRow("1", "ws-1", dict.weekStartMon)}
          </RadioGroup>

          <Separator className="my-4" />

          {/* event sources */}
          <h3 className={sectionTitle()}>{dict.eventSources}</h3>
          <div className="mt-1.5">
            {sourceRow(
              "international",
              dict.srcInternational,
              settings.sources.international,
              (v) => settings.setSource("international", v),
            )}
            {sourceRow("us", dict.srcUs, settings.sources.us, (v) =>
              settings.setSource("us", v),
            )}
            {sourceRow("japan", dict.srcJapan, settings.sources.japan, (v) =>
              settings.setSource("japan", v),
            )}
            {sourceRow(
              "persianCultural",
              dict.srcPersianCultural,
              settings.sources.persianCultural,
              (v) => settings.setSource("persianCultural", v),
            )}
            <div>
              {sourceRow(
                "persianReligious",
                dict.srcPersianReligious,
                settings.sources.persianReligious,
                (v) => settings.setSource("persianReligious", v),
              )}
              {!settings.sources.persianReligious && (
                <p className="mx-2.5 -mt-1 mb-2 rounded-lg bg-muted/70 p-2.5 text-xs leading-snug text-muted-foreground">
                  {dict.religiousHiddenHolidayNote}
                </p>
              )}
            </div>
            {sourceRow(
              "persianNational",
              dict.srcPersianNational,
              settings.sources.persianNational,
              (v) => settings.setSource("persianNational", v),
            )}
            {sourceRow("imported", dict.srcImported, settings.sources.imported, (v) =>
              settings.setSource("imported", v),
            )}
            <div>
              {sourceRow(
                "online",
                dict.onlineSources,
                settings.sources.online,
                (v) => settings.setSource("online", v),
                dict.onlineHint,
              )}
            </div>
          </div>

          <CategoryLegend
            dict={dict}
            sources={settings.sources}
            className="mt-2"
          />

          <Separator className="my-4" />

          {/* theme */}
          <h3 className={sectionTitle()}>{THEME_LABELS[locale].title}</h3>
          <RadioGroup
            value={settings.theme}
            onValueChange={(v) => settings.setTheme(v as typeof settings.theme)}
            className="mt-1.5 gap-0.5"
          >
            {(["light", "dark", "system"] as const).map((mode) =>
              radioRow(mode, `theme-${mode}`, THEME_LABELS[locale][mode]),
            )}
          </RadioGroup>

          <Separator className="my-4" />

          {/* time sync */}
          <h3 className={sectionTitle()}>{dict.timeSync}</h3>
          <div className="mt-1.5">
            <TimeSyncPanel />
          </div>

          <Separator className="my-4" />

          {/* import */}
          <h3 className={sectionTitle()}>{dict.importEvents}</h3>
          <Button
            variant="outline"
            className="mt-1.5 w-full justify-start rounded-xl"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="size-4" aria-hidden />
            {dict.importEvents}
          </Button>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            Celestial v1.0 · Nager.Date · pool.ntp.org
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
