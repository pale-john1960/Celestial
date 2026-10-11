// Celestial — event datasets, aggregation & online layer
import type { EventCategory } from '@/lib/calendar/types';
import type { EventInstance, L10n } from './types';
import { expandBuiltinYear } from './expand';

export * from './types';
export { expandBuiltinYear, expandBuiltinRange } from './expand';
export { allBuiltinRules } from './data';

export interface SourceSettings {
  international: boolean;
  us: boolean;
  japan: boolean;
  persianCultural: boolean;
  persianReligious: boolean;
  persianNational: boolean;
  imported: boolean;
  online: boolean; // fetch US/JP live from Nager.Date when true
}

export const defaultSourceSettings: SourceSettings = {
  international: true,
  us: true,
  japan: true,
  persianCultural: true,
  persianReligious: true,
  persianNational: true,
  imported: true,
  online: true,
};

/** Persian translations for Nager.Date US holiday names (online layer) */
const nagerFa: Record<string, { fa: string; ja: string }> = {
  "New Year's Day": { fa: 'روز سال نو', ja: 'ニューイヤーズデー' },
  'Martin Luther King, Jr. Day': { fa: 'روز مارتین لوتر کینگ', ja: 'MLKデー' },
  "Washington's Birthday": { fa: 'روز تولد واشنگتن', ja: 'ワシントン誕生日' },
  'Memorial Day': { fa: 'روز یادبود', ja: 'メモリアルデー' },
  'Juneteenth': { fa: 'جونتینت', ja: 'ジューンティーン' },
  'Independence Day': { fa: 'روز استقلال آمریکا', ja: '独立記念日' },
  'Labor Day': { fa: 'روز کار (آمریکا)', ja: 'レイバーデー' },
  'Columbus Day': { fa: 'روز کلمب', ja: 'コロンブスデー' },
  'Veterans Day': { fa: 'روز جانبازان', ja: 'ベテランズデー' },
  'Thanksgiving Day': { fa: 'روز شکرگزاری', ja: '感謝祭' },
  'Christmas Day': { fa: 'کریسمس', ja: 'クリスマス' },
};

// online cache: year -> { us: instances, jp: instances }
const onlineCache = new Map<string, Partial<Record<'us' | 'japan', EventInstance[]>>>();
const ONLINE_TTL = 6 * 60 * 60 * 1000; // 6h
const onlineTs = new Map<string, number>();

