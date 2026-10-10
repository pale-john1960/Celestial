// Celestial — US federal holidays (built-in offline fallback)
// When online sources are enabled these are fetched live from Nager.Date instead.
import type { EventRule } from '../types';

export const usRules: EventRule[] = [
  {
    id: 'us-new-year', category: 'us', kind: 'gregorian-fixed', month: 1, day: 1, isHoliday: true, emoji: '🎊',
    names: { en: "New Year's Day", ja: 'ニューイヤーズデー', fa: 'روز سال نو' },
    descriptions: { en: 'First day of the Gregorian year.', ja: 'グレゴリオ暦年の最初の日。', fa: 'نخستین روز سال میلادی.' },
  },
  {
    id: 'us-mlk', category: 'us', kind: 'gregorian-nth-weekday', month: 1, nth: 3, weekday: 1, day: 0, isHoliday: true, emoji: '✊',
    names: { en: 'Martin Luther King Jr. Day', ja: 'MLKデー', fa: 'روز مارتین لوتر کینگ' },
    descriptions: { en: 'Honoring the civil rights leader.', ja: '公民権運動指導者を称える日。', fa: 'روز بزرگداشت رهبر جنبش حقوق مدنی.' },
  },
  {
    id: 'us-presidents', category: 'us', kind: 'gregorian-nth-weekday', month: 2, nth: 3, weekday: 1, day: 0, isHoliday: true, emoji: '🏛️',
    names: { en: "Presidents' Day", ja: 'プレジデンツデー', fa: 'روز رؤسای جمهور' },
    descriptions: { en: 'Honoring US presidents.', ja: 'アメリカ大統領を称える日。', fa: 'روز بزرگداشت رؤسای جمهور آمریکا.' },
  },
  {
    id: 'us-memorial', category: 'us', kind: 'gregorian-last-weekday', month: 5, weekday: 1, day: 0, isHoliday: true, emoji: '🎖️',
    names: { en: 'Memorial Day', ja: 'メモリアルデー', fa: 'روز یادبود' },
    descriptions: { en: 'Remembering fallen service members.', ja: '戦没者を追悼する日。', fa: 'روز یادبود جان‌باختگان.' },
  },
  {
    id: 'us-juneteenth', category: 'us', kind: 'gregorian-fixed', month: 6, day: 19, isHoliday: true, emoji: '🔗',
    names: { en: 'Juneteenth', ja: 'ジューンティーン', fa: 'جونتینت' },
    descriptions: { en: 'Emancipation Day — end of slavery in the US.', ja: '奴隷制終結を記念する日。', fa: 'روز پایان برده‌داری در آمریکا.' },
  },
  {
    id: 'us-independence', category: 'us', kind: 'gregorian-fixed', month: 7, day: 4, isHoliday: true, emoji: '🇺🇸',
    names: { en: 'Independence Day', ja: '独立記念日', fa: 'روز استقلال آمریکا' },
    descriptions: { en: 'Adoption of the Declaration of Independence in 1776.', ja: '1776年独立宣言採択を記念。', fa: 'صدور اعلامیه استقلال در ۱۷۷۶.' },
  },
  {
    id: 'us-labor', category: 'us', kind: 'gregorian-nth-weekday', month: 9, nth: 1, weekday: 1, day: 0, isHoliday: true, emoji: '🔧',
    names: { en: 'Labor Day', ja: 'レイバーデー', fa: 'روز کار (آمریکا)' },
    descriptions: { en: 'Celebrating American workers.', ja: 'アメリカの労働者を祝う日。', fa: 'روز کارگران آمریکا.' },
  },
  {
    id: 'us-columbus', category: 'us', kind: 'gregorian-nth-weekday', month: 10, nth: 2, weekday: 1, day: 0, isHoliday: true, emoji: '⛵',
    names: { en: 'Columbus Day', ja: 'コロンブスデー', fa: 'روز کلمب' },
    descriptions: { en: 'Commemorating the arrival of Columbus in the Americas.', ja: 'コロンブスの新大陸到達を記念。', fa: 'یادبود رسیدن کلمب به قاره آمریکا.' },
  },
  {
    id: 'us-veterans', category: 'us', kind: 'gregorian-fixed', month: 11, day: 11, isHoliday: true, emoji: '🎗️',
    names: { en: 'Veterans Day', ja: 'ベテランズデー', fa: ' روز جانبازان' },
    descriptions: { en: 'Honoring military veterans.', ja: '退役軍人を称える日。', fa: 'روز بزرگداشت کهربایان.' },
  },
  {
    id: 'us-thanksgiving', category: 'us', kind: 'gregorian-nth-weekday', month: 11, nth: 4, weekday: 4, day: 0, isHoliday: true, emoji: '🦃',
    names: { en: 'Thanksgiving Day', ja: '感謝祭', fa: 'روز شکرگزاری' },
    descriptions: { en: 'Fourth Thursday of November — harvest thanksgiving.', ja: '11月第4木曜日。収穫の感謝祭。', fa: 'پنجشنبه چهارم نوامبر — جشن برداشت.' },
  },
  {
    id: 'us-christmas', category: 'us', kind: 'gregorian-fixed', month: 12, day: 25, isHoliday: true, emoji: '🎄',
    names: { en: 'Christmas Day', ja: 'クリスマス', fa: 'کریسمس' },
    descriptions: { en: 'Celebrating the birth of Christ.', ja: 'キリストの降誕を祝う日。', fa: 'جشن تولد مسیح.' },
  },
];
