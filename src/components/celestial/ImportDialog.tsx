// Celestial — import dialog: upload JSON/TXT/CSV, samples, manage imported events
"use client";

import { useRef, useState } from "react";
import { FileDown, FileUp, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { getDict, jalaliMonthName, num } from "@/lib/i18n";
import { parseIso } from "@/lib/calendar";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import {
  deleteImportedEvents,
  importEventsFile,
  useImportedEvents,
  useInvalidateEvents,
} from "@/lib/client/api";
import type { ImportResult, ImportedRow } from "@/lib/client/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const MAX_BYTES = 256 * 1024;
const ALLOWED_EXT = [".json", ".txt", ".csv"];

export function ImportDialog() {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale);

  const open = useUi((s) => s.importOpen);
  const setImportOpen = useUi((s) => s.setImportOpen);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);

  const importedQuery = useImportedEvents("1900-01-01", "2100-12-31", open);
  const invalidate = useInvalidateEvents();

  const upload = async (file: File) => {
    const lower = file.name.toLowerCase();
    if (!ALLOWED_EXT.some((ext) => lower.endsWith(ext))) {
      toast.error(dict.importInvalid, {
        description: ".json / .txt / .csv",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name}: >256KB`);
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const res = await importEventsFile(file);
      setResult(res);
      if (res.imported > 0) {
        toast.success(`${num(locale, res.imported)} ${dict.importResult}`);
      } else {
        toast.error(dict.importInvalid);
      }
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : dict.error);
    } finally {
      setUploading(false);
    }
  };

  const removeOne = async (row: ImportedRow) => {
    try {
      await deleteImportedEvents({ id: row.id });
      toast.success(`${row.title} — ${dict.remove}`);
      invalidate();
    } catch {
      toast.error(dict.error);
    }
  };

  const clearAll = async () => {
    try {
      const res = await deleteImportedEvents({ all: true });
      toast.success(`${dict.clearAll}: ${num(locale, res.deleted)}`);
      invalidate();
    } catch {
      toast.error(dict.error);
    }
  };

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void upload(file);
    },
  };

  const rows = importedQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => setImportOpen(v)}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="size-5 text-primary" aria-hidden />
            {dict.importTitle}
          </DialogTitle>
          <DialogDescription>{dict.importHint}</DialogDescription>
        </DialogHeader>

        {/* drop zone / file input */}
        <div
          {...dropHandlers}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            dragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-accent/50",
          )}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
        >
          {uploading ? (
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
          ) : (
            <UploadCloud className="size-8 text-muted-foreground" aria-hidden />
          )}
          <p className="text-sm font-medium">
            {uploading ? dict.importParsing : dict.importChooseFile}
          </p>
          <p className="text-xs text-muted-foreground">
            .json · .txt · .csv · ≤256KB · ≤500
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.txt,.csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* parse result */}
        {result && result.errors.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs font-semibold text-destructive">
              {result.imported > 0
                ? `${num(locale, result.errors.length)} ⚠`
                : dict.importInvalid}
            </p>
            <ul className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto text-xs text-destructive/90">
              {result.errors.map((err, i) => (
                <li key={i} className="break-words">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* sample files */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {dict.sampleFiles}
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            {(
              [
                ["events.json", dict.importFormatJson],
                ["events.txt", dict.importFormatTxt],
                ["events.csv", dict.importFormatCsv],
              ] as const
            ).map(([file, label]) => (
              <a
                key={file}
                href={`/samples/${file}`}
                download
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FileDown className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate">{label}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {file}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>

        <Separator />

        {/* imported events list */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {dict.importedEventsList}
              {rows.length > 0 ? ` (${num(locale, rows.length)})` : ""}
            </h3>
            {rows.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {dict.clearAll}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{dict.clearAll}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {dict.deleteImported} — {num(locale, rows.length)}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{dict.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={() => void clearAll()}
                    >
                      {dict.clearAll}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {importedQuery.isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">{dict.loading}</p>
          ) : rows.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {dict.noImportedEvents}
            </p>
          ) : (
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
              {rows.map((row) => (
                <ImportedRowItem
                  key={row.id}
                  row={row}
                  dict={dict}
                  locale={locale}
                  onRemove={() => void removeOne(row)}
                />
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportedRowItem({
  row,
  dict,
  locale,
  onRemove,
}: {
  row: ImportedRow;
  dict: ReturnType<typeof getDict>;
  locale: "en" | "ja" | "fa";
  onRemove: () => void;
}) {
  const g = parseIso(row.iso);
  const j = parseIso(row.jalaliIso);
  const jalaliText = j
    ? `${jalaliMonthName(locale, j.month)} ${num(locale, j.day)}, ${num(locale, j.year)}`
    : row.jalaliIso;

  return (
    <li className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5">
      <span aria-hidden className="text-lg leading-none">
        {row.sourceName === "manual" ? "✍️" : row.isHoliday ? "🌙" : "📥"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" dir="auto">
          {row.title}
        </p>
        <p className="truncate text-xs text-muted-foreground tabular-nums" dir="auto">
          {g ? `${g.year}-${g.month}-${g.day}` : row.iso} · {jalaliText}
          {row.sourceName ? ` · ${row.sourceName}` : ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`${dict.remove}: ${row.title}`}
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" aria-hidden />
      </Button>
    </li>
  );
}
