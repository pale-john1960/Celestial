// Celestial — add/edit event dialog: manual event creation (✍️) and editing
// (PATCH). Edit mode edits the ANCHOR row — for a recurring series the whole
// series updates.
"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Check, Loader2, Palette, Pencil, Repeat, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  buildDayCell,
  imperialDayName,
  parseIso,
  todayGregorian,
} from "@/lib/calendar";
import { getDict } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import {
  createCustomEvent,
  deleteImportedEvents,
  updateEvent,
  useInvalidateEvents,
} from "@/lib/client/api";
import { EVENT_COLOR_PALETTE, categoryColor } from "./CategoryLegend";
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  formatGregorianDate,
  formatHijriDate,
  formatImperialDate,
  formatJalaliDate,
} from "./HeroHeader";

const MIN_DATE = "1900-01-01";
const MAX_DATE = "2100-12-31";

export function AddEventDialog() {
  const locale = useSettings((s) => s.locale);
  const showHijri = useSettings((s) => s.showHijri);
  const dict = getDict(locale);

  const open = useUi((s) => s.addEventOpen || s.editEvent !== null);
  const addOpen = useUi((s) => s.addEventOpen);
  const editEvent = useUi((s) => s.editEvent);
  const closeEventEditor = useUi((s) => s.closeEventEditor);
  const selectedIso = useUi((s) => s.selectedIso);

  const [dateIso, setDateIso] = useState(selectedIso);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);
  const [recurYearly, setRecurYearly] = useState(false);
  /** selected swatch — null = category default */
  const [color, setColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const invalidate = useInvalidateEvents();

  const editing = editEvent != null;

  // fresh form on create; prefilled form on edit (anchor fields included)
  useEffect(() => {
    if (open) {
      if (editEvent) {
        setDateIso(editEvent.iso);
        setTitle(editEvent.title);
        setDescription(editEvent.description);
        setIsHoliday(editEvent.isHoliday);
        setRecurYearly(editEvent.recurYearly);
        setColor(editEvent.color ?? null);
      } else {
        setDateIso(selectedIso);
        setTitle("");
        setDescription("");
        setIsHoliday(false);
        setRecurYearly(false);
        setColor(null);
      }
      setSaving(false);
      setDeleting(false);
    }
  }, [open, addOpen, editEvent, selectedIso]);

  // live conversion line — all systems + Hijri for the chosen date
  const conversion = useMemo(() => {
    const g = parseIso(dateIso);
    if (!g) return null;
    const cell = buildDayCell(g, todayGregorian(), true);
    return {
      gregorian: formatGregorianDate(locale, cell.gregorian, dict),
      jalali: formatJalaliDate(locale, cell.jalali, dict),
      imperial: formatImperialDate(locale, cell.imperial, dict),
      imperialDay:
        cell.imperial.month !== 13
          ? imperialDayName(locale, cell.imperial)
          : null,
      hijri: formatHijriDate(locale, cell.hijri, dict),
    };
  }, [dateIso, locale, dict]);

  const submit = async () => {
    if (saving) return;
    const t = title.trim();
    if (!parseIso(dateIso)) {
      toast.error(dict.addEventDate);
      return;
    }
    if (t.length < 1 || t.length > 120) {
      toast.error(`${dict.addEventName}: 1–120`);
      return;
    }
    setSaving(true);
    try {
      if (editing && editEvent) {
        await updateEvent({
          id: editEvent.id,
          iso: dateIso,
          title: t,
          description: description.trim() ? description.trim() : undefined,
          isHoliday,
          recurYearly,
          color,
        });
        toast.success(`✍️ ${dict.eventUpdated}`);
      } else {
        await createCustomEvent({
          iso: dateIso,
          title: t,
          description: description.trim() ? description.trim() : undefined,
          isHoliday,
          recurYearly,
          color,
        });
        toast.success(`✍️ ${dict.addEventSaved}`);
      }
      invalidate();
      closeEventEditor();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : dict.error);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editEvent || deleting) return;
    setDeleting(true);
    try {
      await deleteImportedEvents({ id: editEvent.id });
      toast.success(`${editEvent.title} — ${dict.remove}`);
      invalidate();
      closeEventEditor();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : dict.error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) closeEventEditor();
      }}
    >
      <DialogContent closeLabel={dict.close} className="max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
            >
              {editing ? (
                <Pencil className="size-5" aria-hidden />
              ) : (
                <CalendarPlus className="size-5" aria-hidden />
              )}
            </span>
            {editing ? dict.editEvent : dict.addEventTitle}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? `${editEvent?.title ?? ""} · ${editEvent?.iso ?? ""}`
              : dict.addEvent}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-event-date">{dict.addEventDate}</Label>
            <Input
              id="add-event-date"
              type="date"
              value={dateIso}
              min={MIN_DATE}
              max={MAX_DATE}
              onChange={(e) => setDateIso(e.target.value)}
              className="h-10 rounded-xl"
            />
            {conversion && (
              <div
                className="rounded-xl bg-muted/60 p-2.5 text-xs leading-relaxed text-muted-foreground"
                dir="auto"
              >
                <p className="tabular-nums">{conversion.gregorian}</p>
                <p className="tabular-nums">{conversion.jalali}</p>
                <p className="tabular-nums">
                  {conversion.imperial}
                  {conversion.imperialDay
                    ? ` · ${dict.dayNameLabel}: ${conversion.imperialDay}`
                    : ""}
                </p>
                {showHijri && (
                  <p className="tabular-nums">{conversion.hijri}</p>
                )}
              </div>
            )}
          </div>

          {/* title */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="add-event-title">{dict.addEventName}</Label>
              {/* live preview of the effective dot color */}
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full ring-1 ring-border"
                style={{ backgroundColor: color ?? categoryColor("imported") }}
              />
            </div>
            <Input
              id="add-event-title"
              value={title}
              maxLength={120}
              placeholder={dict.addEventNamePh}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          {/* description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-event-desc">{dict.addEventDesc}</Label>
            <Textarea
              id="add-event-desc"
              value={description}
              maxLength={500}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* color */}
          <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-2.5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Palette className="size-3.5" aria-hidden />
                {dict.eventColor}
              </span>
              <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                {dict.eventColorHint}
              </p>
            </div>
            <div
              role="group"
              aria-label={dict.eventColor}
              className="flex flex-wrap items-center gap-1.5"
            >
              {EVENT_COLOR_PALETTE.map((c) => {
                const selected = color === c;
                const label = c.toUpperCase();
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${dict.eventColor}: ${label}`}
                    title={label}
                    onClick={() => setColor(c)}
                    className={cn(
                      "grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-background",
                      "transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "motion-reduce:transition-none motion-reduce:hover:scale-100",
                      selected && "ring-2 ring-ring",
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {selected && (
                      <Check
                        className="size-3.5 text-white drop-shadow-sm"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={color === null}
                aria-label={dict.eventColorNone}
                title={dict.eventColorNone}
                onClick={() => setColor(null)}
                className={cn(
                  "grid size-7 place-items-center rounded-full border border-dashed border-border text-muted-foreground ring-offset-2 ring-offset-background",
                  "transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "motion-reduce:transition-none motion-reduce:hover:scale-100",
                  color === null && "ring-2 ring-ring",
                )}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>

          {/* day off */}
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0">
              <Label htmlFor="add-event-holiday" className="text-sm">
                ✍️ {dict.addEventHoliday}
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {dict.dayOffNotice}
              </p>
            </div>
            <Switch
              id="add-event-holiday"
              checked={isHoliday}
              onCheckedChange={setIsHoliday}
            />
          </div>

          {/* repeats yearly */}
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0">
              <Label htmlFor="add-event-yearly" className="text-sm">
                <Repeat className="me-1 inline size-3.5" aria-hidden />
                {dict.addEventYearly}
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {dict.addEventYearlyHint}
              </p>
            </div>
            <Switch
              id="add-event-yearly"
              checked={recurYearly}
              onCheckedChange={setRecurYearly}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {editing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={saving || deleting}
                  className="rounded-xl border-destructive/40 text-destructive transition-[color,background-color,border-color,transform] duration-150 hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive active:scale-95"
                >
                  <Trash2 className="size-4" aria-hidden />
                  {dict.deleteEvent}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{dict.deleteEvent}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {editEvent?.title} — {dict.deleteImported}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{dict.cancel}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => void remove()}
                  >
                    {dict.deleteEvent}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            onClick={() => closeEventEditor()}
            disabled={saving}
            className="transition-transform active:scale-95"
          >
            {dict.cancel}
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={saving || deleting || !title.trim()}
            className="transition-transform active:scale-95"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : editing ? (
              <Pencil className="size-4" aria-hidden />
            ) : (
              <CalendarPlus className="size-4" aria-hidden />
            )}
            {editing ? dict.saveChanges : dict.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
