// Celestial — offline event import parsers (JSON / TXT / CSV / ICS)
// Shared by the import API route. Auto-detects Jalali vs Gregorian dates:
//   years < 1600 → Jalali, >= 1600 → Gregorian (explicit `calendar` field wins)
import { parseIso, isoDate, fromJdn, toJdn } from '@/lib/calendar/jdn';
import { jalaliToGregorian } from '@/lib/calendar/jalali';
import type { SimpleDate } from '@/lib/calendar/types';
import type { ImportedEventInput } from '@/lib/events/types';

export interface ParsedImportResult {
  events: ImportedEventInput[];
  errors: string[];
}

function resolveDate(raw: string, calendar?: string): SimpleDate | null {
  const s = raw.trim().replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  // accept yyyy-m-d or yyyy/m/d
  const m = /^(\d{3,5})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (!m) return null;
  let y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  let cal = calendar?.toLowerCase();
  if (!cal) cal = y < 1600 ? 'jalali' : 'gregorian';
  if (cal === 'jalali' || cal === 'shamsi' || cal === 'persian') {
    if (y > 1600) y = y - 621; // tolerate gregorian-looking jalali input with explicit calendar
    return jalaliToGregorian({ year: y, month: mo, day: d });
  }
  return { year: y, month: mo, day: d };
}

function pushEvent(
  out: ImportedEventInput[],
  errors: string[],
  line: number,
  dateRaw: string,
  title: string,
  description?: string,
  isHoliday?: boolean,
  calendar?: string,
  recurYearly?: boolean,
  color?: string,
) {
  const g = resolveDate(dateRaw, calendar);
  if (!g) {
    errors.push(`Line ${line}: invalid date "${dateRaw}"`);
    return;
  }
  if (!title?.trim()) {
    errors.push(`Line ${line}: missing title`);
    return;
  }
  out.push({
    iso: isoDate(g),
    title: title.trim(),
    description: description?.trim() || undefined,
    isHoliday: !!isHoliday,
    recurYearly: !!recurYearly,
    color,
  });
}

export function parseJsonImport(text: string): ParsedImportResult {
  const out: ImportedEventInput[] = [];
  const errors: string[] = [];
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { events: [], errors: [`Invalid JSON: ${(e as Error).message}`] };
  }
  const arr = Array.isArray(data) ? data : Array.isArray((data as { events?: unknown[] })?.events) ? (data as { events: unknown[] }).events : null;
  if (!arr) return { events: [], errors: ['JSON must be an array of events (or { "events": [...] })'] };
  arr.forEach((item, i) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item ${i + 1}: not an object`);
      return;
    }
    const o = item as Record<string, unknown>;
    const dateRaw = String(o.date ?? o.تاریخ ?? '');
    const title = String(o.title ?? o.name ?? o.عنوان ?? '');
    const description = o.description ?? o.desc ?? o.توضیحات;
    const isHoliday = !!(o.isHoliday ?? o.holiday ?? o['day off']);
    const calendar = o.calendar ? String(o.calendar) : undefined;
    // optional "recurYearly": true / "yearly": true — annual recurrence
    const recurYearly = !!(o.recurYearly ?? o.yearly);
    // optional "color": "#rrggbb" — per-event dot color (any hex case, stored lowercase)
    let color: string | undefined;
    if (o.color !== undefined && o.color !== null) {
      const c = String(o.color).trim().toLowerCase();
      if (/^#[0-9a-f]{6}$/.test(c)) color = c;
      else errors.push(`Item ${i + 1}: invalid color "${String(o.color)}" (expected #rrggbb)`);
    }
    pushEvent(out, errors, i + 1, dateRaw, title, description ? String(description) : undefined, isHoliday, calendar, recurYearly, color);
  });
  return { events: out, errors };
}

