// Celestial — trilingual date converter dialog (C key / hero toolbar button)
//
// One Gregorian {year,month,day} is the single source of truth; the Jalali and
// Imperial rows are derived from it. Editing ANY row re-baselines the
// Gregorian state (systemToGregorian) and the other two rows update instantly.
// Invalid input keeps the last-valid derived rows and surfaces
// dict.converterInvalid next to the offending row.
//
// All converter state lives in <ConverterBody/> INSIDE DialogContent — Radix
// unmounts closed dialog content, so the body (and its state) is recreated on
// every open and the rows are always pre-filled with today (no reset effect).
"use client";

import { useState } from "react";
import { ArrowLeftRight, CalendarCheck, CalendarDays } from "lucide-react";
import {
  gregorianToImperial,
  gregorianToJalali,
  IMPERIAL_EPOCH_OFFSET,
  isoDate,
  systemMonthCount,
  systemMonthName,
  systemMonthLength,
  systemToGregorian,
  todayGregorian,
} from "@/lib/calendar";
import type { CalendarSystem, SimpleDate } from "@/lib/calendar";
import { jdnWeekday, toJdn } from "@/lib/calendar/jdn";
import {
  MOON_EMOJI,
  MOON_MAJOR_EMOJI,
  moonInfo,
  moonPhaseName,
} from "@/lib/calendar/moon";
import { zodiacOf, zodiacName } from "@/lib/calendar/zodiac";
import {
  getDict,
  jalaliMonthName,
  num,
  weekdayLong,
} from "@/lib/i18n";
import type { LocaleCode } from "@/lib/i18n";
import { useSettings } from "@/store/settings";
import { useUi } from "@/store/ui";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MIN_YEAR = 1;
const MAX_YEAR = 3000;

/** systems shown as rows, in display order (round 14: + imperialSolar + ancient) */
const SYSTEMS: CalendarSystem[] = [
  "gregorian",
  "jalali",
  "imperial",
  "imperialSolar",
  "ancient",
];

/** one converter row's editable state (text so intermediate input is kept) */
interface RowState {
  year: string;
  month: number;
  day: string;
}

type Rows = Record<CalendarSystem, RowState>;