async function fetchNager(year: number, country: 'US' | 'JP'): Promise<NagerHoliday[]> {
  const res = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/${country}`, {
    signal: AbortSignal.timeout(6000),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`nager ${res.status}`);
  return (await res.json()) as NagerHoliday[];
}

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  types: string[];
}

function nagerToInstance(h: NagerHoliday, category: 'us' | 'japan'): EventInstance {
  const isJp = category === 'japan';
  // localName for JP is already Japanese; for US it's English
  const nameEn = h.name;
  const nameJa = isJp ? h.localName : (nagerFa[h.name]?.ja ?? h.name);
  const nameFa = isJp ? (nagerFa[h.name]?.fa ?? h.name) : (nagerFa[h.name]?.fa ?? h.name);
  const names: L10n = { en: nameEn, ja: nameJa, fa: nameFa };
  const descEn = isJp
    ? `${h.localName} — Japanese public holiday.`
    : `${h.name} — United States federal holiday.`;
  const descriptions: L10n = {
    en: descEn,
    ja: isJp ? '日本の法定祝日。' : 'アメリカの連邦祝日。',
    fa: isJp ? 'تعطیل رسمی ژاپن.' : 'تعطیل رسمی فدرال آمریکا.',
  };
  return {
    id: `online-${category}-${h.date}-${h.name}`,
    ruleId: `online-${category}`,
    category,
    iso: h.date,
    gregorian: { year: +h.date.slice(0, 4), month: +h.date.slice(5, 7), day: +h.date.slice(8, 10) },
    isHoliday: h.types?.includes('Public') ?? true,
    emoji: isJp ? '🇯🇵' : '🇺🇸',
    names,
    descriptions,
    source: 'online',
    provider: 'Nager.Date',
  };
}

/** Fetch online US/JP holidays for a year (with cache + graceful failure) */
export async function getOnlineHolidays(year: number): Promise<Record<'us' | 'japan', EventInstance[]>> {
  const key = String(year);
  const cached = onlineCache.get(key);
  const ts = onlineTs.get(key) ?? 0;
  if (cached && Date.now() - ts < ONLINE_TTL) {
    return { us: cached.us ?? [], japan: cached.japan ?? [] };
  }
  const [us, jp] = await Promise.all([
    fetchNager(year, 'US').catch(() => null),
    fetchNager(year, 'JP').catch(() => null),
  ]);
  const result: Record<'us' | 'japan', EventInstance[]> = {
    us: us ? us.map((h) => nagerToInstance(h, 'us')) : [],
    japan: jp ? jp.map((h) => nagerToInstance(h, 'japan')) : [],
  };
  onlineCache.set(key, result);
  onlineTs.set(key, Date.now());
  return result;
}

/** Whether the online layer is currently serving (for UI status) */
export function onlineStatus(): { cached: boolean } {
  return { cached: onlineCache.size > 0 };
}

/** Online US/JP holiday layers for one Gregorian year (from Nager.Date). */
export type OnlineYearLayers = Record<'us' | 'japan', EventInstance[]>;

/**
 * PURE builtin-range computation — no db access, no network fetch (the
 * nager/online cache code above is only exercised through aggregateEvents
 * on the server). Returns every builtin instance inside [fromIso, toIso]
 * that the source settings allow, plus the per-year online US/JP layers when
 * provided. Category semantics (byte-identical to the historical inline
 * switch of aggregateEvents, which now calls this internally):
 *   - international / persian-cultural / persian-national: gated by flag;
 *   - persian-religious: full instances when ON, holiday-only pass-through
 *     (`holidayOnly: true`, day-off marker without the event) when OFF;
 *   - us / japan builtins: only when the ONLINE layer has nothing for that
 *     year (`!onlineUs.length` / `!onlineJp.length`) — with no onlineByYear
 *     (the client offline-fallback path) the builtin US/JP rules apply.
 * Order: per-year builtin (iso-sorted by expandBuiltinYear) then that year's
 * online layers — callers sort the final aggregate. Also imported by the
 * client-side offline fallback in src/lib/client/api.ts (lazy dynamic
 * import), so this module must stay client-safe.
 */
export function builtinInstancesForRange(
  fromIso: string,
  toIso: string,
  settings: SourceSettings,
  onlineByYear?: ReadonlyMap<number, OnlineYearLayers>,
): EventInstance[] {
  const y1 = Number(fromIso.slice(0, 4));
  const y2 = Number(toIso.slice(0, 4));
  const out: EventInstance[] = [];
  for (let y = y1; y <= y2; y++) {
    const builtin = expandBuiltinYear(y);
    // Per-year online availability (fetched once per year, used at most once)
    const onlineUs = settings.online ? (onlineByYear?.get(y)?.us ?? []) : [];
    const onlineJp = settings.online ? (onlineByYear?.get(y)?.japan ?? []) : [];

    for (const inst of builtin) {
      if (inst.iso < fromIso || inst.iso > toIso) continue;
      switch (inst.category) {
        case 'international':
          if (settings.international) out.push(inst);
          break;
        case 'persian-cultural':
          if (settings.persianCultural) out.push(inst);
          break;
        case 'persian-national':
          if (settings.persianNational) out.push(inst);
          break;
        case 'persian-religious':
          if (settings.persianReligious) out.push(inst);
          else if (inst.isHoliday) out.push({ ...inst, holidayOnly: true });
          break;
        case 'us':
          // builtin US only used when the online layer has nothing for this year
          if (!onlineUs.length && settings.us) out.push(inst);
          break;
        case 'japan':
          if (!onlineJp.length && settings.japan) out.push(inst);
          break;
        default:
          break;
      }
    }

    // online events for this year (pushed once per year, not per instance)
    if (settings.us && onlineUs.length) {
      out.push(...onlineUs.filter((e) => e.iso >= fromIso && e.iso <= toIso));
    }
    if (settings.japan && onlineJp.length) {
      out.push(...onlineJp.filter((e) => e.iso >= fromIso && e.iso <= toIso));
    }
  }
  return out;
}

export interface AggregateResult {
  events: EventInstance[];
  /** true when US/JP came from the live online source */
  usOnline: boolean;
  japanOnline: boolean;
}

/** Aggregate events for a date range per user settings (server-side). */
export async function aggregateEvents(
  fromIso: string,
  toIso: string,
  settings: SourceSettings,
  imported: EventInstance[] = [],
): Promise<AggregateResult> {
  const y1 = Number(fromIso.slice(0, 4));
  const y2 = Number(toIso.slice(0, 4));
  const years: number[] = [];
  for (let y = y1; y <= y2; y++) years.push(y);

  // online layer for US/JP (only years where the US fetch succeeded get an
  // entry — historical quirk kept: a year with only JP data online is
  // treated as offline for BOTH layers)
  const onlineByYear = new Map<number, OnlineYearLayers>();
  if (settings.online && (settings.us || settings.japan)) {
    await Promise.all(
      years.map(async (y) => {
        try {
          const r = await getOnlineHolidays(y);
          if (r.us.length) { onlineByYear.set(y, r); }
        } catch { /* offline */ }
      }),
    );
  }

  // Builtin + online layers via the shared pure function (identical output
  // to the former inline switch — see builtinInstancesForRange).
  const all = builtinInstancesForRange(fromIso, toIso, settings, onlineByYear);

  let usOnline = false;
  let japanOnline = false;
  if (settings.online) {
    for (const y of years) {
      const layers = onlineByYear.get(y);
      if (!layers) continue;
      if (layers.us.length) usOnline = true;
      if (layers.japan.length) japanOnline = true;
    }
  }

  if (settings.imported) {
    for (const inst of imported) {
      if (inst.iso >= fromIso && inst.iso <= toIso) all.push(inst);
    }
  }

  all.sort((a, b) => a.iso.localeCompare(b.iso));
  return { events: all, usOnline, japanOnline };
}

/** Holiday-only flag application for imported events is N/A (user data). */
export function categoryOf(cat: string): EventCategory {
  return cat as EventCategory;
}
