// Celestial — daily horoscope phrase banks (round 13).
//
// CONTENT DATA ONLY — natural, short, positive-neutral, family-friendly:
// no fatalism, no predictions of harm, no fortune-telling claims; just
// gentle moods, lucky charms and small everyday suggestions.
//
// The data is locale-keyed (en/ja/fa). Picks are made as INDICES by the
// deterministic engine in ./index.ts (same day + same zodiac sign = same
// indices in every locale), then resolved to phrases here — so all three
// locales stay in sync for a given day.
//
// ANDROID PORT (Task 13-d): mirror these tables verbatim (Kotlin object
// HoroscopeData with the same array order — indices must line up 1:1).

import type { LocaleCode } from "@/lib/i18n/types";

/** one mood pick: a content emoji (no flags — renders fine on Windows) + label */
export interface MoodEntry {
  emoji: string;
  label: string;
}

/** one lucky-color pick: any content hex (not UI chrome) + localized name */
export interface ColorEntry {
  hex: string;
  label: string;
}

/** bank sizes — the picker in ./index.ts indexes with these */
export const MOOD_COUNT = 12;
export const COLOR_COUNT = 10;
export const ADVICE_COUNT = 20;

/** 12 moods — same emoji + theme in every locale, natural wording each */
export const MOODS: Record<LocaleCode, readonly MoodEntry[]> = {
  en: [
    { emoji: "⚡", label: "Energized" },
    { emoji: "😌", label: "Calm" },
    { emoji: "🌤️", label: "Optimistic" },
    { emoji: "🌙", label: "Reflective" },
    { emoji: "🎈", label: "Playful" },
    { emoji: "🎯", label: "Focused" },
    { emoji: "💗", label: "Romantic" },
    { emoji: "🔥", label: "Bold" },
    { emoji: "☁️", label: "Dreamy" },
    { emoji: "🌿", label: "Grounded" },
    { emoji: "🔭", label: "Curious" },
    { emoji: "🗣️", label: "Social" },
  ],
  ja: [
    { emoji: "⚡", label: "元気いっぱい" },
    { emoji: "😌", label: "穏やか" },
    { emoji: "🌤️", label: "前向き" },
    { emoji: "🌙", label: "内省的" },
    { emoji: "🎈", label: "遊び心" },
    { emoji: "🎯", label: "集中モード" },
    { emoji: "💗", label: "ロマンチック" },
    { emoji: "🔥", label: "大胆" },
    { emoji: "☁️", label: "夢見心地" },
    { emoji: "🌿", label: "安定感" },
    { emoji: "🔭", label: "好奇心旺盛" },
    { emoji: "🗣️", label: "社交的" },
  ],
  fa: [
    { emoji: "⚡", label: "پرانرژی" },
    { emoji: "😌", label: "آرام" },
    { emoji: "🌤️", label: "خوش‌بین" },
    { emoji: "🌙", label: "درون‌نگر" },
    { emoji: "🎈", label: "بازیگوش" },
    { emoji: "🎯", label: "متمرکز" },
    { emoji: "💗", label: "عاشقانه" },
    { emoji: "🔥", label: "جسور" },
    { emoji: "☁️", label: "رؤیایی" },
    { emoji: "🌿", label: "متعادل" },
    { emoji: "🔭", label: "کنجکاو" },
    { emoji: "🗣️", label: "اجتماعی" },
  ],
};

/** 10 lucky colors — content hexes only (never used as UI chrome) */
export const COLORS: Record<LocaleCode, readonly ColorEntry[]> = {
  en: [
    { hex: "#DC2626", label: "Red" },
    { hex: "#F97362", label: "Coral" },
    { hex: "#F59E0B", label: "Amber" },
    { hex: "#D4A017", label: "Gold" },
    { hex: "#16A34A", label: "Green" },
    { hex: "#0D9488", label: "Teal" },
    { hex: "#38BDF8", label: "Sky" },
    { hex: "#D946A9", label: "Magenta" },
    { hex: "#8B5CF6", label: "Violet" },
    { hex: "#F5F0DC", label: "Ivory" },
  ],
  ja: [
    { hex: "#DC2626", label: "赤" },
    { hex: "#F97362", label: "コーラル" },
    { hex: "#F59E0B", label: "琥珀色" },
    { hex: "#D4A017", label: "金色" },
    { hex: "#16A34A", label: "緑" },
    { hex: "#0D9488", label: "ティール" },
    { hex: "#38BDF8", label: "空色" },
    { hex: "#D946A9", label: "マゼンタ" },
    { hex: "#8B5CF6", label: "菫色" },
    { hex: "#F5F0DC", label: "象牙色" },
  ],
  fa: [
    { hex: "#DC2626", label: "قرمز" },
    { hex: "#F97362", label: "مرجانی" },
    { hex: "#F59E0B", label: "کهربایی" },
    { hex: "#D4A017", label: "طلایی" },
    { hex: "#16A34A", label: "سبز" },
    { hex: "#0D9488", label: "فیروزه‌ای" },
    { hex: "#38BDF8", label: "آبی آسمانی" },
    { hex: "#D946A9", label: "سرخابی" },
    { hex: "#8B5CF6", label: "بنفش" },
    { hex: "#F5F0DC", label: "عاجی" },
  ],
};

