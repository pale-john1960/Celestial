// Celestial — RFC 5545 (iCalendar) export builder (client-side, pure)
import type { EventInstance } from "@/lib/events";
import type { LocaleCode, LocaleDict } from "@/lib/i18n";
import { fromJdn, isoDate, parseIso, toJdn } from "@/lib/calendar/jdn";

const CRLF = "\r\n";

/** Escape text values per RFC 5545 §3.3.11 (backslash, semicolon, comma, newlines) */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/[\r\n]/g, "\\n");
}

/** UTF-8 byte length of one code point */
function cpBytes(cp: number): number {
  return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
}

/** UTF-8 byte length of a string (RFC 5545 counts octets, not chars) */
function byteLen(s: string): number {
  let n = 0;
  for (const ch of s) n += cpBytes(ch.codePointAt(0)!);
  return n;
}

/** Split `s` at the longest prefix whose UTF-8 length ≤ max (never splits a code point) */
function cutOctets(s: string, max: number): [string, string] {
  let take = 0;
  let len = 0;
  for (const ch of s) {
    const cl = cpBytes(ch.codePointAt(0)!);
    if (len + cl > max) break;
    len += cl;
    take += ch.length;
  }
  return [s.slice(0, take), s.slice(take)];
}

/**
 * Fold a logical line to ≤74 OCTETS with CRLF + single-space continuation
 * (RFC 5545 §3.1 — octets, not JS characters; continuation lines are " " +
 * ≤73 octets so every physical line stays ≤75 octets including the space).
 */
function foldLine(line: string): string {
  if (byteLen(line) <= 74) return line;
  const parts: string[] = [];
  let [head, rest] = cutOctets(line, 74);
  parts.push(head);
  while (rest) {
    const [cont, next] = cutOctets(rest, 73);
    if (!cont) break; // unreachable (≤4-octet chars vs 73 budget) — safety only
    parts.push(` ${cont}`);
    rest = next;
  }
  return parts.join(CRLF);
}

/** Current UTC stamp, YYYYMMDDTHHMMSSZ */
function icsStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

function builtinSourceLabel(locale: LocaleCode): string {
  if (locale === "fa") return "داخلی";
  if (locale === "ja") return "内蔵";
  return "Built-in";
}

function sourceLabel(
  e: EventInstance,
  dict: LocaleDict,
  locale: LocaleCode,
): string {
  switch (e.source) {
    case "online":
      return e.provider ? `${dict.onlineSources} · ${e.provider}` : dict.onlineSources;
    case "imported":
      return dict.imported;
    case "manual":
      return dict.sourceManual;
    default:
      return builtinSourceLabel(locale);
  }
}

/**
 * Build an .ics payload from event instances (all-day events, DTEND exclusive
 * per RFC 5545). CRLF line endings, octet-based 74/73 folding, escaped text.
 *
 * Yearly-recurring series (recurring: true): only ONE instance per series is
 * exported — the anchor when present, else the earliest instance — with
 * RRULE:FREQ=YEARLY so a re-import restores the recurrence (round-trip ✓).
 */
export function buildIcs(
  events: EventInstance[],
  locale: LocaleCode,
  dict: LocaleDict,
): string {
  const stamp = icsStamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Celestial//Calendar//EN",
    "CALSCALE:GREGORIAN",
  ];

  // pick the representative instance of each recurring series (dbId is the
  // series identity; all instances share it). Prefer the anchor instance,
  // else the earliest iso.
  const seriesExport = new Map<string, EventInstance>();
  for (const e of events) {
    if (!e.recurring) continue;
    const key = e.dbId ? `db-${e.dbId}` : `id-${e.id}`;
    const cur = seriesExport.get(key);
    if (
      !cur ||
      e.iso === e.anchorIso ||
      (cur.iso !== cur.anchorIso && e.iso < cur.iso)
    ) {
      seriesExport.set(key, e);
    }
  }

  for (const e of events) {
    if (e.recurring) {
      const key = e.dbId ? `db-${e.dbId}` : `id-${e.id}`;
      if (seriesExport.get(key) !== e) continue; // skip non-representative instances
    }
    const g = parseIso(e.iso);
    if (!g) continue;
    const dtStart = e.iso.replace(/-/g, "");
    // exclusive end = iso + 1 day
    const dtEnd = isoDate(fromJdn(toJdn(g) + 1)).replace(/-/g, "");

    const summary = escapeText(
      `${e.names[locale]}${e.isHoliday ? ` (${dict.dayOff})` : ""}`,
    );
    const label = sourceLabel(e, dict, locale);
    const description = escapeText(
      e.descriptions[locale] ? `${e.descriptions[locale]} · ${label}` : label,
    );

    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@celestial`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      ...(e.recurring ? ["RRULE:FREQ=YEARLY"] : []),
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join(CRLF)}${CRLF}`;
}
