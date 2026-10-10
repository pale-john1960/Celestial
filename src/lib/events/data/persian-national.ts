// Celestial — Iranian national holidays (solar / Jalali fixed)
// Legal days off in Iran. Nowruz days 1-4, Nature Day, Republic Day, Revolution Day.
import type { EventRule } from '../types';

export const persianNationalRules: EventRule[] = [
  {
    id: 'pn-nowruz1', category: 'persian-national', kind: 'jalali-fixed', month: 1, day: 1, isHoliday: true, emoji: '🌱',
    names: { en: 'Nowruz', ja: 'ノウルーズ', fa: 'نوروز' },
    descriptions: {
      en: 'Persian New Year — the spring equinox. Haft-sin table, new clothes, family visits.',
      ja: 'ペルシア新年。春分の日。ハフト・スィーンの卓、新衣、親族訪問。',
      fa: 'سال نو ایرانی؛ سفره هفت‌سین، لباس نو و دید و بازدید.',
    },
  },
  {
    id: 'pn-nowruz2', category: 'persian-national', kind: 'jalali-fixed', month: 1, day: 2, isHoliday: true, emoji: '🌱',
    names: { en: 'Nowruz holidays', ja: 'ノウルーズ休暇（2日目）', fa: 'تعطیلات نوروز (روز دوم)' },
    descriptions: { en: 'Second day of the New Year holidays.', ja: '新年休暇2日目。', fa: 'روز دوم تعطیلات سال نو.' },
  },
  {
    id: 'pn-nowruz3', category: 'persian-national', kind: 'jalali-fixed', month: 1, day: 3, isHoliday: true, emoji: '🌱',
    names: { en: 'Nowruz holidays', ja: 'ノウルーズ休暇（3日目）', fa: 'تعطیلات نوروز (روز سوم)' },
    descriptions: { en: 'Third day of the New Year holidays.', ja: '新年休暇3日目。', fa: 'روز سوم تعطیلات سال نو.' },
  },
  {
    id: 'pn-nowruz4', category: 'persian-national', kind: 'jalali-fixed', month: 1, day: 4, isHoliday: true, emoji: '🌱',
    names: { en: 'Nowruz holidays', ja: 'ノウルーズ休暇（4日目）', fa: 'تعطیلات نوروز (روز چهارم)' },
    descriptions: { en: 'Fourth and final day of the New Year holidays.', ja: '新年休暇4日目（最終日）。', fa: 'روز چهارم تعطیلات سال نو.' },
  },
  {
    id: 'pn-republic-day', category: 'persian-national', kind: 'jalali-fixed', month: 1, day: 12, isHoliday: true, emoji: '🗳️',
    names: { en: 'Islamic Republic Day', ja: 'イスラム共和国記念日', fa: 'روز جمهوری اسلامی' },
    descriptions: {
      en: 'Anniversary of the 1979 referendum (12 Farvardin).',
      ja: '1979年国民投票の記念日（ファルヴァルディーン12日）。',
      fa: 'سالگرد همه‌پرسی ۱۲ فروردین ۱۳۵۸.',
    },
  },
  {
    id: 'pn-nature-day', category: 'persian-national', kind: 'jalali-fixed', month: 1, day: 13, isHoliday: true, emoji: '🌿',
    names: { en: 'Nature Day (Sizdah Bedar)', ja: '自然の日（シズダ・ベダル）', fa: 'روز طبیعت (سیزده‌بدر)' },
    descriptions: {
      en: 'The 13th of Farvardin — everyone goes outdoors to picnic; the “ unlucky 13” is spent with nature.',
      ja: 'ファルヴァルディーン13日。全家で郊外へ。自然と共に過ごす日。',
      fa: 'سیزدهم فروردین؛ روزی برای رفتن به دامان طبیعت.',
    },
  },
  {
    id: 'pn-revolution-day', category: 'persian-national', kind: 'jalali-fixed', month: 11, day: 22, isHoliday: true, emoji: '✊',
    names: { en: 'Islamic Revolution Day', ja: 'イスラム革命記念日', fa: 'پیروزی انقلاب اسلامی' },
    descriptions: {
      en: 'Anniversary of the 1979 Revolution (22 Bahman).',
      ja: '1979年イスラム革命勝利の記念日（バフマン22日）。',
      fa: 'سالگرد پیروزی انقلاب در ۲۲ بهمن ۱۳۵۷.',
    },
  },
];