/** parse ASCII / Persian / Arabic-Indic digit runs → integer, else null */
function parseDigits(raw: string): number | null {
  const FA = "۰۱۲۳۴۵۶۷۸۹";
  const AR = "٠١٢٣٤٥٦٧٨٩";
  let s = "";
  for (const ch of raw.trim()) {
    let d = -1;
    const fi = FA.indexOf(ch);
    const ai = AR.indexOf(ch);
    if (fi >= 0) d = fi;
    else if (ai >= 0) d = ai;
    else if (ch >= "0" && ch <= "9") d = ch.charCodeAt(0) - 48;
    if (d < 0) return null;
    s += String(d);
  }
  if (!s) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

/** all five rows derived from a Gregorian date */
function rowsOf(g: SimpleDate): Rows {
  const j = gregorianToJalali(g);
  const imp = gregorianToImperial(g);
  return {
    gregorian: { year: String(g.year), month: g.month, day: String(g.day) },
    jalali: { year: String(j.year), month: j.month, day: String(j.day) },
    imperial: { year: String(imp.year), month: imp.month, day: String(imp.day) },
    // Shahanshahi year on the standard Jalali structure
    imperialSolar: {
      year: String(j.year + IMPERIAL_EPOCH_OFFSET),
      month: j.month,
      day: String(j.day),
    },
    // identical math to imperial (names differ — display concern only)
    ancient: { year: String(imp.year), month: imp.month, day: String(imp.day) },
  };
}

/** month count per system (imperial + ancient have Andarjah as month 13) */
function monthCount(system: CalendarSystem): number {
  return systemMonthCount(system);
}

function monthName(
  locale: LocaleCode,
  system: CalendarSystem,
  month: number,
  royal: boolean,
): string {
  // gregorian/jalali unchanged; imperial/imperialSolar follow the royal
  // setting; ancient always uses the ancient names; 13 = Andarjah
  return systemMonthName(system, locale, month, royal);
}

export function DateConverterDialog() {
  const locale = useSettings((s) => s.locale);
  const dict = getDict(locale);
  const open = useUi((s) => s.converterOpen);
  const setConverterOpen = useUi((s) => s.setConverterOpen);

  return (
    <Dialog open={open} onOpenChange={(v) => setConverterOpen(v)}>
      <DialogContent closeLabel={dict.close} className="max-w-md rounded-2xl">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="size-5 text-primary" aria-hidden />
            {dict.converter}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {dict.converterDesc}
          </DialogDescription>
        </DialogHeader>
        <ConverterBody />
      </DialogContent>
    </Dialog>
  );
}

function ConverterBody() {
  const locale = useSettings((s) => s.locale);
  const royal = useSettings((s) => s.royalMonthNames);
  const dict = getDict(locale);
  const gotoDay = useUi((s) => s.gotoDay);

  // Gregorian source of truth + per-row editable text (today pre-filled —
  // the body remounts on every dialog open)
  const [g, setG] = useState<SimpleDate>(() => todayGregorian());
  const [rows, setRows] = useState<Rows>(() => rowsOf(todayGregorian()));
  const [invalid, setInvalid] = useState<CalendarSystem | null>(null);

  /** commit an edit in one row: validate, re-baseline Gregorian, refresh
   *  the OTHER rows instantly (the edited row keeps the typed text) */
  const applyRow = (
    system: CalendarSystem,
    year: string,
    month: number,
    day: string,
  ) => {
    setRows((prev) => ({ ...prev, [system]: { year, month, day } }));
    const y = parseDigits(year);
    const d = parseDigits(day);
    const yearOk = y !== null && y >= MIN_YEAR && y <= MAX_YEAR;
    const dayOk =
      d !== null &&
      d >= 1 &&
      yearOk &&
      d <= systemMonthLength(system, y as number, month);
    if (!yearOk || !dayOk) {
      setInvalid(system);
      return;
    }
    const ng = systemToGregorian(system, y as number, month, d as number);
    setG(ng);
    setInvalid(null);
    setRows((prev) => ({
      ...rowsOf(ng),
      [system]: { year, month, day },
    }));
  };

  const resetToday = () => {
    const t = todayGregorian();
    setG(t);
    setRows(rowsOf(t));
    setInvalid(null);
  };

  // info strip: weekday / moon phase / zodiac sign of the selected date
  const weekday = jdnWeekday(toJdn(g));
  const mi = moonInfo(g);
  const moonEmoji = mi.major
    ? MOON_MAJOR_EMOJI[mi.major]
    : MOON_EMOJI[mi.phaseIndex];
  const moonText = moonPhaseName(dict, mi.phaseIndex);
  const zodiac = zodiacOf(gregorianToJalali(g).month);
  const zodiacSign = zodiac ? zodiacName(dict, zodiac.key) : "";

  const systemLabel = (system: CalendarSystem) =>
    system === "gregorian"
      ? dict.systemGregorian
      : system === "jalali"
        ? dict.systemJalali
        : system === "imperial"
          ? dict.systemImperial
          : system === "imperialSolar"
            ? dict.systemImperialSolar
            : dict.systemAncient;

  return (
    <>
      {/* one row per calendar system */}
      <div className="flex flex-col gap-3 py-1">
        {SYSTEMS.map((system) => {
          const row = rows[system];
          const isInvalid = invalid === system;
          return (
            <div key={system} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="w-[4.5rem] shrink-0 text-sm font-medium"
                  aria-hidden
                >
                  {systemLabel(system)}
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={num(locale, row.year)}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    applyRow(
                      system,
                      num(locale, e.target.value),
                      row.month,
                      row.day,
                    )
                  }
                  aria-label={`${systemLabel(system)} · ${dict.viewYear}`}
                  className="h-9 w-[4.25rem] rounded-lg text-center tabular-nums"
                  aria-invalid={isInvalid}
                />
                <Select
                  value={String(row.month)}
                  onValueChange={(v) =>
                    applyRow(system, row.year, Number(v), row.day)
                  }
                >
                  <SelectTrigger
                    aria-label={`${systemLabel(system)} · ${dict.viewMonth}`}
                    className="h-9 min-w-[7rem] flex-1 rounded-lg"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: monthCount(system) },
                      (_, i) => i + 1,
                    ).map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {monthName(locale, system, m, royal)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={num(locale, row.day)}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    applyRow(
                      system,
                      row.year,
                      row.month,
                      num(locale, e.target.value),
                    )
                  }
                  aria-label={`${systemLabel(system)} · ${dict.viewDay}`}
                  className="h-9 w-12 rounded-lg text-center tabular-nums"
                  aria-invalid={isInvalid}
                />
              </div>
              {isInvalid && (
                <p className="ps-[4.5rem] text-xs text-destructive">
                  {dict.converterInvalid}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* info strip: weekday + moon phase + zodiac of the selected date */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="inline-flex items-center rounded-full border border-border/70 bg-card/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {weekdayLong(locale, weekday)}
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
          title={dict.moonPhaseTitle}
        >
          <span aria-hidden>{moonEmoji}</span>
          {moonText}
        </span>
        {zodiac && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            title={dict.zodiacChipDesc
              .replace("{month}", jalaliMonthName(locale, rows.jalali.month))
              .replace("{sign}", zodiacSign)}
          >
            <span
              aria-hidden
              className="text-[13px] leading-none text-primary"
            >
              {zodiac.glyph}
            </span>
            {zodiacSign}
          </span>
        )}
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={resetToday} className="rounded-xl">
          <CalendarDays className="size-4" aria-hidden />
          {dict.converterToday}
        </Button>
        <Button
          onClick={() => {
            gotoDay(isoDate(g));
            useUi.getState().setConverterOpen(false);
          }}
          className="rounded-xl"
        >
          <CalendarCheck className="size-4" aria-hidden />
          {dict.converterGo}
        </Button>
      </DialogFooter>
    </>
  );
}