export function parseTxtImport(text: string): ParsedImportResult {
  const out: ImportedEventInput[] = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/);
  let lineNo = 0;
  for (const line of lines) {
    lineNo++;
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('//')) continue;
    // format: date | title [| description] [| holiday?/category?] [| yearly?]
    const parts = t.split('|').map((p) => p.trim());
    if (parts.length < 2) {
      errors.push(`Line ${lineNo}: expected "date | title [| description]"`);
      continue;
    }
    const [dateRaw, title, description, extra, yearlyRaw] = parts;
    const isHoliday = /^(holiday|تعطیل|true|1)$/i.test(extra ?? '');
    // optional trailing column "yearly" (values: yearly/true/1) — backward compat
    const recurYearly = /^(yearly|true|1)$/i.test(yearlyRaw ?? '');
    pushEvent(out, errors, lineNo, dateRaw, title, description || undefined, isHoliday, undefined, recurYearly);
  }
  return { events: out, errors };
}

export function parseCsvImport(text: string): ParsedImportResult {
  const out: ImportedEventInput[] = [];
  const errors: string[] = [];
  // proper CSV parsing with quotes
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { cur.push(field); field = ''; }
    else if (ch === '\n') { cur.push(field); field = ''; rows.push(cur); cur = []; }
    else if (ch === '\r') { /* skip */ }
    else field += ch;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }

  if (!rows.length) return { events: [], errors: ['Empty CSV'] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader = header.includes('date') || header.includes('تاریخ');
  let dateIdx = 0, titleIdx = 1, descIdx = 2, holidayIdx = 3, calIdx = 4, yearlyIdx = 5;
  if (hasHeader) {
    dateIdx = header.findIndex((h) => h === 'date' || h === 'تاریخ');
    titleIdx = header.findIndex((h) => h === 'title' || h === 'event' || h === 'name' || h === 'عنوان');
    descIdx = header.findIndex((h) => h === 'description' || h === 'desc' || h === 'توضیحات');
    holidayIdx = header.findIndex((h) => h === 'holiday' || h === 'isholiday' || h === 'تعطیل');
    calIdx = header.findIndex((h) => h === 'calendar' || h === 'تقویم');
    yearlyIdx = header.findIndex((h) => h === 'yearly' || h === 'recuryearly');
  }
  const dataRows = hasHeader ? rows.slice(1) : rows;
  dataRows.forEach((row, idx) => {
    if (!row.length || row.every((c) => !c.trim())) return;
    const lineNo = idx + (hasHeader ? 2 : 1);
    const dateRaw = row[dateIdx] ?? '';
    const title = row[titleIdx] ?? '';
    const description = descIdx >= 0 ? row[descIdx] : undefined;
    const isHoliday = holidayIdx >= 0 && /^(holiday|تعطیل|true|1|yes)$/i.test((row[holidayIdx] ?? '').trim());
    const calendar = calIdx >= 0 ? row[calIdx]?.trim() || undefined : undefined;
    // optional "yearly" column (values: yearly/true/1) — backward compat
    const recurYearly =
      yearlyIdx >= 0 && /^(yearly|true|1|yes)$/i.test((row[yearlyIdx] ?? '').trim());
    pushEvent(out, errors, lineNo, dateRaw, title, description?.trim() || undefined, isHoliday, calendar, recurYearly);
  });
  return { events: out, errors };
}

export function parseAuto(fileName: string, text: string): ParsedImportResult {
  const ext = (fileName.split('.').pop() ?? '').toLowerCase();
  if (ext === 'json') return parseJsonImport(text);
  if (ext === 'csv') return parseCsvImport(text);
  if (ext === 'txt') return parseTxtImport(text);
  if (ext === 'ics' || ext === 'ical' || ext === 'ifb') return parseIcs(text);
  // sniff content
  const t = text.trim();
  if (t.startsWith('[') || t.startsWith('{')) return parseJsonImport(text);
  if (/^BEGIN:VCALENDAR/i.test(t)) return parseIcs(text);
  if (t.includes(',')) return parseCsvImport(text);
  return parseTxtImport(text);
}

