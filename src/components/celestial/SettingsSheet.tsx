// Celestial — settings sheet (system / language / week start / sources / theme / app / notifications / data / time / import)
"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { BellRing, Check, FileDown, MonitorDown, Smartphone, Upload, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { getDict, num } from "@/lib/i18n";
import type { LocaleDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import type {
  HeaderThemeCode,
  SourceFlags,
  WeekendDayCode,
} from "@/store/settings";
import { useUi } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useInstallState, promptInstall } from "@/lib/client/install";
import { fetchEvents, useInvalidateEvents } from "@/lib/client/api";
import {
  exportBackup,
  parseBackupText,
  restoreBackup,
} from "@/lib/client/backup";
import type { ParsedBackup } from "@/lib/client/backup";
import { isoDate, todayGregorian } from "@/lib/calendar";
import {
  currentPermission,
  decideNotification,
  localizedTodayLabel,
} from "@/hooks/use-notifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

/** app-section labels — THEME_LABELS pattern */
const APP_LABELS: Record<"en" | "ja" | "fa", { title: string }> = {
  en: { title: "App" },
  ja: { title: "アプリ" },
  fa: { title: "برنامه" },
};

/** hero artwork themes (round 13) — dict carries the localized labels */
const HEADER_THEME_CODES = [
  "seasonal",
  "celestial",
  "magical",
  "shahanshahi",
  "japanese",
  "korean",
  "chinese",
] as const satisfies readonly HeaderThemeCode[];

function headerThemeLabel(dict: LocaleDict, code: HeaderThemeCode): string {
  switch (code) {
    case "seasonal":
      return dict.themeSeasonal;
    case "celestial":
      return dict.themeCelestial;
    case "magical":
      return dict.themeMagical;
    case "shahanshahi":
      return dict.themeShahanshahi;
    case "japanese":
      return dict.themeJapanese;
    case "korean":
      return dict.themeKorean;
    case "chinese":
      return dict.themeChinese;
  }
}

