// Celestial — offline event import parsers (JSON / TXT / CSV)
// Shared by the import API route. Auto-detects Jalali vs Gregorian dates:
//   years < 1600 → Jalali, >= 1600 → Gregorian (explicit `calendar` field wins)
import { parseIso, isoDate } from '@/lib/calendar/jdn';
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
    pushEvent(out, errors, i + 1, dateRaw, title, description ? String(description) : undefined, isHoliday, calendar);
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
    // format: date | title [| description] [| holiday?/category?]
    const parts = t.split('|').map((p) => p.trim());
    if (parts.length < 2) {
      errors.push(`Line ${lineNo}: expected "date | title [| description]"`);
      continue;
    }
    const [dateRaw, title, description, extra] = parts;
    const isHoliday = /^(holiday|تعطیل|true|1)$/i.test(extra ?? '');
    pushEvent(out, errors, lineNo, dateRaw, title, description || undefined, isHoliday);
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
  let dateIdx = 0, titleIdx = 1, descIdx = 2, holidayIdx = 3, calIdx = 4;
  if (hasHeader) {
    dateIdx = header.findIndex((h) => h === 'date' || h === 'تاریخ');
    titleIdx = header.findIndex((h) => h === 'title' || h === 'event' || h === 'name' || h === 'عنوان');
    descIdx = header.findIndex((h) => h === 'description' || h === 'desc' || h === 'توضیحات');
    holidayIdx = header.findIndex((h) => h === 'holiday' || h === 'isholiday' || h === 'تعطیل');
    calIdx = header.findIndex((h) => h === 'calendar' || h === 'تقویم');
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
    pushEvent(out, errors, lineNo, dateRaw, title, description?.trim() || undefined, isHoliday, calendar);
  });
  return { events: out, errors };
}

export function parseAuto(fileName: string, text: string): ParsedImportResult {
  const ext = (fileName.split('.').pop() ?? '').toLowerCase();
  if (ext === 'json') return parseJsonImport(text);
  if (ext === 'csv') return parseCsvImport(text);
  if (ext === 'txt') return parseTxtImport(text);
  // sniff content
  const t = text.trim();
  if (t.startsWith('[') || t.startsWith('{')) return parseJsonImport(text);
  if (t.includes(',')) return parseCsvImport(text);
  return parseTxtImport(text);
}
