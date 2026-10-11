// Celestial — full event detail dialog
"use client";

import { buildDayCell, imperialDayName, todayGregorian } from "@/lib/calendar";
import { getDict, weekdayLong } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  categoryLabel,
  eventColor,
  sourceBadgeText,
} from "./CategoryLegend";
import { SourceBadge } from "./DayView";
import { EventGlyph } from "./FlagIcon";
import {
  formatGregorianDate,
  formatHijriDate,
  formatImperialDate,
  formatJalaliDate,
} from "./HeroHeader";

export function EventDialog() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const showHijri = useSettings((s) => s.showHijri);
  const dict = getDict(locale);
  const activeEvent = useUi((s) => s.activeEvent);
  const setEventDialog = useUi((s) => s.setEventDialog);
  const openEditDialog = useUi((s) => s.openEditDialog);

  const today = todayGregorian();
  const cell = activeEvent ? buildDayCell(activeEvent.gregorian, today, true) : null;

  const activeDateText =
    cell == null
      ? ""
      : system === "gregorian"
        ? formatGregorianDate(locale, cell.gregorian, dict)
        : system === "jalali"
          ? formatJalaliDate(locale, cell.jalali, dict)
          : formatImperialDate(locale, cell.imperial, dict);

  // only imported/manual rows can be edited (dbId present)
  const editable = activeEvent?.dbId != null;

  const onEdit = () => {
    if (!activeEvent || !editable) return;
    setEventDialog(null);
    openEditDialog({
      id: activeEvent.dbId as string,
      // for recurring series the ANCHOR row is what gets edited
      iso: activeEvent.recurring
        ? (activeEvent.anchorIso ?? activeEvent.iso)
        : activeEvent.iso,
      title: activeEvent.names.en,
      description: activeEvent.descriptions.en,
      isHoliday: activeEvent.isHoliday,
      recurYearly: activeEvent.recurring === true,
      color: activeEvent.color ?? null,
    });
  };

  return (
    <Dialog
      open={activeEvent !== null}
      onOpenChange={(open) => {
        if (!open) setEventDialog(null);
      }}
    >
      <DialogContent closeLabel={dict.close} className="max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl">
        {activeEvent && cell && (
          <>
            <DialogHeader className="text-start">
              <DialogTitle className="flex items-start gap-2.5 text-start">
                <span
                  aria-hidden
                  className="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl ring-1 ring-border/60"
                  style={{
                    // soft tinted icon chip — the event's own dot color at ~8%
                    backgroundColor: `${eventColor(activeEvent)}14`,
                  }}
                >
                  <EventGlyph emoji={activeEvent.emoji} />
                </span>
                <span className="min-w-0 break-words">
                  {activeEvent.names[locale]}
                </span>
              </DialogTitle>
              <DialogDescription>
                {weekdayLong(locale, cell.weekday)} · {activeDateText}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-1.5">
              {activeEvent.isHoliday && (
                <Badge
                  variant="outline"
                  className="border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                >
                  {dict.holidayBadge}
                </Badge>
              )}
              {activeEvent.recurring && (
                <Badge
                  variant="outline"
                  title={dict.recurringYearly}
                  className="border-primary/40 bg-primary/5 text-primary"
                >
                  🔁 {dict.recurringYearly}
                </Badge>
              )}
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
                style={{
                  borderColor: `${eventColor(activeEvent)}55`,
                  color: eventColor(activeEvent),
                }}
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: eventColor(activeEvent) }}
                />
                {categoryLabel(dict, activeEvent.category)}
              </span>
              <SourceBadge
                event={activeEvent}
                dict={dict}
                locale={locale}
              />
            </div>

            <div className="space-y-2 rounded-xl bg-muted/60 p-3.5 text-sm">
              <DateRow label={dict.systemGregorian}>
                {formatGregorianDate(locale, cell.gregorian, dict)}
              </DateRow>
              <DateRow label={dict.systemJalali}>
                {formatJalaliDate(locale, cell.jalali, dict)}
              </DateRow>
              <DateRow label={dict.systemImperial}>
                {formatImperialDate(locale, cell.imperial, dict)}
                {cell.imperial.month !== 13 && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {dict.dayNameLabel}:{" "}
                    {imperialDayName(locale, cell.imperial)}
                  </span>
                )}
              </DateRow>
              {showHijri && (
                <DateRow label={dict.hijriLabel}>
                  {formatHijriDate(locale, cell.hijri, dict)}
                </DateRow>
              )}
            </div>

            {activeEvent.descriptions[locale] && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {activeEvent.descriptions[locale]}
              </p>
            )}

            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              {activeEvent.source === "manual"
                ? `✍️ ${dict.sourceManual}`
                : sourceBadgeText(dict, locale)}
              {activeEvent.source === "online" && activeEvent.provider
                ? ` · ${activeEvent.provider}`
                : ""}
            </p>

            {editable && (
              <Button
                variant="outline"
                onClick={onEdit}
                className="ms-auto rounded-xl font-semibold transition-transform active:scale-95"
              >
                <Pencil className="size-4" aria-hidden />
                {dict.editEvent}
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DateRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="tabular-nums" dir="auto">
        {children}
      </span>
    </div>
  );
}
