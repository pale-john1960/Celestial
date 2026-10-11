// Celestial — Japanese national holidays (built-in offline fallback)
// Online mode fetches live from Nager.Date (localName is already Japanese).
import type { EventRule } from '../types';

export const jpRules: EventRule[] = [
  {
    id: 'jp-new-year', category: 'japan', kind: 'gregorian-fixed', month: 1, day: 1, isHoliday: true, emoji: '🎊',
    names: { en: "New Year's Day (元日)", ja: '元日', fa: 'سال نو (گانجیتسو)' },
    descriptions: { en: 'First day of the year — the most important Japanese holiday.', ja: '一年の最初の日。日本で最も重要な祝日。', fa: 'نخستین روز سال؛ مهم‌ترین تعطیلی ژاپن.' },
  },
  {
    id: 'jp-coming-of-age', category: 'japan', kind: 'gregorian-nth-weekday', month: 1, nth: 2, weekday: 1, day: 0, isHoliday: true, emoji: '袴',
    names: { en: 'Coming of Age Day (成人の日)', ja: '成人の日', fa: 'روز جوانان' },
    descriptions: { en: 'Congratulating those who reached adulthood (20/18).', ja: '大人になった人を祝う日。', fa: 'تبریک به جوانانِ به بلوغ رسیده.' },
  },
  {
    id: 'jp-foundation', category: 'japan', kind: 'gregorian-fixed', month: 2, day: 11, isHoliday: true, emoji: '🏯',
    names: { en: 'National Foundation Day (建国記念の日)', ja: '建国記念の日', fa: 'روز تأسیس کشور' },
    descriptions: { en: 'Commemorating the founding of Japan by Emperor Jimmu.', ja: '神武天皇の即位に基づく建国を記念。', fa: 'یادبود بنیان‌گذاری ژاپن.' },
  },
  {
    id: 'jp-emperor-birthday', category: 'japan', kind: 'gregorian-fixed', month: 2, day: 23, isHoliday: true, emoji: '👑',
    names: { en: "Emperor's Birthday (天皇誕生日)", ja: '天皇誕生日', fa: 'تولد امپراتور' },
    descriptions: { en: 'Birthday of the reigning Emperor Naruhito.', ja: '今上天皇の誕生日。', fa: 'زادروز امپراتور Naruhito.' },
  },
  {
    // 春分の日 — astronomically determined: the JST day containing the March
    // equinox (fixed Sep/Mar dates drift ±1 day; e.g. 2027 → March 21).
    id: 'jp-vernal-equinox', category: 'japan', kind: 'season-event', seasonTarget: 0, tzOffsetMin: 540,
    month: 3, day: 20, isHoliday: true, emoji: '🌼',
    names: { en: 'Vernal Equinox Day (春分の日)', ja: '春分の日', fa: 'روز اعتدال بهاری' },
    descriptions: { en: 'A day for embracing nature and living beings.', ja: '自然をいつくしみ、生き物をたたえる日。', fa: 'روز دل‌بستن به طبیعت و ستایش جانداران.' },
  },
  {
    id: 'jp-showa', category: 'japan', kind: 'gregorian-fixed', month: 4, day: 29, isHoliday: true, emoji: '🌿',
    names: { en: 'Shōwa Day (昭和の日)', ja: '昭和の日', fa: 'روز شووا' },
    descriptions: { en: 'Reflecting on the turbulent Shōwa era and renewal.', ja: '激動の昭和の時代をふりかえり、未来を考える日。', fa: 'بازاندیشی دوران پرتلاطم شووا.' },
  },
  {
    id: 'jp-constitution', category: 'japan', kind: 'gregorian-fixed', month: 5, day: 3, isHoliday: true, emoji: '📜',
    names: { en: 'Constitution Memorial Day (憲法記念日)', ja: '憲法記念日', fa: 'روز قانون اساسی' },
    descriptions: { en: 'Commemorating the 1947 Constitution of Japan.', ja: '1947年日本国憲法の施行を記念。', fa: 'یادبود قانون اساسی ۱۹۴۷ ژاپن.' },
  },
  {
    id: 'jp-greenery', category: 'japan', kind: 'gregorian-fixed', month: 5, day: 4, isHoliday: true, emoji: '🍀',
    names: { en: 'Greenery Day (みどりの日)', ja: 'みどりの日', fa: 'روز سبزه' },
    descriptions: { en: 'A day to commune with nature and gratitude.', ja: '自然に親しみ、その恩恵に感謝する日。', fa: 'روز پیوند با طبیعت و قدردانی.' },
  },
  {
    id: 'jp-children', category: 'japan', kind: 'gregorian-fixed', month: 5, day: 5, isHoliday: true, emoji: '🎏',
    names: { en: "Children's Day (こどもの日)", ja: 'こどもの日', fa: 'روز کودکان ژاپن' },
    descriptions: { en: 'Celebrating children’s happiness — koinobori carp streamers.', ja: '子どもの幸福を祈る日。鯉のぼり。', fa: 'روز شادی کودکان؛ پرچم‌های ماهی کپور.' },
  },
  {
    id: 'jp-marine', category: 'japan', kind: 'gregorian-nth-weekday', month: 7, nth: 3, weekday: 1, day: 0, isHoliday: true, emoji: '🌊',
    names: { en: 'Marine Day (海の日)', ja: '海の日', fa: 'روز دریا' },
    descriptions: { en: 'Gratitude for the ocean and maritime Japan.', ja: '海の恩恵に感謝する日。', fa: 'قدردانی از دریا.' },
  },
  {
    id: 'jp-mountain', category: 'japan', kind: 'gregorian-fixed', month: 8, day: 11, isHoliday: true, emoji: '⛰️',
    names: { en: 'Mountain Day (山の日)', ja: '山の日', fa: 'روز کوه' },
    descriptions: { en: 'A day to appreciate mountains.', ja: '山に親しむ日。', fa: 'روز سپاس از کوهستان.' },
  },
  {
    id: 'jp-respect-aged', category: 'japan', kind: 'gregorian-nth-weekday', month: 9, nth: 3, weekday: 1, day: 0, isHoliday: true, emoji: '🏮',
    names: { en: 'Respect for the Aged Day (敬老の日)', ja: '敬老の日', fa: 'روز بزرگداشت سالمندان' },
    descriptions: { en: 'Honoring elderly citizens.', ja: '長寿を祝う日。', fa: 'احترام به کهنسالان.' },
  },
  {
    // 秋分の日 — astronomically determined: the JST day containing the September
    // equinox (fixed Sep 22 was wrong for 2025/2026 — actual: Sep 23).
    id: 'jp-autumn-equinox', category: 'japan', kind: 'season-event', seasonTarget: 180, tzOffsetMin: 540,
    month: 9, day: 22, isHoliday: true, emoji: '🌕',
    names: { en: 'Autumnal Equinox Day (秋分の日)', ja: '秋分の日', fa: 'روز اعتدال پاییزی' },
    descriptions: { en: 'Honoring ancestors and the dead.', ja: '祖先をうやまう日。', fa: 'روز بزرگداشت نیاکان.' },
  },
  {
    id: 'jp-sports', category: 'japan', kind: 'gregorian-nth-weekday', month: 10, nth: 2, weekday: 1, day: 0, isHoliday: true, emoji: '🏃',
    names: { en: 'Sports Day (スポーツの日)', ja: 'スポーツの日', fa: 'روز ورزش' },
    descriptions: { en: 'Enjoying sports for mind and body.', ja: '心身の健康のためスポーツに親しむ日。', fa: 'روز پیوند با ورزش برای سلامتی.' },
  },
  {
    id: 'jp-culture', category: 'japan', kind: 'gregorian-fixed', month: 11, day: 3, isHoliday: true, emoji: '🎨',
    names: { en: 'Culture Day (文化の日)', ja: '文化の日', fa: 'روز فرهنگ' },
    descriptions: { en: 'Promoting culture, arts and academic endeavor.', ja: '文化と学術をたたえる日。', fa: 'روز ارتقای فرهنگ و هنر.' },
  },
  {
    id: 'jp-labor-thanks', category: 'japan', kind: 'gregorian-fixed', month: 11, day: 23, isHoliday: true, emoji: '🙏',
    names: { en: 'Labor Thanksgiving Day (勤労感謝の日)', ja: '勤労感謝の日', fa: 'روز قدردانی از کار' },
    descriptions: { en: 'Gratitude for labor and production.', ja: '勤労を尊び、生産を祝い感謝する日。', fa: 'قدردانی از کار و تولید.' },
  },
];
