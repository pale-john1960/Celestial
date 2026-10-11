// Celestial — backup/restore client helpers (SettingsSheet "Data" section)
// Export: compose { version, app, exportedAt, settings, events } from the
// settings store + the imported-events list endpoint and download it as
// celestial-backup-YYYY-MM-DD.json.
// Import: shape-check (version === 1, events is an array), POST to
// /api/backup (replace-all on the server), then defensively apply the
// backup's settings into the store. Toasts live in SettingsSheet — these
// helpers only throw.
"use client";

import type { ImportedRow } from "@/lib/client/api";
import { useSettings } from "@/store/settings";
import type {
  Locale,
  SourceFlags,
  SystemCode,
  ThemeCode,
  WeekStartCode,
} from "@/store/settings";

/** backup format version — bump on breaking changes */
export const BACKUP_VERSION = 1;

/** every source flag key, in store order */
const SOURCE_KEYS: (keyof SourceFlags)[] = [
  "international",
  "us",
  "japan",
  "persianCultural",
  "persianReligious",
  "persianNational",
  "imported",
  "online",
];

/** settings snapshot carried inside a backup file */
export interface BackupSettings {
  locale: Locale;
  system: SystemCode;
  weekStart: WeekStartCode;
  sources: SourceFlags;
  theme: ThemeCode;
  notifyEvents: boolean;
}

/** one exported event row — exactly the POST /api/backup row shape */
export interface BackupEventRow {
  iso: string;
  title: string;
  description: string | null;
  isHoliday: boolean;
  recurYearly: boolean;
  color: string | null;
  sourceName: string;
}

/** a parsed backup file — `settings` stays untrusted until applied defensively */
export interface ParsedBackup {
  events: unknown[];
  settings?: unknown;
}

/** full backup file as written by exportBackup (typed view) */
export interface BackupFile {
  version: number;
  app: string;
  exportedAt: string;
  settings: BackupSettings;
  events: BackupEventRow[];
}

/* ------------------------------------------------------------------ */
/* export                                                              */
/* ------------------------------------------------------------------ */

/**
 * Compose the backup file and trigger a download. Returns the exported event
 * count (for the success toast). Throws when the events fetch fails — the
 * caller shows the standard error toast then.
 */
export async function exportBackup(): Promise<number> {
  if (typeof document === "undefined") {
    throw new Error("export is client-only");
  }

  // current settings snapshot (plain read — no re-render coupling)
  const s = useSettings.getState();
  const settings: BackupSettings = {
    locale: s.locale,
    system: s.system,
    weekStart: s.weekStart,
    sources: { ...s.sources },
    theme: s.theme,
    notifyEvents: s.notifyEvents,
  };

  // ALL imported events (wide range = the import dialog's list query)
  const res = await fetch("/api/events/imported?from=1900-01-01&to=2100-12-31");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { events: ImportedRow[] };

  const events: BackupEventRow[] = data.events.map((e) => ({
    iso: e.iso,
    title: e.title,
    description: e.description,
    isHoliday: e.isHoliday,
    recurYearly: e.recurYearly,
    color: e.color,
    sourceName: e.sourceName,
  }));

  const backup: BackupFile = {
    version: BACKUP_VERSION,
    app: "celestial",
    exportedAt: new Date().toISOString(),
    settings,
    events,
  };

  // download as celestial-backup-YYYY-MM-DD.json (LOCAL date)
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  a.href = url;
  a.download = `celestial-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return events.length;
}

/* ------------------------------------------------------------------ */
/* import                                                              */
/* ------------------------------------------------------------------ */

/**
 * Parse + shape-check a backup file's text. Throws on invalid JSON or wrong
 * shape (version !== 1 / events not an array) — the caller toasts
 * dict.backupImportError and stops before any confirm dialog.
 */
export function parseBackupText(text: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("not valid JSON");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("backup must be an object");
  }
  const b = parsed as { version?: unknown; events?: unknown; settings?: unknown };
  if (b.version !== BACKUP_VERSION || !Array.isArray(b.events)) {
    throw new Error("unsupported backup format");
  }
  return { events: b.events, settings: b.settings };
}

/** Defensively apply a backup's settings snapshot (per-field type checks). */
function applyBackupSettings(value: unknown): void {
  if (!value || typeof value !== "object") return;
  const s = value as Record<string, unknown>;
  const store = useSettings.getState();

  if (s.locale === "en" || s.locale === "ja" || s.locale === "fa") {
    store.setLocale(s.locale);
  }
  if (s.system === "gregorian" || s.system === "jalali" || s.system === "imperial") {
    store.setSystem(s.system);
  }
  if (s.weekStart === 0 || s.weekStart === 1 || s.weekStart === 6) {
    store.setWeekStart(s.weekStart);
  }
  if (s.theme === "light" || s.theme === "dark" || s.theme === "system") {
    store.setTheme(s.theme);
  }
  if (typeof s.notifyEvents === "boolean") {
    store.setNotifyEvents(s.notifyEvents);
  }
  if (s.sources && typeof s.sources === "object") {
    const src = s.sources as Record<string, unknown>;
    for (const key of SOURCE_KEYS) {
      if (typeof src[key] === "boolean") store.setSource(key, src[key] as boolean);
    }
  }
}

/**
 * POST the backup's events to /api/backup (server replaces ALL rows). On
 * success, apply the backup's settings (when present) and return the
 * restored count. Throws with the server's error message on HTTP errors
 * (or an empty message for unexpected shapes — the caller falls back).
 */
export async function restoreBackup(backup: ParsedBackup): Promise<number> {
  const res = await fetch("/api/backup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: backup.events }),
  });
  const data = (await res.json().catch(() => null)) as {
    restored?: number;
    error?: string;
  } | null;
  if (!res.ok || !data || typeof data.restored !== "number") {
    throw new Error(data?.error ?? "");
  }
  if (backup.settings !== undefined) applyBackupSettings(backup.settings);
  return data.restored;
}
