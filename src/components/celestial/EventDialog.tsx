// Celestial — full event detail dialog
"use client";

import { buildDayCell, imperialDayName, todayGregorian } from "@/lib/calendar";
import { getDict, weekdayLong } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  categoryColor,
  categoryLabel,
  sourceBadgeText,
} from "./CategoryLegend";
import { SourceBadge } from "./DayView";
import {
  formatGregorianDate,
  formatHijriDate,
  formatImperialDate,
  formatJalaliDate,
} from "./HeroHeader";

export function EventDialog() {
  const locale = useSettings((s) => s.locale);
  const system = useSettings((s) => s.system);
  const dict = getDict(locale);
  const activeEvent = useUi((s) => s.activeEvent);
  const setEventDialog = useUi((s) => s.setEventDialog);

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

  return (
    <Dialog
      open={activeEvent !== null}
      onOpenChange={(open) => {
        if (!open) setEventDialog(null);
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl">
        {activeEvent && cell && (
          <>
            <DialogHeader className="text-start">
              <DialogTitle className="flex items-start gap-2.5 text-start">
                <span className="text-3xl leading-none" aria-hidden>
                  {activeEvent.emoji}
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
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
                style={{
                  borderColor: `${categoryColor(activeEvent.category)}55`,
                  color: categoryColor(activeEvent.category),
                }}
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: categoryColor(activeEvent.category) }}
                />
                {categoryLabel(dict, activeEvent.category)}
              </span>
              <SourceBadge
                event={activeEvent}
                dict={dict}
                locale={locale}
              />
            </div>

            <div className="space-y-1.5 rounded-xl bg-muted/60 p-3 text-sm">
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
              <DateRow label={dict.hijriLabel}>
                {formatHijriDate(locale, cell.hijri, dict)}
              </DateRow>
            </div>

            {activeEvent.descriptions[locale] && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {activeEvent.descriptions[locale]}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              {activeEvent.source === "manual"
                ? `✍️ ${dict.sourceManual}`
                : sourceBadgeText(dict, locale)}
              {activeEvent.source === "online" && activeEvent.provider
                ? ` · ${activeEvent.provider}`
                : ""}
              {activeEvent.source === "imported" && activeEvent.dbId
                ? ""
                : ""}
            </p>
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
