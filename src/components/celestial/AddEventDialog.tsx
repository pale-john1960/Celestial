// Celestial — add-event dialog: manual event creation (✍️)
"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
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
import { createCustomEvent, useInvalidateEvents } from "@/lib/client/api";
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
  const dict = getDict(locale);

  const open = useUi((s) => s.addEventOpen);
  const setAddEventOpen = useUi((s) => s.setAddEventOpen);
  const selectedIso = useUi((s) => s.selectedIso);

  const [dateIso, setDateIso] = useState(selectedIso);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);
  const [saving, setSaving] = useState(false);

  const invalidate = useInvalidateEvents();

  // fresh form each time the dialog opens (default = current selection)
  useEffect(() => {
    if (open) {
      setDateIso(selectedIso);
      setTitle("");
      setDescription("");
      setIsHoliday(false);
      setSaving(false);
    }
  }, [open, selectedIso]);

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
      await createCustomEvent({
        iso: dateIso,
        title: t,
        description: description.trim() ? description.trim() : undefined,
        isHoliday,
      });
      invalidate();
      toast.success(`✍️ ${dict.addEventSaved}`);
      setAddEventOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : dict.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => setAddEventOpen(v)}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-5 text-primary" aria-hidden />
            {dict.addEventTitle}
          </DialogTitle>
          <DialogDescription>{dict.addEvent}</DialogDescription>
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
                <p className="tabular-nums">{conversion.hijri}</p>
              </div>
            )}
          </div>

          {/* title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-event-title">{dict.addEventName}</Label>
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setAddEventOpen(false)}
            disabled={saving}
          >
            {dict.cancel}
          </Button>
          <Button onClick={() => void submit()} disabled={saving || !title.trim()}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CalendarPlus className="size-4" aria-hidden />
            )}
            {dict.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