/* ---------------- iCalendar (.ics) — RFC 5545 subset ---------------- */

/** RFC 5545 §3.3.11 text unescape — single pass, unknown escapes drop the backslash */
function unescapeIcsText(s: string): string {
  return s.replace(/\\(.)/g, (_m, ch: string) => {
    if (ch === 'n' || ch === 'N') return '\n';
    if (ch === ',' || ch === ';' || ch === '\\') return ch;
    return ch;
  });
}

/** Parse a DATE or DATE-TIME value to a Gregorian date (time-of-day ignored,
 *  timezone approximated as a plain date — acceptable for an all-day calendar). */
function icsDate(raw: string): SimpleDate | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(raw.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  if (y < 1000 || y > 3000) return null;
  return { year: y, month: mo, day: d };
}

/**
 * RFC 5545 §3.3.6 DURATION (ISO 8601 subset): P{n}W / P{n}D / P{n}DT{hms} /
 * PT{hms} — no sign, no months/years. Returns the span in WHOLE days:
 * weeks ×7 + days, and any time component > 0 rounds up one extra day
 * (P1DT12H → 2, PT12H → 1, P3D → 3, P2W → 14). Returns null when invalid.
 */
function icsDurationDays(raw: string): number | null {
  const s = raw.trim().toUpperCase();
  const m = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(s);
  if (!m) return null;
  const [weeks, days, hours, mins, secs] = [m[1], m[2], m[3], m[4], m[5]].map(
    (v) => (v === undefined ? 0 : Number(v)),
  );
  // at least one component must be present (bare "P" / "PT" are invalid)
  if (m[1] === undefined && m[2] === undefined && m[3] === undefined && m[4] === undefined && m[5] === undefined) {
    return null;
  }
  const whole = weeks * 7 + days;
  const hasTime = hours + mins + secs > 0;
  return whole + (hasTime ? 1 : 0);
}

interface IcsProp {
  name: string;
  params: string[]; // raw "KEY=VALUE" tokens
  value: string;
}

/**
 * Parse an iCalendar file into events.
 * - unfolds continuations first (CRLF/LF + one leading WSP)
 * - walks the component stack; only properties of the INNERMOST VEVENT are
 *   read (VTIMEZONE/VTODO/VJOURNAL/VALARM content is skipped)
 * - DTSTART/DTEND: VALUE=DATE or DATE-TIME — date part only (time ignored)
 * - DTEND ≥ DTSTART+1d → one event per day (cap 30/VEVENT); DURATION
 *   (RFC 5545 §3.3.6 ISO 8601 subset: P{n}W / P{n}D / P{n}DT{hms} / PT{hms})
 *   is used when DTEND is absent — DTEND wins when both are present (RFC 5545);
 *   any time component > 0 rounds the span up to the next whole day
 *   (e.g. P1DT12H → 2 days, PT12H → 1 day), weeks ×7
 * - RRULE:FREQ=YEARLY → recurYearly (+ BYMONTH/BYMONTHDAY anchor override);
 *   DAILY/WEEKLY/MONTHLY → single event + error entry
 * - SUMMARY/DESCRIPTION unescaped (\n \, \; \\)
 * - our own exports (UID …@celestial) parse like any VEVENT
 */
