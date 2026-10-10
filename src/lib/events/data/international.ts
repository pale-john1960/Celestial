// Celestial — international observances (built-in, not legal holidays unless noted)
import type { EventRule } from '../types';

export const internationalRules: EventRule[] = [
  {
    id: 'int-valentines', category: 'international', kind: 'gregorian-fixed',
    month: 2, day: 14, emoji: '💝',
    names: { en: "Valentine's Day", ja: 'バレンタインデー', fa: 'روز ولنت' },
    descriptions: {
      en: "The feast of Saint Valentine — a celebration of love and affection.",
      ja: '聖バレンタインの祝日。愛と親愛の祭日。',
      fa: 'روز عشق — جشن والنتین؛ روز عاشقان.',
    },
  },
  {
    id: 'int-womens-day', category: 'international', kind: 'gregorian-fixed',
    month: 3, day: 8, emoji: '🌸',
    names: { en: "International Women's Day", ja: '国際女性デー', fa: 'روز جهانی زن' },
    descriptions: {
      en: 'Celebrating the social, economic, cultural and political achievements of women.',
      ja: '女性の社会・経済・文化・政治的成果を祝う国際デー。',
      fa: 'جشن دستاوردهای اجتماعی، اقتصادی و سیاسی زنان.',
    },
  },
  {
    id: 'int-april-fools', category: 'international', kind: 'gregorian-fixed',
    month: 4, day: 1, emoji: '🃏',
    names: { en: "April Fools' Day", ja: 'エイプリルフール', fa: 'روز دروغ اول آوریل' },
    descriptions: {
      en: 'An annual custom of practical jokes and hoaxes.',
      ja: '悪ふざけやいたずらの年中行事。',
      fa: 'روز شوخی و مزاحمت سالانه.',
    },
  },
  {
    id: 'int-earth-day', category: 'international', kind: 'gregorian-fixed',
    month: 4, day: 22, emoji: '🌍',
    names: { en: 'Earth Day', ja: 'アースデー', fa: 'روز زمین' },
    descriptions: {
      en: 'An annual event to demonstrate support for environmental protection.',
      ja: '環境保護への支持を示す年次行事。',
      fa: 'رویداد سالانه حمایت از محیط زیست و حفاظت از زمین.',
    },
  },
  {
    id: 'int-workers-day', category: 'international', kind: 'gregorian-fixed',
    month: 5, day: 1, emoji: '🛠️',
    names: { en: 'International Workers’ Day', ja: 'メーデー', fa: 'روز جهانی کارگر' },
    descriptions: {
      en: 'Labour Day — celebrating workers and the labour movement.',
      ja: '労働者と労働運動を祝う日。',
      fa: 'روز جهانی کارگر — جشن کارگران و جنبش کارگری.',
    },
  },
  {
    id: 'int-childrens-day', category: 'international', kind: 'gregorian-fixed',
    month: 6, day: 1, emoji: '🎈',
    names: { en: 'International Children’s Day', ja: '国際こどもの日', fa: 'روز جهانی کودک' },
    descriptions: {
      en: 'A day honouring children and promoting their welfare.',
      ja: '子どもを称え、福祉を推進する日。',
      fa: 'روز بزرگداشت کودکان و ترویج حقوق آنان.',
    },
  },
  {
    id: 'int-peace-day', category: 'international', kind: 'gregorian-fixed',
    month: 9, day: 21, emoji: '🕊️',
    names: { en: 'International Day of Peace', ja: '国際平和デー', fa: 'روز جهانی صلح' },
    descriptions: {
      en: 'Devoted to strengthening the ideals of peace among all nations.',
      ja: '諸国民間の平和の理想を強化する日。',
      fa: 'روز تقویت آرمان صلح میان ملل.',
    },
  },
  {
    id: 'int-halloween', category: 'international', kind: 'gregorian-fixed',
    month: 10, day: 31, emoji: '🎃',
    names: { en: 'Halloween', ja: 'ハロウィン', fa: 'هالووین' },
    descriptions: {
      en: 'All Hallows’ Eve — a night of costumes, treats and remembrance.',
      ja: '諸聖人の前夜。仮装と菓子の夜。',
      fa: 'شب همه قدیسان — شبی با پوشش‌های خاص و شیرینی.',
    },
  },
  {
    id: 'int-nye', category: 'international', kind: 'gregorian-fixed',
    month: 12, day: 31, emoji: '🎆',
    names: { en: "New Year's Eve", ja: '大晦日', fa: 'شب سال نو میلادی' },
    descriptions: {
      en: 'The last day of the Gregorian year, celebrated with fireworks.',
      ja: 'グレゴリオ暦年の最後の日。花火で祝う。',
      fa: 'آخرین روز سال میلادی؛ جشن با آتش‌بازی.',
    },
  },
  {
    id: 'int-persian-newyear-eve', category: 'international', kind: 'gregorian-fixed',
    month: 3, day: 20, emoji: '🌱',
    names: { en: 'Spring Equinox', ja: '春分', fa: 'اعتدال بهاری' },
    descriptions: {
      en: 'The March equinox — the astronomical first moment of spring in the northern hemisphere, and the moment Nowruz begins.',
      ja: '3月の春分点。北半球の春の始まりであり、ノウルーズの始まりの瞬間。',
      fa: 'لحظه اعتدال بهاری — آغاز فصل بهار و لحظه تحویل سال نو شمسی.',
    },
  },
];