/** 20 one-sentence advices — small, doable, kind; varied everyday themes */
export const ADVICE: Record<LocaleCode, readonly string[]> = {
  en: [
    "Step outside for a few minutes — fresh air resets the mind.",
    "Call a friend you haven't spoken to in a while.",
    "Start the small task you've been putting off.",
    "Treat yourself to your favorite snack today.",
    "Write down one good thing in your life.",
    "Take the scenic route home.",
    "Finish the chapter you left halfway.",
    "Offer someone a genuine compliment.",
    "Tidy up one small corner of your space.",
    "Drink one extra glass of water.",
    "Listen again to a song you loved years ago.",
    "Send a thank-you message to someone who helped you.",
    "Stretch for five minutes before bed.",
    "Try cooking something simple and new.",
    "Put your phone aside for one full hour.",
    "Plan one small thing to look forward to.",
    "Learn one interesting fact today.",
    "Go to bed a little earlier tonight.",
    "Write down tomorrow's top three tasks.",
    "Smile at someone passing by — it's contagious.",
  ],
  ja: [
    "少し外に出て、新鮮な空気で頭をリセットしよう。",
    "しばらく連絡していない友達に電話してみよう。",
    "後回しにしていた小さな仕事に取りかかろう。",
    "今日は好きなおやつで自分をごほうびしよう。",
    "今の生活でいいことをひとつ書き出そう。",
    "帰り道は少し遠回りして景色を楽しもう。",
    "途中で止まっていた本の続きを読もう。",
    "誰かに心からの褒め言葉を贈ろう。",
    "机の一角だけでも片付けてみよう。",
    "水を一杯多く飲んでみよう。",
    "昔好きだった曲をもう一度聴いてみよう。",
    "助けてくれた人にお礼のメッセージを送ろう。",
    "寝る前に5分だけストレッチしよう。",
    "簡単な新しい料理に挑戦してみよう。",
    "1時間だけスマホを置いてみよう。",
    "ささやかな楽しみをひとつ計画しよう。",
    "今日は雑学をひとつ覚えよう。",
    "今夜は少し早めに寝よう。",
    "明日の大事な3つを書き出そう。",
    "すれ違う人に笑顔を向けてみよう。",
  ],
  fa: [
    "چند دقیقه بیرون برو؛ هوای تازه ذهن را طراوت می‌بخشد.",
    "به دوستی که مدتی‌هاست ندیده‌ای زنگ بزن.",
    "همان کار کوچکی که عقبش انداخته‌ای را شروع کن.",
    "امروز با خوراکی موردعلاقه‌ات به خودت لطف کن.",
    "یک چیز خوب در زندگی‌ات را یادداشت کن.",
    "مسیر برگشت را از راهی زیباتر انتخاب کن.",
    "ادامه کتاب نیمه‌کاره‌ات را بخوان.",
    "یک تعریف صادقانه به کسی هدیه بده.",
    "یک گوشه کوچک از اتاقت را مرتب کن.",
    "یک لیوان آب بیشتر بنوش.",
    "آهنگی را که سال‌ها پیش دوستش داشتی دوباره گوش کن.",
    "به کسی که کمکت کرده پیام تشکر بفرست.",
    "پیش از خواب پنج دقیقه بدنت را کش بده.",
    "یک غذای ساده و تازه امتحان کن.",
    "یک ساعت کامل گوشی را کنار بگذار.",
    "برای روزهای پیش رو یک خوشی کوچک برنامه‌ریزی کن.",
    "امروز یک نکته جالب تازه یاد بگیر.",
    "امشب کمی زودتر بخواب.",
    "سه کار مهم فردا را از همین حالا بنویس.",
    "به غریبه‌ای لبخند بزن؛ لبخند مسری است.",
  ],
};
