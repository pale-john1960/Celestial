// Celestial — Persian religious events (Hijri lunar — shift each solar year)
// isHoliday marks legal days off in Iran. Non-holiday ones are observances.
// Dates computed with the Umm al-Qura tables (ICU islamic-umalqura);
// official Iranian dates may shift ±1 day with moon sighting.
import type { EventRule } from '../types';

const hijriFixed = (
  id: string,
  month: number,
  day: number,
  isHoliday: boolean,
  emoji: string,
  names: { en: string; ja: string; fa: string },
  descriptions: { en: string; ja: string; fa: string },
): EventRule => ({
  id, category: 'persian-religious', kind: 'hijri-fixed', month, day, isHoliday, emoji, names, descriptions,
});

export const persianReligiousRules: EventRule[] = [
  hijriFixed('pr-tasua', 1, 9, true, '🕯️',
    { en: 'Tasua', ja: 'タースーア', fa: 'تاسوعای حسینی' },
    { en: 'The 9th of Muharram — the eve of Ashura, mourning Imam Hussein’s family.', ja: 'ムハッラム9日。アーシュラー前夜、フセイン一族を悼む。', fa: 'نهم محرم؛ شب پیش از عاشورا.' }),
  hijriFixed('pr-ashura', 1, 10, true, '🖤',
    { en: 'Ashura', ja: 'アーシュラー', fa: 'عاشورای حسینی' },
    { en: 'The 10th of Muharram — martyrdom of Imam Hussein at Karbala (680 CE).', ja: 'ムハッラム10日。カルバラでのフセイン殉教（680年）。', fa: 'دهم محرم؛ شهادت امام حسین در کربلا.' }),
  hijriFixed('pr-arbaeen', 2, 20, true, '🚶',
    { en: 'Arbaeen', ja: 'アルバイン', fa: 'اربعین حسینی' },
    { en: 'The 40th day after Ashura — the world’s largest annual pilgrimage to Karbala.', ja: 'アーシュラーから40日目。世界最大の年次巡礼。', fa: 'چهلم شهادت امام حسین؛ بزرگ‌ترین پیاده‌روی سال.' }),
  hijriFixed('pr-prophet-death', 2, 28, true, '🌫️',
    { en: 'Passing of the Prophet', ja: '預言者帰天の日', fa: 'رحلت پیامبر و شهادت امام حسن' },
    { en: '28 Safar — passing of Prophet Muhammad and martyrdom of Imam Hassan.', ja: 'サファル28日。ムハンマド帰天とハサン殉教。', fa: 'بیست و هشت صفر؛ رحلت پیامبر و شهادت امام حسن مجتبی.' }),
  hijriFixed('pr-fatima-martyrdom', 6, 3, true, '🌷',
    { en: 'Martyrdom of Fatima', ja: 'ファーティマ殉教の日', fa: 'شهادت حضرت فاطمه' },
    { en: '3 Jumada al-Thani — Fatimiya, mourning for the Prophet’s daughter.', ja: 'ジュマーダーII月3日。ファーティマーを悼む。', fa: 'سوم جمادی‌الثانی؛ ایام فاطمیه.' }),
  hijriFixed('pr-ali-birthday', 7, 13, false, '⚔️',
    { en: 'Birthday of Imam Ali', ja: 'イマーム・アリーの誕生', fa: 'میلاد امام علی' },
    { en: '13 Rajab — birthday of Ali ibn Abi Talib, father of Nowruz greetings at Kaaba.', ja: 'ラジャブ13日。アリーの誕生。', fa: 'سیزده رجب؛ زادروز امام علی.' }),
  hijriFixed('pr-mahdi-birthday', 8, 15, false, '⭐',
    { en: 'Mid-Sha’ban', ja: 'シャアバーン半ば', fa: 'میلاد امام زمان' },
    { en: '15 Sha’ban — birthday of the twelfth Imam, celebrated with fireworks.', ja: 'シャアバーン15日。十二イマームの誕生。', fa: 'نیمه شعبان؛ زادروز امام دوازدهم.' }),
  hijriFixed('pr-qadr', 9, 23, false, '📖',
    { en: 'Laylat al-Qadr', ja: '運命の夜', fa: 'شب قدر' },
    { en: 'The Night of Destiny — the revelation of the Quran began; better than a thousand months.', ja: 'クルアーン啓示始まる夜。千月に勝る。', fa: 'شب نزول قرآن؛ بهتر از هزار ماه.' }),
  hijriFixed('pr-ali-martyrdom', 9, 21, true, '🌑',
    { en: 'Martyrdom of Imam Ali', ja: 'イマーム・アリー殉教の日', fa: 'شهادت امام علی' },
    { en: '21 Ramadan — Ali ibn Abi Talib was struck while praying in Kufa.', ja: 'ラマダーン21日。クーファで礼拝中に襲われた。', fa: 'بیست و یکم رمضان؛ شهادت امیرالمؤمنان.' }),
  hijriFixed('pr-eid-fitr', 10, 1, true, '🎉',
    { en: 'Eid al-Fitr', ja: 'イード・アル＝フィトル', fa: 'عید سعید فطر' },
    { en: 'Breaking of the Ramadan fast — festivities for two days.', ja: 'ラマダーン斎明けの祝祭。2日間。', fa: 'پایان روزه رمضان؛ دو روز جشن و شادی.' }),
  hijriFixed('pr-eid-fitr-2', 10, 2, true, '🎉',
    { en: 'Eid al-Fitr (2nd day)', ja: 'フィトルの祝日（2日目）', fa: 'عید فطر (روز دوم)' },
    { en: 'Second day of the Eid al-Fitr holiday.', ja: 'イード・アル＝フィトル2日目。', fa: 'روز دوم تعطیلی عید فطر.' }),
  hijriFixed('pr-eid-ghadir', 12, 18, true, '🏅',
    { en: 'Eid al-Ghadir', ja: 'イード・アル＝ガディール', fa: 'عید سعید غدیر' },
    { en: '18 Dhu al-Hijja — the Prophet declared Ali his successor at Ghadir Khumm.', ja: 'ズー・アル＝ヒッジャ18日。ガディール・フムでの宣言。', fa: 'هجدهم ذی‌الحجه؛ روز غدیر خم.' }),
  hijriFixed('pr-eid-adha', 12, 10, true, '🐑',
    { en: 'Eid al-Adha', ja: 'イード・アル＝アドハー', fa: 'عید سعید قربان' },
    { en: 'The Feast of Sacrifice — commemorating Abraham’s devotion.', ja: '犠牲の祭。イブラーヒームの献身を記念。', fa: 'عید قربان؛ یادگار ایثار ابراهیم.' }),
  hijriFixed('pr-prophet-birthday', 3, 17, true, '🎂',
    { en: 'Birthday of the Prophet', ja: '預言者生誕祭', fa: 'میلاد پیامبر و امام صادق' },
    { en: '17 Rabi al-Awwal — birthday of Prophet Muhammad and Imam Ja’far al-Sadiq.', ja: 'ラビーI月17日。ムハンマドとイマーム・サーディクの誕生。', fa: 'هفدهم ربیع‌الاول؛ میلاد پیامبر اکرم و امام صادق.' }),
];
