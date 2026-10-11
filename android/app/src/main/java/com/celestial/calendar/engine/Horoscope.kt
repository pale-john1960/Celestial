package com.celestial.calendar.engine

/**
 * Celestial — daily horoscope engine (round 13 parity with the web app).
 *
 * DETERMINISTIC BY DESIGN: horoscopeFor(iso, signKey) hashes
 * `"$iso:$signKey"` (FNV-1a 32-bit) into a mulberry32 PRNG — the same
 * algorithm as the web — and draws mood/color/advice indices plus a lucky
 * number 1..99. Same day + same zodiac sign = same result, forever: pure
 * function, no Random, no clock access, no storage.
 *
 * Locale is NOT part of the seed — the pick is locale-independent (indices
 * only), so en/ja/fa show the same mood/color/advice for a given day, and
 * switching language mid-day never reshuffles the card.
 *
 * Kotlin port of `src/lib/horoscope` (data.ts + index.ts) — the phrase
 * banks are mirrored verbatim with the same array order, so the indices
 * line up 1:1 with the web app.
 */
object HoroscopeEngine {

    /** one mood pick: a content emoji (no flags) + label */
    data class MoodEntry(val emoji: String, val label: String)

    /** one lucky-color pick: any content hex (not UI chrome) + localized name */
    data class ColorEntry(val hex: String, val label: String)

    /** locale-independent pick — stable indices into the data banks */
    data class HoroscopePick(
        val moodIndex: Int,   // 0..MOOD_COUNT-1
        val colorIndex: Int,  // 0..COLOR_COUNT-1
        val adviceIndex: Int, // 0..ADVICE_COUNT-1
        val luckyNumber: Int, // 1..99
    )

    /** the pick resolved against one locale's phrase banks */
    data class LocalizedHoroscope(
        val mood: MoodEntry,
        val color: ColorEntry,
        val advice: String,
        val luckyNumber: Int,
    )

    /** bank sizes — the picker indexes with these (mirrors the web) */
    const val MOOD_COUNT = 12
    const val COLOR_COUNT = 10
    const val ADVICE_COUNT = 20

    /** 12 moods — same emoji + theme in every locale, natural wording each */
    val MOODS: Map<AppLocale, List<MoodEntry>> = mapOf(
        AppLocale.EN to listOf(
            MoodEntry("⚡", "Energized"),
            MoodEntry("😌", "Calm"),
            MoodEntry("🌤️", "Optimistic"),
            MoodEntry("🌙", "Reflective"),
            MoodEntry("🎈", "Playful"),
            MoodEntry("🎯", "Focused"),
            MoodEntry("💗", "Romantic"),
            MoodEntry("🔥", "Bold"),
            MoodEntry("☁️", "Dreamy"),
            MoodEntry("🌿", "Grounded"),
            MoodEntry("🔭", "Curious"),
            MoodEntry("🗣️", "Social"),
        ),
        AppLocale.JA to listOf(
            MoodEntry("⚡", "元気いっぱい"),
            MoodEntry("😌", "穏やか"),
            MoodEntry("🌤️", "前向き"),
            MoodEntry("🌙", "内省的"),
            MoodEntry("🎈", "遊び心"),
            MoodEntry("🎯", "集中モード"),
            MoodEntry("💗", "ロマンチック"),
            MoodEntry("🔥", "大胆"),
            MoodEntry("☁️", "夢見心地"),
            MoodEntry("🌿", "安定感"),
            MoodEntry("🔭", "好奇心旺盛"),
            MoodEntry("🗣️", "社交的"),
        ),
        AppLocale.FA to listOf(
            MoodEntry("⚡", "پرانرژی"),
            MoodEntry("😌", "آرام"),
            MoodEntry("🌤️", "خوش‌بین"),
            MoodEntry("🌙", "درون‌نگر"),
            MoodEntry("🎈", "بازیگوش"),
            MoodEntry("🎯", "متمرکز"),
            MoodEntry("💗", "عاشقانه"),
            MoodEntry("🔥", "جسور"),
            MoodEntry("☁️", "رؤیایی"),
            MoodEntry("🌿", "متعادل"),
            MoodEntry("🔭", "کنجکاو"),
            MoodEntry("🗣️", "اجتماعی"),
        ),
    )