export function parseIcs(text: string): ParsedImportResult {
  const events: ImportedEventInput[] = [];
  const errors: string[] = [];

  // 1. normalize newlines + unfold (RFC 5545 §3.1)
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const logical: string[] = [];
  for (const line of normalized.split('\n')) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && logical.length > 0) {
      // continuation: remove CRLF/LF + exactly one leading WSP
      logical[logical.length - 1] += line.slice(1);
    } else if (line.trim() !== '') {
      logical.push(line);
    }
  }

  // 2. walk components, collect VEVENT properties
  const stack: string[] = [];
  const vevents: IcsProp[][] = [];
  let current: IcsProp[] | null = null;
  for (const line of logical) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const left = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const [rawName, ...params] = left.split(';');
    const name = rawName.trim().toUpperCase();

    if (name === 'BEGIN') {
      const comp = value.trim().toUpperCase();
      stack.push(comp);
      if (comp === 'VEVENT') current = [];
      continue;
    }
    if (name === 'END') {
      const comp = value.trim().toUpperCase();
      const idx = stack.lastIndexOf(comp);
      if (idx !== -1) stack.length = idx;
      if (comp === 'VEVENT' && current) {
        vevents.push(current);
        current = null;
      }
      continue;
    }
    // only read properties while the innermost component is a VEVENT
    // (skips VTIMEZONE DTSTARTs and VALARM props)
    if (current && stack[stack.length - 1] === 'VEVENT') {
      current.push({ name, params, value });
    }
  }

  if (vevents.length === 0) {
    return { events: [], errors: ['no VEVENT blocks found in the iCalendar file'] };
  }

  // 3. map VEVENTs → events
  vevents.forEach((props, i) => {
    const label = `VEVENT ${i + 1}`;
    const get = (n: string) => props.find((p) => p.name === n);

    const dtstartProp = get('DTSTART');
    const start = dtstartProp ? icsDate(dtstartProp.value) : null;
    if (!start) {
      errors.push(`${label}: missing or invalid DTSTART — skipped`);
      return;
    }

    const summaryProp = get('SUMMARY');
    const title = summaryProp ? unescapeIcsText(summaryProp.value).trim() : '';
    if (!title) {
      errors.push(`${label}: missing SUMMARY — skipped`);
      return;
    }

    const descProp = get('DESCRIPTION');
    const description = descProp
      ? unescapeIcsText(descProp.value).trim()
      : undefined;

    // anchor date: RRULE BYMONTH/BYMONTHDAY wins for YEARLY recurrences
    let anchor: SimpleDate = start;
    let recurYearly = false;
    const rruleProp = get('RRULE');
    if (rruleProp) {
      const parts = rruleProp.value
        .split(';')
        .map((kv) => kv.split('='))
        .filter((kv) => kv.length === 2);
      const freq = (parts.find((kv) => kv[0].toUpperCase() === 'FREQ')?.[1] ?? '').toUpperCase();
      if (freq === 'YEARLY') {
        recurYearly = true;
        const bm = Number(parts.find((kv) => kv[0].toUpperCase() === 'BYMONTH')?.[1]);
        const bmd = Number(parts.find((kv) => kv[0].toUpperCase() === 'BYMONTHDAY')?.[1]);
        if (bm >= 1 && bm <= 12 && bmd >= 1 && bmd <= 31) {
          anchor = { year: start.year, month: bm, day: bmd };
        }
      } else if (freq) {
        errors.push(
          `RRULE ${freq} not supported — imported as single event`,
        );
      }
    }

    // duration: DTEND date part − start date (VALUE=DATE is exclusive).
    // DURATION is consulted only when DTEND is absent (RFC 5545: DTEND wins);
    // end-day semantics are identical: start + days, exclusive.
    let days = 1;
    const dtendProp = get('DTEND');
    const end = dtendProp ? icsDate(dtendProp.value) : null;
    if (end) {
      const dur = toJdn(end) - toJdn(anchor);
      if (dur > days) days = dur;
    } else {
      const durProp = get('DURATION');
      if (durProp) {
        const dur = icsDurationDays(durProp.value);
        if (dur === null) {
          errors.push(
            `${label}: invalid DURATION "${durProp.value}" — imported as single event`,
          );
        } else if (dur > days) {
          days = dur;
        }
      }
    }
    if (days > 30) {
      days = 30;
      errors.push(`${label}: multi-day event truncated to 30 days`);
    }

    for (let k = 0; k < days; k++) {
      events.push({
        iso: isoDate(fromJdn(toJdn(anchor) + k)),
        title,
        description: description || undefined,
        recurYearly,
      });
    }
  });

  return { events, errors };
}
