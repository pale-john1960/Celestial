// Celestial — Persian cultural events (Zoroastrian / Iranian heritage)
// None of these are legal holidays by themselves — they are cultural observances.
import type { EventRule } from '../types';

export const persianCulturalRules: EventRule[] = [
  {
    id: 'pc-charshanbe-suri', category: 'persian-cultural', kind: 'jalali-last-weekday',
    month: 12, weekday: 2, day: 0, // last Tuesday of Esfand (fire festival on its eve)
    emoji: '🔥',
    names: { en: 'Charshanbe Suri', ja: 'チャルシャンベ・スリー', fa: 'چهارشنبه‌سوری' },
    descriptions: {
      en: 'Fire-jumping festival on the eve of the last Wednesday of the year — “let your redness be mine, take my paleness.”',
      ja: '年末最終火曜日の前夜、火を飛び越える祭り。「あなたの赤を私に、私の蒼白をあなたに。」',
      fa: 'جشن آتش در آخرین سه‌شنبه سال — «زردي من از تو، سرخي تو از من».',
    },
  },
  {
    id: 'pc-yalda', category: 'persian-cultural', kind: 'jalali-fixed',
    month: 9, day: 30, // Azar 30 — last night of autumn
    emoji: '🍉',
    names: { en: 'Yalda Night', ja: 'ヤルダーの夜', fa: 'شب یلدا' },
    descriptions: {
      en: 'The longest night of the year — family gathers, pomegranate, watermelon, poetry of Hafez.',
      ja: '一年で最も長い夜。家族が集い、ザクロとスイカを味わい、ハーフェズの詩を朗読。',
      fa: 'بلندترین شب سال؛ دورهمی خانواده، انار و هندوانه و دیوان حافظ.',
    },
  },
  {
    id: 'pc-mehregan', category: 'persian-cultural', kind: 'jalali-fixed',
    month: 7, day: 29, emoji: '🍂',
    names: { en: 'Mehregan', ja: 'メフレガーン', fa: 'جشن مهرگان' },
    descriptions: {
      en: 'Ancient festival of Mithra — friendship, love and the harvest, at the start of autumn.',
      ja: 'ミスラの古代祭。友情と愛と収穫の秋の祭り。',
      fa: 'جشن باستانی میترا؛ عشق و دوستی و برداشت، در آغاز پاییز.',
    },
  },
  {
    id: 'pc-tiregan', category: 'persian-cultural', kind: 'jalali-fixed',
    month: 4, day: 1, emoji: '⛅',
    names: { en: 'Tiregan', ja: 'ティールガーン', fa: 'جشن تیرگان' },
    descriptions: {
      en: 'Summer festival of Tishtrya, the rain-bringing star — splashing water for good fortune.',
      ja: '雨をもたらす星ティシュトリヤの夏祭り。水を掛け合う。',
      fa: 'جشن تیر و ستاره باران‌خیز تیشتر؛ آب‌پاشی برای بخت.',
    },
  },
  {
    id: 'pc-abangan', category: 'persian-cultural', kind: 'jalali-fixed',
    month: 8, day: 10, emoji: '💧',
    names: { en: 'Abangan', ja: 'アーバーンガーン', fa: 'جشن آبانگان' },
    descriptions: {
      en: 'Day of Waters — honouring Anahita, the goddess of waters, at the heart of autumn.',
      ja: '水の日。水の女神アナーヒターを称える。',
      fa: 'روز آب؛ بزرگداشت آناهیتا، ایزدبانوی آب‌ها.',
    },
  },
  {
    id: 'pc-sadeh', category: 'persian-cultural', kind: 'jalali-fixed',
    month: 11, day: 10, emoji: '🔥',
    names: { en: 'Sadeh', ja: 'サーデ', fa: 'جشن سده' },
    descriptions: {
      en: 'The mid-winter fire festival — “hundred days and nights” past the year’s end.',
      ja: '真冬の火祭り。年の終わりから百日目。',
      fa: 'جشن آتش در نیمه زمستان؛ صد روز و صد شب پس از پایان سال.',
    },
  },
  {
    id: 'pc-cyrus-day', category: 'persian-cultural', kind: 'jalali-fixed',
    month: 8, day: 7, emoji: '🏛️',
    names: { en: 'Cyrus the Great Day', ja: 'キュロス大王の日', fa: 'روز کوروش بزرگ' },
    descriptions: {
      en: 'Commemorating Cyrus the Great — his taking of Babylon on this day in 539 BCE, and the Cylinder of Human Rights.',
      ja: 'キュロス大王を記念する日。紀元前539年バビロン入城と人権円筒宣言。',
      fa: 'روز یادبود کوروش بزرگ؛ ورود به بابل و منشور حقوق بشر.',
    },
  },
  {
    id: 'pc-sepandarmazgan', category: 'persian-cultural', kind: 'jalali-fixed',
    month: 11, day: 29, // Bahman 29 — popular observance (Feb 18)
    emoji: '🌹',
    names: { en: 'Sepandarmazgan', ja: 'セパンダルマズガーン', fa: 'جشن سپندارمذگان' },
    descriptions: {
      en: 'The Persian day of love and devotion (Spandarmad — devotion), honoring women and the earth.',
      ja: 'ペルシアの愛と献身の日。女性と大地を敬う。',
      fa: 'روز عشق و ایثار ایرانی؛ تکریم زن و زمین.',
    },
  },
];
