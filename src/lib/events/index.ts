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

  const all: EventInstance[] = [];
  let usOnline = false;
  let japanOnline = false;

  // online layer for US/JP
  const onlineByYear = new Map<number, Record<'us' | 'japan', EventInstance[]>>();
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

  for (const y of years) {
    const builtin = expandBuiltinYear(y);
    for (const inst of builtin) {
      if (inst.iso < fromIso || inst.iso > toIso) continue;
      switch (inst.category) {
        case 'international':
          if (settings.international) all.push(inst);
          break;
        case 'persian-cultural':
          if (settings.persianCultural) all.push(inst);
          break;
        case 'persian-national':
          if (settings.persianNational) all.push(inst);
          break;
        case 'persian-religious':
          if (settings.persianReligious) all.push(inst);
          else if (inst.isHoliday) all.push({ ...inst, holidayOnly: true });
          break;
        case 'us': {
          const online = onlineByYear.get(y)?.us ?? [];
          const fromOnline = settings.online && online.length > 0;
          if (fromOnline) {
            if (settings.us) all.push(...online.filter((e) => e.iso >= fromIso && e.iso <= toIso));
            usOnline = usOnline || fromOnline;
          } else if (settings.us) {
            all.push(inst);
          }
          break;
        }
        case 'japan': {
          const online = onlineByYear.get(y)?.japan ?? [];
          const fromOnline = settings.online && online.length > 0;
          if (fromOnline) {
            if (settings.japan) all.push(...online.filter((e) => e.iso >= fromIso && e.iso <= toIso));
            japanOnline = japanOnline || fromOnline;
          } else if (settings.japan) {
            all.push(inst);
          }
          break;
        }
        default:
          break;
      }
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