    /** 10 lucky colors — content hexes only (never used as UI chrome) */
    val COLORS: Map<AppLocale, List<ColorEntry>> = mapOf(
        AppLocale.EN to listOf(
            ColorEntry("#DC2626", "Red"),
            ColorEntry("#F97362", "Coral"),
            ColorEntry("#F59E0B", "Amber"),
            ColorEntry("#D4A017", "Gold"),
            ColorEntry("#16A34A", "Green"),
            ColorEntry("#0D9488", "Teal"),
            ColorEntry("#38BDF8", "Sky"),
            ColorEntry("#D946A9", "Magenta"),
            ColorEntry("#8B5CF6", "Violet"),
            ColorEntry("#F5F0DC", "Ivory"),
        ),
        AppLocale.JA to listOf(
            ColorEntry("#DC2626", "赤"),
            ColorEntry("#F97362", "コーラル"),
            ColorEntry("#F59E0B", "琥珀色"),
            ColorEntry("#D4A017", "金色"),
            ColorEntry("#16A34A", "緑"),
            ColorEntry("#0D9488", "ティール"),
            ColorEntry("#38BDF8", "空色"),
            ColorEntry("#D946A9", "マゼンタ"),
            ColorEntry("#8B5CF6", "菫色"),
            ColorEntry("#F5F0DC", "象牙色"),
        ),
        AppLocale.FA to listOf(
            ColorEntry("#DC2626", "قرمز"),
            ColorEntry("#F97362", "مرجانی"),
            ColorEntry("#F59E0B", "کهربایی"),
            ColorEntry("#D4A017", "طلایی"),
            ColorEntry("#16A34A", "سبز"),
            ColorEntry("#0D9488", "فیروزه‌ای"),
            ColorEntry("#38BDF8", "آبی آسمانی"),
            ColorEntry("#D946A9", "سرخابی"),
            ColorEntry("#8B5CF6", "بنفش"),
            ColorEntry("#F5F0DC", "عاجی"),
        ),
    )

    /** 20 one-sentence advices — small, doable, kind; varied everyday themes */
    val ADVICE: Map<AppLocale, List<String>> = mapOf(
        AppLocale.EN to listOf(
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
        ),
        AppLocale.JA to listOf(
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
        ),
        AppLocale.FA to listOf(
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
        ),
    )

    /**
     * The day's horoscope pick for a zodiac sign.
     * @param iso      Gregorian ISO date of the displayed day ("2026-10-11")
     * @param signKey  zodiac key ("aries".."pisces", web zodiac.ts order)
     */
    fun horoscopeFor(iso: String, signKey: String): HoroscopePick {
        val rand = Mulberry32(fnv1aHash("$iso:$signKey"))
        return HoroscopePick(
            moodIndex = (rand.next() * MOOD_COUNT).toInt(),
            colorIndex = (rand.next() * COLOR_COUNT).toInt(),
            adviceIndex = (rand.next() * ADVICE_COUNT).toInt(),
            luckyNumber = 1 + (rand.next() * 99).toInt(),
        )
    }

    /** Resolve a pick into localized mood/color/advice + the lucky number. */
    fun localizeHoroscope(pick: HoroscopePick, locale: AppLocale): LocalizedHoroscope =
        LocalizedHoroscope(
            mood = MOODS.getValue(locale)[pick.moodIndex],
            color = COLORS.getValue(locale)[pick.colorIndex],
            advice = ADVICE.getValue(locale)[pick.adviceIndex],
            luckyNumber = pick.luckyNumber,
        )

    /** mulberry32 — deterministic PRNG (same algorithm as the web). */
    private class Mulberry32(seed: Int) {
        private var a = seed

        fun next(): Double {
            a += 0x6d2b79f5
            var t = (a xor (a ushr 15)) * (1 or a)
            t = (t + (t xor (t ushr 7)) * (61 or t)) xor t
            // JS `>>> 0`: reinterpret the 32 bits as unsigned, then / 2^32
            return ((t xor (t ushr 14)).toLong() and 0xffffffffL) / 4294967296.0
        }
    }

    /**
     * FNV-1a 32-bit string hash → PRNG seed (bit pattern as a signed Int —
     * the PRNG consumes it with the identical wrap arithmetic as JS `| 0`).
     */
    private fun fnv1aHash(s: String): Int {
        var h = 0x811c9dc5.toInt() // FNV offset basis 2166136261 (unsigned)
        for (i in s.indices) {
            h = h xor s[i].code
            h *= 16777619 // FNV prime — Int multiply wraps (== JS Math.imul)
        }
        return h
    }
}