/** true once a service worker is active (static assets are offline-ready) */
function useOfflineReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    let alive = true;
    navigator.serviceWorker.ready
      .then(() => {
        if (alive) setReady(true);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

/** App section — install button (shared deferred capture) + offline status */
function AppSection() {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale) as LocaleDict;
  const install = useInstallState();
  const offlineReady = useOfflineReady();

  // the APK row is always offered (the build ships with the repo)
  return (
    <>
      <Separator className="my-4" />
      <h3 className={sectionTitle()}>{APP_LABELS[locale].title}</h3>
      <div className="mt-1.5">
        {/* Android APK download (round 14) — anchors at /celestial-debug.apk */}
        <a
          href="/celestial-debug.apk"
          download="celestial-debug.apk"
          className="flex w-full items-start justify-between gap-3 rounded-xl p-2.5 text-start transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium leading-tight">
              {dict.apkDownload}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
              {dict.apkHint}
            </span>
          </span>
          <Smartphone
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </a>
        {install.canInstall && (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="flex w-full items-start justify-between gap-3 rounded-xl p-2.5 text-start transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-sm font-medium leading-tight">
              {dict.installApp}
            </span>
            <MonitorDown
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </button>
        )}
        {offlineReady && (
          <div className="flex items-center gap-2.5 rounded-xl p-2.5 text-sm text-muted-foreground">
            <span
              aria-hidden
              className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-600 dark:text-green-400"
            >
              <Check className="size-3" />
            </span>
            {dict.offlineReady}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Event notifications section — opt-in daily "today's events" notification.
 * Hidden entirely on browsers without the Notification API (Safari < 16 etc.
 * — documented choice: no dead UI). requestPermission runs INSIDE the change
 * handler so it stays a user gesture.
 */
function NotificationsSection() {
  const locale = useSettings((s) => s.locale);
  const notifyEvents = useSettings((s) => s.notifyEvents);
  const setNotifyEvents = useSettings((s) => s.setNotifyEvents);
  const dict = getDict(locale) as LocaleDict;

  // permission is read fresh on every render; the reducer forces a re-render
  // after each toggle attempt (a denied result may not change the flag)
  const permission = currentPermission();
  const [, refresh] = useReducer((x: number) => x + 1, 0);

  if (permission === "unsupported") return null;

  // hard-blocked by the browser: keep the switch usable so an enabled flag
  // can still be turned OFF, but block re-enabling
  const hardDenied = permission === "denied" && !notifyEvents;

  const onToggle = async (v: boolean) => {
    if (!v) {
      setNotifyEvents(false);
      refresh();
      return;
    }
    // must run inside the user gesture (this change handler)
    let result: NotificationPermission;
    try {
      result = await Notification.requestPermission();
    } catch {
      result = "denied";
    }
    if (result === "granted") {
      setNotifyEvents(true);
      toast.success(dict.notifGranted);
    } else {
      setNotifyEvents(false);
      toast.error(dict.notifPermissionDenied);
    }
    refresh();
  };

  const sendTest = async () => {
    const s = useSettings.getState();
    const today = todayGregorian();
    const todayIso = isoDate(today);
    const todayLabel = localizedTodayLabel(s.system, s.locale, dict, today);
    // honest sample: today's real events when cheaply available, tagline else
    let title = dict.notifTitle.replace("{date}", () => todayLabel);
    let body: string = dict.tagline;
    try {
      const res = await fetchEvents(todayIso, todayIso, s.sources);
      const decision = decideNotification({
        notifyEvents: true,
        permission: "granted",
        lastNotifiedIso: null, // a test is never blocked by the daily marker
        todayIso,
        todayLabel,
        locale: s.locale,
        dict,
        events: res.events,
      });
      if (decision?.notify) {
        title = decision.title;
        body = decision.body;
      }
    } catch {
      // offline → keep the tagline body
    }
    try {
      new Notification(title, {
        body,
        tag: "celestial-today",
        icon: "/icons/icon-192.png",
      });
    } catch {
      toast.error(dict.error);
    }
  };

  return (
    <>
      <Separator className="my-4" />
      <h3 className={sectionTitle()}>{dict.settingsNotifications}</h3>
      <div className="mt-1.5">
        <div className="flex items-start justify-between gap-3 rounded-xl p-2.5 hover:bg-accent">
          <div className="min-w-0">
            <Label
              htmlFor="notify-events"
              className="cursor-pointer text-sm font-medium leading-tight"
            >
              {dict.settingsNotifications}
            </Label>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {dict.notifDesc}
            </p>
            {permission === "denied" && (
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                {dict.notifPermissionDenied}
              </p>
            )}
          </div>
          <Switch
            id="notify-events"
            checked={notifyEvents}
            disabled={hardDenied}
            onCheckedChange={(v) => void onToggle(v)}
            className="mt-0.5 shrink-0"
          />
        </div>
        {notifyEvents && permission === "granted" && (
          <div className="px-2.5 pb-1.5 pt-0.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded-lg text-xs"
              onClick={() => void sendTest()}
            >
              <BellRing className="size-3.5" aria-hidden />
              {dict.notifTest}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Data section — backup (export) / restore (import) of events + settings.
 * Restore is replace-all on the server; a confirm dialog guards it.
 */
function DataSection() {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale) as LocaleDict;
  const invalidate = useInvalidateEvents();
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<ParsedBackup | null>(null);
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    setBusy(true);
    try {
      const count = await exportBackup();
      toast.success(
        dict.backupExported.replace("{count}", () => num(locale, count)),
      );
    } catch {
      toast.error(dict.error);
    } finally {
      setBusy(false);
    }
  };

  const onBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    void (async () => {
      try {
        const backup = parseBackupText(await file.text());
        setPendingBackup(backup); // → confirm dialog
      } catch {
        toast.error(dict.backupImportError);
      }
    })();
  };

  const confirmRestore = async () => {
    const backup = pendingBackup;
    setPendingBackup(null);
    if (!backup) return;
    setBusy(true);
    try {
      const count = await restoreBackup(backup);
      invalidate();
      toast.success(
        dict.backupImported.replace("{count}", () => num(locale, count)),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(message || dict.backupImportError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Separator className="my-4" />
      <h3 className={sectionTitle()}>{dict.settingsDataSection}</h3>
      <p className="mt-1.5 px-2.5 text-xs leading-snug text-muted-foreground">
        {dict.backupDesc}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Button
          variant="outline"
          className="justify-start rounded-xl"
          disabled={busy}
          onClick={() => void onExport()}
        >
          <FileDown className="size-4" aria-hidden />
          {dict.exportData}
        </Button>
        <Button
          variant="outline"
          className="justify-start rounded-xl"
          disabled={busy}
          onClick={() => backupInputRef.current?.click()}
        >
          <UploadCloud className="size-4" aria-hidden />
          {dict.importBackup}
        </Button>
      </div>
      <input
        ref={backupInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={onBackupFile}
      />

      {/* replace-all confirmation */}
      <AlertDialog
        open={pendingBackup !== null}
        onOpenChange={(open) => {
          if (!open) setPendingBackup(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dict.importBackup}</AlertDialogTitle>
            <AlertDialogDescription>
              {dict.backupReplaceConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmRestore()}>
              {dict.importBackup}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

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
            {radioRow(
              "imperialSolar",
              "sys-imperial-solar",
              dict.systemImperialSolar,
              dict.systemImperialSolarHint,
            )}
            {radioRow(
              "ancient",
              "sys-ancient",
              dict.systemAncient,
              dict.systemAncientHint,
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

          {/* weekly day off (round 14) — Select next to the week-start
              radios; same row pattern as the header-theme Select */}
          <div className="mt-1.5 flex items-center justify-between gap-3 rounded-xl p-2.5 hover:bg-accent">
            <Label
              htmlFor="weekend-day"
              className="cursor-pointer text-sm font-medium leading-tight"
            >
              {dict.weekendDay}
            </Label>
            <Select
              value={settings.weekendDay}
              onValueChange={(v) =>
                settings.setWeekendDay(v as WeekendDayCode)
              }
            >
              <SelectTrigger
                id="weekend-day"
                size="sm"
                className="mt-0.5 w-auto min-w-32 shrink-0 rounded-lg"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    ["auto", dict.weekendAuto],
                    ["none", dict.weekendNone],
                    ["friday", dict.weekendFriday],
                    ["saturday", dict.weekendSaturday],
                    ["sunday", dict.weekendSunday],
                  ] as const
                ).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ISO week-number column in the month grid (task 12-a) —
              same Switch row pattern as the notifications toggle */}
          <div className="mt-1.5 flex items-start justify-between gap-3 rounded-xl p-2.5 hover:bg-accent">
            <div className="min-w-0">
              <Label
                htmlFor="show-week-numbers"
                className="cursor-pointer text-sm font-medium leading-tight"
              >
                {dict.showWeekNumbers}
              </Label>
            </div>
            <Switch
              id="show-week-numbers"
              checked={settings.showWeekNumbers}
              onCheckedChange={(v) => settings.setShowWeekNumbers(v)}
              className="mt-0.5 shrink-0"
            />
          </div>

          {/* Hijri (AH) year line in the hero + horoscope card in Day view
              (round 13) — same Switch row pattern */}
          <div className="mt-1.5 flex items-start justify-between gap-3 rounded-xl p-2.5 hover:bg-accent">
            <div className="min-w-0">
              <Label
                htmlFor="show-hijri"
                className="cursor-pointer text-sm font-medium leading-tight"
              >
                {dict.showHijri}
              </Label>
            </div>
            <Switch
              id="show-hijri"
              checked={settings.showHijri}
              onCheckedChange={(v) => settings.setShowHijri(v)}
              className="mt-0.5 shrink-0"
            />
          </div>
          <div className="mt-1.5 flex items-start justify-between gap-3 rounded-xl p-2.5 hover:bg-accent">
            <div className="min-w-0">
              <Label
                htmlFor="show-horoscope"
                className="cursor-pointer text-sm font-medium leading-tight"
              >
                {dict.showHoroscope}
              </Label>
            </div>
            <Switch
              id="show-horoscope"
              checked={settings.showHoroscope}
              onCheckedChange={(v) => settings.setShowHoroscope(v)}
              className="mt-0.5 shrink-0"
            />
          </div>

          {/* royal (ancient) month names in the Imperial calendars (round 14) —
              same Switch row pattern as show-horoscope, with hint */}
          <div className="mt-1.5 flex items-start justify-between gap-3 rounded-xl p-2.5 hover:bg-accent">
            <div className="min-w-0">
              <Label
                htmlFor="royal-month-names"
                className="cursor-pointer text-sm font-medium leading-tight"
              >
                {dict.royalMonthNames}
              </Label>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                {dict.royalMonthNamesHint}
              </p>
            </div>
            <Switch
              id="royal-month-names"
              checked={settings.royalMonthNames}
              onCheckedChange={(v) => settings.setRoyalMonthNames(v)}
              className="mt-0.5 shrink-0"
            />
          </div>

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

          {/* hero header artwork theme (round 13) — Select near the palette radios */}
          <div className="mt-1.5 flex items-center justify-between gap-3 rounded-xl p-2.5 hover:bg-accent">
            <Label
              htmlFor="header-theme"
              className="cursor-pointer text-sm font-medium leading-tight"
            >
              {dict.headerTheme}
            </Label>
            <Select
              value={settings.headerTheme}
              onValueChange={(v) =>
                settings.setHeaderTheme(v as HeaderThemeCode)
              }
            >
              <SelectTrigger
                id="header-theme"
                size="sm"
                className="mt-0.5 w-auto min-w-32 shrink-0 rounded-lg"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEADER_THEME_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {headerThemeLabel(dict, code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* app (install + offline) */}
          <AppSection />

          {/* event notifications (opt-in daily notification) */}
          <NotificationsSection />

          {/* data (backup / restore) */}
          <DataSection />

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
