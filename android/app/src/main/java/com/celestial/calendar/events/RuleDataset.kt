package com.celestial.calendar.events

/**
 * Celestial — built-in event rule datasets.
 *
 * Verbatim Kotlin port of the web `src/lib/events/data` TypeScript datasets
 * (names, descriptions and emoji copied exactly, including the fixed data
 * corrections: Yalda = Azar 30, Sepandarmazgan = Bahman 29).
 */
object RuleDataset {

    // ------------------------------------------------------------------
    // International observances (built-in, not legal holidays unless noted)
    // Round 13: full world-observance dataset — all 32 entries, sorted by
    // (month, day), mirroring the web's international.ts verbatim.
    // ------------------------------------------------------------------
    val internationalRules: List<EventRule> = listOf(
        EventRule(
            "int-education-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 1, day = 24, emoji = "📚",
            names = L10n("International Day of Education", "国際教育デー", "روز جهانی آموزش"),
            descriptions = L10n(
                "A UN day celebrating the role of education in peace and development.",
                "教育が平和と発展に果たす役割を称える国連の記念日。",
                "روز جهانی نقش آموزش در صلح و توسعه.",
            ),
        ),
        EventRule(
            "int-cancer-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 2, day = 4, emoji = "🎗️",
            names = L10n("World Cancer Day", "世界がんデー", "روز جهانی سرطان"),
            descriptions = L10n(
                "Raising worldwide awareness of cancer prevention, detection and treatment.",
                "がんの予防・早期発見・治療への意識を高める日。",
                "روز افزایش آگاهی درباره پیشگیری و درمان سرطان.",
            ),
        ),
        EventRule(
            "int-women-science-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 2, day = 11, emoji = "🔬",
            names = L10n(
                "International Day of Women and Girls in Science",
                "女性及び少女の科学分野への参加のための国際デー",
                "روز جهانی زنان و دختران در علم",
            ),
            descriptions = L10n(
                "Promoting equal access and participation of women and girls in science.",
                "科学の分野における女性と少女の平等な参加を促す国際デー。",
                "روز ترویج مشارکت برابر زنان و دختران در علم.",
            ),
        ),
        EventRule(
            "int-valentines", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 2, day = 14, emoji = "💝",
            names = L10n("Valentine's Day", "バレンタインデー", "روز ولنت"),
            descriptions = L10n(
                "The feast of Saint Valentine — a celebration of love and affection.",
                "聖バレンタインの祝日。愛と親愛の祭日。",
                "روز عشق — جشن والنتین؛ روز عاشقان.",
            ),
        ),
        EventRule(
            "int-womens-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 3, day = 8, emoji = "🌸",
            names = L10n("International Women's Day", "国際女性デー", "روز جهانی زن"),
            descriptions = L10n(
                "Celebrating the social, economic, cultural and political achievements of women.",
                "女性の社会・経済・文化・政治的成果を祝う国際デー。",
                "جشن دستاوردهای اجتماعی، اقتصادی و سیاسی زنان.",
            ),
        ),
        EventRule(
            "int-happiness-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 3, day = 20, emoji = "🙂",
            names = L10n("International Day of Happiness", "国際幸福デー", "روز جهانی شادکامی"),
            descriptions = L10n(
                "Recognising happiness and well-being as universal goals for all people.",
                "幸福と福祉をすべての人の普遍的な目標と認める日。",
                "روز به رسمیت شناختن شادکامی و بهزیستی به‌عنوان هدفی جهانی.",
            ),
        ),
        EventRule(
            "int-persian-newyear-eve", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 3, day = 20, emoji = "🌱",
            names = L10n("Spring Equinox", "春分", "اعتدال بهاری"),
            descriptions = L10n(
                "The March equinox — the astronomical first moment of spring in the northern hemisphere, and the moment Nowruz begins.",
                "3月の春分点。北半球の春の始まりであり、ノウルーズの始まりの瞬間。",
                "لحظه اعتدال بهاری — آغاز فصل بهار و لحظه تحویل سال نو شمسی.",
            ),
        ),
        EventRule(
            "int-poetry-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 3, day = 21, emoji = "🖋️",
            names = L10n("World Poetry Day", "世界詩歌デー", "روز جهانی شعر"),
            descriptions = L10n(
                "Celebrating poetry as one of humanity’s most treasured forms of expression.",
                "人類の宝である詩の表現を祝う日。",
                "جشن شعر به‌عنوان گنجینه بیان انسانی.",
            ),
        ),
        EventRule(
            "int-water-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 3, day = 22, emoji = "💧",
            names = L10n("World Water Day", "世界水の日", "روز جهانی آب"),
            descriptions = L10n(
                "Highlighting the importance of fresh water and sustainable management of water resources.",
                "淡水の大切さと水資源の持続可能な管理を訴える日。",
                "روز تأکید بر اهمیت آب شیرین و مدیریت پایدار منابع آب.",
            ),
        ),
        EventRule(
            "int-april-fools", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 4, day = 1, emoji = "🃏",
            names = L10n("April Fools' Day", "エイプリルフール", "روز دروغ اول آوریل"),
            descriptions = L10n(
                "An annual custom of practical jokes and hoaxes.",
                "悪ふざけやいたずらの年中行事。",
                "روز شوخی و مزاحمت سالانه.",
            ),
        ),
        EventRule(
            "int-autism-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 4, day = 2, emoji = "🧩",
            names = L10n("World Autism Awareness Day", "世界自閉症啓発デー", "روز جهانی آگاهی درباره اوتیسم"),
            descriptions = L10n(
                "Improving understanding and acceptance of people on the autism spectrum.",
                "自閉スペクトラムの人々への理解と受容を深める日。",
                "روز ارتقای شناخت و پذیرش افراد دارای اوتیسم.",
            ),
        ),
        EventRule(
            "int-health-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 4, day = 7, emoji = "🩺",
            names = L10n("World Health Day", "世界保健デー", "روز جهانی بهداشت"),
            descriptions = L10n(
                "Marking the founding of the WHO and drawing attention to global health issues.",
                "WHOの設立を記念し、世界の健康課題に目を向ける日。",
                "سالروز تأسیس سازمان جهانی بهداشت و توجه به سلامت جهانی.",
            ),
        ),
        EventRule(
            "int-earth-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 4, day = 22, emoji = "🌍",
            names = L10n("Earth Day", "アースデー", "روز زمین"),
            descriptions = L10n(
                "An annual event to demonstrate support for environmental protection.",
                "環境保護への支持を示す年次行事。",
                "رویداد سالانه حمایت از محیط زیست و حفاظت از زمین.",
            ),
        ),
        EventRule(
            "int-workers-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 5, day = 1, emoji = "🛠️",
            names = L10n("International Workers’ Day", "メーデー", "روز جهانی کارگر"),
            descriptions = L10n(
                "Labour Day — celebrating workers and the labour movement.",
                "労働者と労働運動を祝う日。",
                "روز جهانی کارگر — جشن کارگران و جنبش کارگری.",
            ),
        ),
        EventRule(
            "int-nurses-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 5, day = 12, emoji = "🩹",
            names = L10n("International Nurses Day", "国際看護師デー", "روز جهانی پرستاران"),
            descriptions = L10n(
                "Honouring nurses on Florence Nightingale’s birthday for their care and courage.",
                "ナイチンゲールの誕生日に看護師の貢献を称える日。",
                "سالروز تولد نایتینگل — روز بزرگداشت پرستاران.",
            ),
        ),
        EventRule(
            "int-childrens-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 6, day = 1, emoji = "🎈",
            names = L10n("International Children’s Day", "国際こどもの日", "روز جهانی کودک"),
            descriptions = L10n(
                "A day honouring children and promoting their welfare.",
                "子どもを称え、福祉を推進する日。",
                "روز بزرگداشت کودکان و ترویج حقوق آنان.",
            ),
        ),
        EventRule(
            "int-environment-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 6, day = 5, emoji = "🌳",
            names = L10n("World Environment Day", "世界環境デー", "روز جهانی محیط زیست"),
            descriptions = L10n(
                "The UN’s principal vehicle for encouraging awareness and action for the environment.",
                "環境保護への意識と行動を促す国連最大の記念日。",
                "مهم‌ترین رویداد سازمان ملل برای تشویق حمایت از محیط زیست.",
            ),
        ),
        EventRule(
            "int-oceans-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 6, day = 8, emoji = "🌊",
            names = L10n("World Oceans Day", "世界海洋デー", "روز جهانی اقیانوس‌ها"),
            descriptions = L10n(
                "Celebrating the ocean and reminding everyone of its role in our lives.",
                "海の恵みと海洋保護の大切さを再認識する日。",
                "روز گرامیداشت اقیانوس‌ها و نقش آنان در زندگی ما.",
            ),
        ),
        EventRule(
            "int-population-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 7, day = 11, emoji = "👥",
            names = L10n("World Population Day", "世界人口デー", "روز جهانی جمعیت"),
            descriptions = L10n(
                "Focusing attention on the urgency and importance of population issues.",
                "人口問題の緊急性と重要性に目を向ける日。",
                "روز توجه به اهمیت و فوریت مسائل جمعیتی.",
            ),
        ),
        EventRule(
            "int-youth-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 8, day = 12, emoji = "🎓",
            names = L10n("International Youth Day", "国際青年デー", "روز جهانی جوانان"),
            descriptions = L10n(
                "Celebrating the potential of young people as partners in change.",
                "社会の変化を担う若者の力を祝う国際デー。",
                "روز ستایش توانمندی جوانان به‌عنوان یاران تغییر.",
            ),
        ),
        EventRule(
            "int-literacy-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 9, day = 8, emoji = "📖",
            names = L10n("International Literacy Day", "国際識字デー", "روز جهانی سوادآموزی"),
            descriptions = L10n(
                "Reminding the world of the value of literacy for individuals and societies.",
                "識字の価値を個人と社会の両面で再確認する日。",
                "روز یادآوری ارزش سوادآموزی برای فرد و جامعه.",
            ),
        ),
        EventRule(
            "int-peace-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 9, day = 21, emoji = "🕊️",
            names = L10n("International Day of Peace", "国際平和デー", "روز جهانی صلح"),
            descriptions = L10n(
                "Devoted to strengthening the ideals of peace among all nations.",
                "諸国民間の平和の理想を強化する日。",
                "روز تقویت آرمان صلح میان ملل.",
            ),
        ),
        EventRule(
            "int-older-persons", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 10, day = 1, emoji = "👵",
            names = L10n("International Day of Older Persons", "国際高齢者デー", "روز جهانی سالمندان"),
            descriptions = L10n(
                "Honouring the contributions of older people and their human rights.",
                "高齢者の貢献と人権に敬意を表する日。",
                "روز بزرگداشت نقش و حقوق سالمندان.",
            ),
        ),
        EventRule(
            "int-nonviolence-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 10, day = 2, emoji = "✌️",
            names = L10n("International Day of Non-Violence", "国際非暴力デー", "روز جهانی عدم خشونت"),
            descriptions = L10n(
                "Marking Gandhi’s birthday and the universal message of non-violence.",
                "ガンジーの誕生日に非暴力の精神を広める日。",
                "سالروز تولد گاندی — روز گسترش پیام عدم خشونت.",
            ),
        ),
        EventRule(
            "int-teachers-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 10, day = 5, emoji = "🍎",
            names = L10n("World Teachers' Day", "世界教師デー", "روز جهانی معلم"),
            descriptions = L10n(
                "Celebrating teachers and the transformation of education worldwide.",
                "世界の教師と教育の変革を称える日。",
                "روز بزرگداشت معلمان و تحول آموزش.",
            ),
        ),
        EventRule(
            "int-food-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 10, day = 16, emoji = "🌾",
            names = L10n("World Food Day", "世界食料デー", "روز جهانی غذا"),
            descriptions = L10n(
                "Commemorating the founding of the FAO and promoting action against hunger.",
                "FAO設立を記念し、飢餓への取り組みを促す日。",
                "سالروز تأسیس فائو — روز اقدام علیه گرسنگی.",
            ),
        ),
        EventRule(
            "int-halloween", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 10, day = 31, emoji = "🎃",
            names = L10n("Halloween", "ハロウィン", "هالووین"),
            descriptions = L10n(
                "All Hallows’ Eve — a night of costumes, treats and remembrance.",
                "諸聖人の前夜。仮装と菓子の夜。",
                "شب همه قدیسان — شبی با پوشش‌های خاص و شیرینی.",
            ),
        ),
        EventRule(
            "int-aids-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 12, day = 1, emoji = "🎈",
            names = L10n("World AIDS Day", "世界エイズデー", "روز جهانی ایدز"),
            descriptions = L10n(
                "Uniting in the fight against HIV, remembering those lost and supporting those living with it.",
                "HIVとの闘いで団結し、亡くなった人々を偲ぶ日。",
                "روز همبستگی در مبارزه با ایدز و یادبود درگذشتگان.",
            ),
        ),
        EventRule(
            "int-disabilities-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 12, day = 3, emoji = "♿",
            names = L10n("International Day of Persons with Disabilities", "国際障害者デー", "روز جهانی معلولان"),
            descriptions = L10n(
                "Promoting the rights and well-being of persons with disabilities.",
                "障害者の権利と福祉の促進を図る国際デー。",
                "روز ترویج حقوق و بهزیستی افراد دارای معلولیت.",
            ),
        ),
        EventRule(
            "int-human-rights-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 12, day = 10, emoji = "⚖️",
            names = L10n("Human Rights Day", "世界人権デー", "روز جهانی حقوق بشر"),
            descriptions = L10n(
                "Commemorating the adoption of the Universal Declaration of Human Rights in 1948.",
                "1948年の世界人権宣言採択を記念する日。",
                "سالروز تصویب اعلامیه جهانی حقوق بشر (۱۹۴۸).",
            ),
        ),
        EventRule(
            "int-migrants-day", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 12, day = 18, emoji = "🧳",
            names = L10n("International Migrants Day", "国際移住者デー", "روز جهانی مهاجران"),
            descriptions = L10n(
                "Recognising the contributions of migrants and protecting their rights.",
                "移民の貢献を認め、その権利を守る日。",
                "روز قدردانی از مشارکت مهاجران و دفاع از حقوقشان.",
            ),
        ),
        EventRule(
            "int-nye", EventCategory.INTERNATIONAL, RuleKind.GREGORIAN_FIXED,
            month = 12, day = 31, emoji = "🎆",
            names = L10n("New Year's Eve", "大晦日", "شب سال نو میلادی"),
            descriptions = L10n(
                "The last day of the Gregorian year, celebrated with fireworks.",
                "グレゴリオ暦年の最後の日。花火で祝う。",
                "آخرین روز سال میلادی؛ جشن با آتش‌بازی.",
            ),
        ),
    )

    // ------------------------------------------------------------------
    // US federal holidays (built-in offline dataset)
    // ------------------------------------------------------------------
    val usRules: List<EventRule> = listOf(
        EventRule(
            "us-new-year", EventCategory.US, RuleKind.GREGORIAN_FIXED,
            month = 1, day = 1, isHoliday = true, emoji = "🎊",
            names = L10n("New Year's Day", "ニューイヤーズデー", "روز سال نو"),
            descriptions = L10n(
                "First day of the Gregorian year.",
                "グレゴリオ暦年の最初の日。",
                "نخستین روز سال میلادی.",
            ),
        ),
        EventRule(
            "us-mlk", EventCategory.US, RuleKind.GREGORIAN_NTH_WEEKDAY,
            month = 1, day = 0, nth = 3, weekday = 1, isHoliday = true, emoji = "✊",
            names = L10n("Martin Luther King Jr. Day", "MLKデー", "روز مارتین لوتر کینگ"),
            descriptions = L10n(
                "Honoring the civil rights leader.",
                "公民権運動指導者を称える日。",
                "روز بزرگداشت رهبر جنبش حقوق مدنی.",
            ),
        ),
        EventRule(
            "us-presidents", EventCategory.US, RuleKind.GREGORIAN_NTH_WEEKDAY,
            month = 2, day = 0, nth = 3, weekday = 1, isHoliday = true, emoji = "🏛️",
            names = L10n("Presidents' Day", "プレジデンツデー", "روز رؤسای جمهور"),
            descriptions = L10n(
                "Honoring US presidents.",
                "アメリカ大統領を称える日。",
                "روز بزرگداشت رؤسای جمهور آمریکا.",
            ),
        ),
        EventRule(
            "us-memorial", EventCategory.US, RuleKind.GREGORIAN_LAST_WEEKDAY,
            month = 5, day = 0, weekday = 1, isHoliday = true, emoji = "🎖️",
            names = L10n("Memorial Day", "メモリアルデー", "روز یادبود"),
            descriptions = L10n(
                "Remembering fallen service members.",
                "戦没者を追悼する日。",
                "روز یادبود جان‌باختگان.",
            ),
        ),
        EventRule(
            "us-juneteenth", EventCategory.US, RuleKind.GREGORIAN_FIXED,
            month = 6, day = 19, isHoliday = true, emoji = "🔗",
            names = L10n("Juneteenth", "ジューンティーン", "جونتینت"),
            descriptions = L10n(
                "Emancipation Day — end of slavery in the US.",
                "奴隷制終結を記念する日。",
                "روز پایان برده‌داری در آمریکا.",
            ),
        ),
        EventRule(
            "us-independence", EventCategory.US, RuleKind.GREGORIAN_FIXED,
            month = 7, day = 4, isHoliday = true, emoji = "🇺🇸",
            names = L10n("Independence Day", "独立記念日", "روز استقلال آمریکا"),
            descriptions = L10n(
                "Adoption of the Declaration of Independence in 1776.",
                "1776年独立宣言採択を記念。",
                "صدور اعلامیه استقلال در ۱۷۷۶.",
            ),
        ),
        EventRule(
            "us-labor", EventCategory.US, RuleKind.GREGORIAN_NTH_WEEKDAY,
            month = 9, day = 0, nth = 1, weekday = 1, isHoliday = true, emoji = "🔧",
            names = L10n("Labor Day", "レイバーデー", "روز کار (آمریکا)"),
            descriptions = L10n(
                "Celebrating American workers.",
                "アメリカの労働者を祝う日。",
                "روز کارگران آمریکا.",
            ),
        ),
        EventRule(
            "us-columbus", EventCategory.US, RuleKind.GREGORIAN_NTH_WEEKDAY,
            month = 10, day = 0, nth = 2, weekday = 1, isHoliday = true, emoji = "⛵",
            names = L10n("Columbus Day", "コロンブスデー", "روز کلمب"),
            descriptions = L10n(
                "Commemorating the arrival of Columbus in the Americas.",
                "コロンブスの新大陸到達を記念。",
                "یادبود رسیدن کلمب به قاره آمریکا.",
            ),
        ),
        EventRule(
            "us-veterans", EventCategory.US, RuleKind.GREGORIAN_FIXED,
            month = 11, day = 11, isHoliday = true, emoji = "🎗️",
            names = L10n("Veterans Day", "ベテランズデー", " روز جانبازان"),
            descriptions = L10n(
                "Honoring military veterans.",
                "退役軍人を称える日。",
                "روز بزرگداشت کهربایان.",
            ),
        ),
        EventRule(
            "us-thanksgiving", EventCategory.US, RuleKind.GREGORIAN_NTH_WEEKDAY,
            month = 11, day = 0, nth = 4, weekday = 4, isHoliday = true, emoji = "🦃",
            names = L10n("Thanksgiving Day", "感謝祭", "روز شکرگزاری"),
            descriptions = L10n(
                "Fourth Thursday of November — harvest thanksgiving.",
                "11月第4木曜日。収穫の感謝祭。",
                "پنجشنبه چهارم نوامبر — جشن برداشت.",
            ),
        ),
        EventRule(
            "us-christmas", EventCategory.US, RuleKind.GREGORIAN_FIXED,
            month = 12, day = 25, isHoliday = true, emoji = "🎄",
            names = L10n("Christmas Day", "クリスマス", "کریسمس"),
            descriptions = L10n(
                "Celebrating the birth of Christ.",
                "キリストの降誕を祝う日。",
                "جشن تولد مسیح.",
            ),
        ),
    )

    // ------------------------------------------------------------------
    // Japanese national holidays (built-in offline dataset)
    // ------------------------------------------------------------------
    val jpRules: List<EventRule> = listOf(
        EventRule(
            "jp-new-year", EventCategory.JAPAN, RuleKind.GREGORIAN_FIXED,
            month = 1, day = 1, isHoliday = true, emoji = "🎊",
            names = L10n("New Year's Day (元日)", "元日", "سال نو (گانجیتسو)"),
            descriptions = L10n(
                "First day of the year — the most important Japanese holiday.",
                "一年の最初の日。日本で最も重要な祝日。",
                "نخستین روز سال؛ مهم‌ترین تعطیلی ژاپن.",
            ),
        ),
        EventRule(
            "jp-coming-of-age", EventCategory.JAPAN, RuleKind.GREGORIAN_NTH_WEEKDAY,
            month = 1, day = 0, nth = 2, weekday = 1, isHoliday = true, emoji = "袴",
            names = L10n("Coming of Age Day (成人の日)", "成人の日", "روز جوانان"),
            descriptions = L10n(
                "Congratulating those who reached adulthood (20/18).",
                "大人になった人を祝う日。",
                "تبریک به جوانانِ به بلوغ رسیده.",
            ),
        ),
        EventRule(
            "jp-foundation", EventCategory.JAPAN, RuleKind.GREGORIAN_FIXED,
            month = 2, day = 11, isHoliday = true, emoji = "🏯",
            names = L10n("National Foundation Day (建国記念の日)", "建国記念の日", "روز تأسیس کشور"),
            descriptions = L10n(
                "Commemorating the founding of Japan by Emperor Jimmu.",
                "神武天皇の即位に基づく建国を記念。",
                "یادبود بنیان‌گذاری ژاپن.",
            ),
        ),
        EventRule(
            "jp-emperor-birthday", EventCategory.JAPAN, RuleKind.GREGORIAN_FIXED,
            month = 2, day = 23, isHoliday = true, emoji = "👑",
            names = L10n("Emperor's Birthday (天皇誕生日)", "天皇誕生日", "تولد امپراتور"),
            descriptions = L10n(
                "Birthday of the reigning Emperor Naruhito.",
                "今上天皇の誕生日。",
                "زادروز امپراتور Naruhito.",
            ),
        ),
        EventRule(
            "jp-vernal-equinox", EventCategory.JAPAN, RuleKind.SEASON_EVENT,
            month = 3, day = 20, seasonTarget = 0, tzOffsetMin = 540,
            isHoliday = true, emoji = "🌼",
            names = L10n("Vernal Equinox Day (春分の日)", "春分の日", "روز اعتدال بهاری"),
            descriptions = L10n(
                "A day for embracing nature and living beings.",
                "自然をいつくしみ、生き物をたたえる日。",
                "روز دل‌بستن به طبیعت و ستایش جانداران.",
            ),
        ),
        EventRule(
            "jp-showa", EventCategory.JAPAN, RuleKind.GREGORIAN_FIXED,
            month = 4, day = 29, isHoliday = true, emoji = "🌿",
            names = L10n("Shōwa Day (昭和の日)", "昭和の日", "روز شووا"),
            descriptions = L10n(
                "Reflecting on the turbulent Shōwa era and renewal.",
                "激動の昭和の時代をふりかえり、未来を考える日。",
                "بازاندیشی دوران پرتلاطم شووا.",
            ),
        ),
        EventRule(
            "jp-constitution", EventCategory.JAPAN, RuleKind.GREGORIAN_FIXED,
            month = 5, day = 3, isHoliday = true, emoji = "📜",
            names = L10n("Constitution Memorial Day (憲法記念日)", "憲法記念日", "روز قانون اساسی"),
            descriptions = L10n(
                "Commemorating the 1947 Constitution of Japan.",
                "1947年日本国憲法の施行を記念。",
                "یادبود قانون اساسی ۱۹۴۷ ژاپن.",
            ),
        ),
        EventRule(
            "jp-greenery", EventCategory.JAPAN, RuleKind.GREGORIAN_FIXED,
            month = 5, day = 4, isHoliday = true, emoji = "🍀",
            names = L10n("Greenery Day (みどりの日)", "みどりの日", "روز سبزه"),
            descriptions = L10n(
                "A day to commune with nature and gratitude.",
                "自然に親しみ、その恩恵に感謝する日。",
                "روز پیوند با طبیعت و قدردانی.",
            ),
        ),
        EventRule(
            "jp-children", EventCategory.JAPAN, RuleKind.GREGORIAN_FIXED,
            month = 5, day = 5, isHoliday = true, emoji = "🎏",
            names = L10n("Children's Day (こどもの日)", "こどもの日", "روز کودکان ژاپن"),
            descriptions = L10n(
                "Celebrating children’s happiness — koinobori carp streamers.",
                "子どもの幸福を祈る日。鯉のぼり。",
                "روز شادی کودکان؛ پرچم‌های ماهی کپور.",
            ),
        ),
        EventRule(
            "jp-marine", EventCategory.JAPAN, RuleKind.GREGORIAN_NTH_WEEKDAY,
            month = 7, day = 0, nth = 3, weekday = 1, isHoliday = true, emoji = "🌊",
            names = L10n("Marine Day (海の日)", "海の日", "روز دریا"),
            descriptions = L10n(
                "Gratitude for the ocean and maritime Japan.",
                "海の恩恵に感謝する日。",
                "قدردانی از دریا.",
            ),
        ),
        EventRule(
            "jp-mountain", EventCategory.JAPAN, RuleKind.GREGORIAN_FIXED,
            month = 8, day = 11, isHoliday = true, emoji = "⛰️",
            names = L10n("Mountain Day (山の日)", "山の日", "روز کوه"),
            descriptions = L10n(
                "A day to appreciate mountains.",
                "山に親しむ日。",
                "روز سپاس از کوهستان.",
            ),
        ),
        EventRule(
            "jp-respect-aged", EventCategory.JAPAN, RuleKind.GREGORIAN_NTH_WEEKDAY,
            month = 9, day = 0, nth = 3, weekday = 1, isHoliday = true, emoji = "🏮",
            names = L10n("Respect for the Aged Day (敬老の日)", "敬老の日", "روز بزرگداشت سالمندان"),
            descriptions = L10n(
                "Honoring elderly citizens.",
                "長寿を祝う日。",
                "احترام به کهنسالان.",
            ),
        ),
        EventRule(
            "jp-autumn-equinox", EventCategory.JAPAN, RuleKind.SEASON_EVENT,
            month = 9, day = 22, seasonTarget = 180, tzOffsetMin = 540,
            isHoliday = true, emoji = "🌕",
            names = L10n("Autumnal Equinox Day (秋分の日)", "秋分の日", "روز اعتدال پاییزی"),
            descriptions = L10n(
                "Honoring ancestors and the dead.",
                "祖先をうやまう日。",
                "روز بزرگداشت نیاکان.",
            ),
        ),
        EventRule(
            "jp-sports", EventCategory.JAPAN, RuleKind.GREGORIAN_NTH_WEEKDAY,
            month = 10, day = 0, nth = 2, weekday = 1, isHoliday = true, emoji = "🏃",
            names = L10n("Sports Day (スポーツの日)", "スポーツの日", "روز ورزش"),
            descriptions = L10n(
                "Enjoying sports for mind and body.",
                "心身の健康のためスポーツに親しむ日。",
                "روز پیوند با ورزش برای سلامتی.",
            ),
        ),
        EventRule(
            "jp-culture", EventCategory.JAPAN, RuleKind.GREGORIAN_FIXED,
            month = 11, day = 3, isHoliday = true, emoji = "🎨",
            names = L10n("Culture Day (文化の日)", "文化の日", "روز فرهنگ"),
            descriptions = L10n(
                "Promoting culture, arts and academic endeavor.",
                "文化と学術をたたえる日。",
                "روز ارتقای فرهنگ و هنر.",
            ),
        ),
        EventRule(
            "jp-labor-thanks", EventCategory.JAPAN, RuleKind.GREGORIAN_FIXED,
            month = 11, day = 23, isHoliday = true, emoji = "🙏",
            names = L10n("Labor Thanksgiving Day (勤労感謝の日)", "勤労感謝の日", "روز قدردانی از کار"),
            descriptions = L10n(
                "Gratitude for labor and production.",
                "勤労を尊び、生産を祝い感謝する日。",
                "قدردانی از کار و تولید.",
            ),
        ),
    )

    // ------------------------------------------------------------------
    // Persian cultural events (Zoroastrian / Iranian heritage)
    // ------------------------------------------------------------------
    val persianCulturalRules: List<EventRule> = listOf(
        EventRule(
            "pc-charshanbe-suri", EventCategory.PERSIAN_CULTURAL, RuleKind.JALALI_LAST_WEEKDAY,
            month = 12, day = 0, weekday = 2, // last Tuesday of Esfand (fire festival on its eve)
            emoji = "🔥",
            names = L10n("Charshanbe Suri", "チャルシャンベ・スリー", "چهارشنبه‌سوری"),
            descriptions = L10n(
                "Fire-jumping festival on the eve of the last Wednesday of the year — “let your redness be mine, take my paleness.”",
                "年末最終火曜日の前夜、火を飛び越える祭り。「あなたの赤を私に、私の蒼白をあなたに。」",
                "جشن آتش در آخرین سه‌شنبه سال — «زردي من از تو، سرخي تو از من».",
            ),
        ),
        EventRule(
            "pc-yalda", EventCategory.PERSIAN_CULTURAL, RuleKind.JALALI_FIXED,
            month = 9, day = 30, // Azar 30 — last night of autumn
            emoji = "🍉",
            names = L10n("Yalda Night", "ヤルダーの夜", "شب یلدا"),
            descriptions = L10n(
                "The longest night of the year — family gathers, pomegranate, watermelon, poetry of Hafez.",
                "一年で最も長い夜。家族が集い、ザクロとスイカを味わい、ハーフェズの詩を朗読。",
                "بلندترین شب سال؛ دورهمی خانواده، انار و هندوانه و دیوان حافظ.",
            ),
        ),
        EventRule(
            "pc-mehregan", EventCategory.PERSIAN_CULTURAL, RuleKind.JALALI_FIXED,
            month = 7, day = 29, emoji = "🍂",
            names = L10n("Mehregan", "メフレガーン", "جشن مهرگان"),
            descriptions = L10n(
                "Ancient festival of Mithra — friendship, love and the harvest, at the start of autumn.",
                "ミスラの古代祭。友情と愛と収穫の秋の祭り。",
                "جشن باستانی میترا؛ عشق و دوستی و برداشت، در آغاز پاییز.",
            ),
        ),
        EventRule(
            "pc-tiregan", EventCategory.PERSIAN_CULTURAL, RuleKind.JALALI_FIXED,
            month = 4, day = 1, emoji = "⛅",
            names = L10n("Tiregan", "ティールガーン", "جشن تیرگان"),
            descriptions = L10n(
                "Summer festival of Tishtrya, the rain-bringing star — splashing water for good fortune.",
                "雨をもたらす星ティシュトリヤの夏祭り。水を掛け合う。",
                "جشن تیر و ستاره باران‌خیز تیشتر؛ آب‌پاشی برای بخت.",
            ),
        ),
        EventRule(
            "pc-abangan", EventCategory.PERSIAN_CULTURAL, RuleKind.JALALI_FIXED,
            month = 8, day = 10, emoji = "💧",
            names = L10n("Abangan", "アーバーンガーン", "جشن آبانگان"),
            descriptions = L10n(
                "Day of Waters — honouring Anahita, the goddess of waters, at the heart of autumn.",
                "水の日。水の女神アナーヒターを称える。",
                "روز آب؛ بزرگداشت آناهیتا، ایزدبانوی آب‌ها.",
            ),
        ),
        EventRule(
            "pc-sadeh", EventCategory.PERSIAN_CULTURAL, RuleKind.JALALI_FIXED,
            month = 11, day = 10, emoji = "🔥",
            names = L10n("Sadeh", "サーデ", "جشن سده"),
            descriptions = L10n(
                "The mid-winter fire festival — “hundred days and nights” past the year’s end.",
                "真冬の火祭り。年の終わりから百日目。",
                "جشن آتش در نیمه زمستان؛ صد روز و صد شب پس از پایان سال.",
            ),
        ),
        EventRule(
            "pc-cyrus-day", EventCategory.PERSIAN_CULTURAL, RuleKind.JALALI_FIXED,
            month = 8, day = 7, emoji = "🏛️",
            names = L10n("Cyrus the Great Day", "キュロス大王の日", "روز کوروش بزرگ"),
            descriptions = L10n(
                "Commemorating Cyrus the Great — his taking of Babylon on this day in 539 BCE, and the Cylinder of Human Rights.",
                "キュロス大王を記念する日。紀元前539年バビロン入城と人権円筒宣言。",
                "روز یادبود کوروش بزرگ؛ ورود به بابل و منشور حقوق بشر.",
            ),
        ),
        EventRule(
            "pc-sepandarmazgan", EventCategory.PERSIAN_CULTURAL, RuleKind.JALALI_FIXED,
            month = 11, day = 29, // Bahman 29 — popular observance (Feb 18)
            emoji = "🌹",
            names = L10n("Sepandarmazgan", "セパンダルマズガーン", "جشن سپندارمذگان"),
            descriptions = L10n(
                "The Persian day of love and devotion (Spandarmad — devotion), honoring women and the earth.",
                "ペルシアの愛と献身の日。女性と大地を敬う。",
                "روز عشق و ایثار ایرانی؛ تکریم زن و زمین.",
            ),
        ),
    )

    // ------------------------------------------------------------------
    // Iranian national holidays (solar / Jalali fixed)
    // ------------------------------------------------------------------
    val persianNationalRules: List<EventRule> = listOf(
        EventRule(
            "pn-nowruz1", EventCategory.PERSIAN_NATIONAL, RuleKind.JALALI_FIXED,
            month = 1, day = 1, isHoliday = true, emoji = "🌱",
            names = L10n("Nowruz", "ノウルーズ", "نوروز"),
            descriptions = L10n(
                "Persian New Year — the spring equinox. Haft-sin table, new clothes, family visits.",
                "ペルシア新年。春分の日。ハフト・スィーンの卓、新衣、親族訪問。",
                "سال نو ایرانی؛ سفره هفت‌سین، لباس نو و دید و بازدید.",
            ),
        ),
        EventRule(
            "pn-nowruz2", EventCategory.PERSIAN_NATIONAL, RuleKind.JALALI_FIXED,
            month = 1, day = 2, isHoliday = true, emoji = "🌱",
            names = L10n("Nowruz holidays", "ノウルーズ休暇（2日目）", "تعطیلات نوروز (روز دوم)"),
            descriptions = L10n(
                "Second day of the New Year holidays.",
                "新年休暇2日目。",
                "روز دوم تعطیلات سال نو.",
            ),
        ),
        EventRule(
            "pn-nowruz3", EventCategory.PERSIAN_NATIONAL, RuleKind.JALALI_FIXED,
            month = 1, day = 3, isHoliday = true, emoji = "🌱",
            names = L10n("Nowruz holidays", "ノウルーズ休暇（3日目）", "تعطیلات نوروز (روز سوم)"),
            descriptions = L10n(
                "Third day of the New Year holidays.",
                "新年休暇3日目。",
                "روز سوم تعطیلات سال نو.",
            ),
        ),
        EventRule(
            "pn-nowruz4", EventCategory.PERSIAN_NATIONAL, RuleKind.JALALI_FIXED,
            month = 1, day = 4, isHoliday = true, emoji = "🌱",
            names = L10n("Nowruz holidays", "ノウルーズ休暇（4日目）", "تعطیلات نوروز (روز چهارم)"),
            descriptions = L10n(
                "Fourth and final day of the New Year holidays.",
                "新年休暇4日目（最終日）。",
                "روز چهارم تعطیلات سال نو.",
            ),
        ),
        EventRule(
            "pn-republic-day", EventCategory.PERSIAN_NATIONAL, RuleKind.JALALI_FIXED,
            month = 1, day = 12, isHoliday = true, emoji = "🗳️",
            names = L10n("Islamic Republic Day", "イスラム共和国記念日", "روز جمهوری اسلامی"),
            descriptions = L10n(
                "Anniversary of the 1979 referendum (12 Farvardin).",
                "1979年国民投票の記念日（ファルヴァルディーン12日）。",
                "سالگرد همه‌پرسی ۱۲ فروردین ۱۳۵۸.",
            ),
        ),
        EventRule(
            "pn-nature-day", EventCategory.PERSIAN_NATIONAL, RuleKind.JALALI_FIXED,
            month = 1, day = 13, isHoliday = true, emoji = "🌿",
            names = L10n("Nature Day (Sizdah Bedar)", "自然の日（シズダ・ベダル）", "روز طبیعت (سیزده‌بدر)"),
            descriptions = L10n(
                "The 13th of Farvardin — everyone goes outdoors to picnic; the “ unlucky 13” is spent with nature.",
                "ファルヴァルディーン13日。全家で郊外へ。自然と共に過ごす日。",
                "سیزدهم فروردین؛ روزی برای رفتن به دامان طبیعت.",
            ),
        ),
        EventRule(
            "pn-revolution-day", EventCategory.PERSIAN_NATIONAL, RuleKind.JALALI_FIXED,
            month = 11, day = 22, isHoliday = true, emoji = "✊",
            names = L10n("Islamic Revolution Day", "イスラム革命記念日", "پیروزی انقلاب اسلامی"),
            descriptions = L10n(
                "Anniversary of the 1979 Revolution (22 Bahman).",
                "1979年イスラム革命勝利の記念日（バフマン22日）。",
                "سالگرد پیروزی انقلاب در ۲۲ بهمن ۱۳۵۷.",
            ),
        ),
    )

    // ------------------------------------------------------------------
    // Persian religious events (Hijri lunar — shift each solar year).
    // Dates computed with the ICU Islamic CIVIL calendar; official Iranian
    // dates may shift ±1 day with moon sighting.
    // ------------------------------------------------------------------
    private fun hijriFixed(
        id: String, month: Int, day: Int, isHoliday: Boolean, emoji: String,
        names: L10n, descriptions: L10n,
    ) = EventRule(
        id, EventCategory.PERSIAN_RELIGIOUS, RuleKind.HIJRI_FIXED,
        month = month, day = day, isHoliday = isHoliday, emoji = emoji,
        names = names, descriptions = descriptions,
    )

    val persianReligiousRules: List<EventRule> = listOf(
        hijriFixed(
            "pr-tasua", 1, 9, true, "🕯️",
            L10n("Tasua", "タースーア", "تاسوعای حسینی"),
            L10n(
                "The 9th of Muharram — the eve of Ashura, mourning Imam Hussein’s family.",
                "ムハッラム9日。アーシュラー前夜、フセイン一族を悼む。",
                "نهم محرم؛ شب پیش از عاشورا.",
            ),
        ),
        hijriFixed(
            "pr-ashura", 1, 10, true, "🖤",
            L10n("Ashura", "アーシュラー", "عاشورای حسینی"),
            L10n(
                "The 10th of Muharram — martyrdom of Imam Hussein at Karbala (680 CE).",
                "ムハッラム10日。カルバラでのフセイン殉教（680年）。",
                "دهم محرم؛ شهادت امام حسین در کربلا.",
            ),
        ),
        hijriFixed(
            "pr-arbaeen", 2, 20, true, "🚶",
            L10n("Arbaeen", "アルバイン", "اربعین حسینی"),
            L10n(
                "The 40th day after Ashura — the world’s largest annual pilgrimage to Karbala.",
                "アーシュラーから40日目。世界最大の年次巡礼。",
                "چهلم شهادت امام حسین؛ بزرگ‌ترین پیاده‌روی سال.",
            ),
        ),
        hijriFixed(
            "pr-prophet-death", 2, 28, true, "🌫️",
            L10n("Passing of the Prophet", "預言者帰天の日", "رحلت پیامبر و شهادت امام حسن"),
            L10n(
                "28 Safar — passing of Prophet Muhammad and martyrdom of Imam Hassan.",
                "サファル28日。ムハンマド帰天とハサン殉教。",
                "بیست و هشت صفر؛ رحلت پیامبر و شهادت امام حسن مجتبی.",
            ),
        ),
        hijriFixed(
            "pr-fatima-martyrdom", 6, 3, true, "🌷",
            L10n("Martyrdom of Fatima", "ファーティマ殉教の日", "شهادت حضرت فاطمه"),
            L10n(
                "3 Jumada al-Thani — Fatimiya, mourning for the Prophet’s daughter.",
                "ジュマーダーII月3日。ファーティマーを悼む。",
                "سوم جمادی‌الثانی؛ ایام فاطمیه.",
            ),
        ),
        hijriFixed(
            "pr-ali-birthday", 7, 13, false, "⚔️",
            L10n("Birthday of Imam Ali", "イマーム・アリーの誕生", "میلاد امام علی"),
            L10n(
                "13 Rajab — birthday of Ali ibn Abi Talib, father of Nowruz greetings at Kaaba.",
                "ラジャブ13日。アリーの誕生。",
                "سیزده رجب؛ زادروز امام علی.",
            ),
        ),
        hijriFixed(
            "pr-mahdi-birthday", 8, 15, false, "⭐",
            L10n("Mid-Sha’ban", "シャアバーン半ば", "میلاد امام زمان"),
            L10n(
                "15 Sha’ban — birthday of the twelfth Imam, celebrated with fireworks.",
                "シャアバーン15日。十二イマームの誕生。",
                "نیمه شعبان؛ زادروز امام دوازدهم.",
            ),
        ),
        hijriFixed(
            "pr-qadr", 9, 23, false, "📖",
            L10n("Laylat al-Qadr", "運命の夜", "شب قدر"),
            L10n(
                "The Night of Destiny — the revelation of the Quran began; better than a thousand months.",
                "クルアーン啓示始まる夜。千月に勝る。",
                "شب نزول قرآن؛ بهتر از هزار ماه.",
            ),
        ),
        hijriFixed(
            "pr-ali-martyrdom", 9, 21, true, "🌑",
            L10n("Martyrdom of Imam Ali", "イマーム・アリー殉教の日", "شهادت امام علی"),
            L10n(
                "21 Ramadan — Ali ibn Abi Talib was struck while praying in Kufa.",
                "ラマダーン21日。クーファで礼拝中に襲われた。",
                "بیست و یکم رمضان؛ شهادت امیرالمؤمنان.",
            ),
        ),
        hijriFixed(
            "pr-eid-fitr", 10, 1, true, "🎉",
            L10n("Eid al-Fitr", "イード・アル＝フィトル", "عید سعید فطر"),
            L10n(
                "Breaking of the Ramadan fast — festivities for two days.",
                "ラマダーン斎明けの祝祭。2日間。",
                "پایان روزه رمضان؛ دو روز جشن و شادی.",
            ),
        ),
        hijriFixed(
            "pr-eid-fitr-2", 10, 2, true, "🎉",
            L10n("Eid al-Fitr (2nd day)", "フィトルの祝日（2日目）", "عید فطر (روز دوم)"),
            L10n(
                "Second day of the Eid al-Fitr holiday.",
                "イード・アル＝フィトル2日目。",
                "روز دوم تعطیلی عید فطر.",
            ),
        ),
        hijriFixed(
            "pr-eid-ghadir", 12, 18, true, "🏅",
            L10n("Eid al-Ghadir", "イード・アル＝ガディール", "عید سعید غدیر"),
            L10n(
                "18 Dhu al-Hijja — the Prophet declared Ali his successor at Ghadir Khumm.",
                "ズー・アル＝ヒッジャ18日。ガディール・フムでの宣言。",
                "هجدهم ذی‌الحجه؛ روز غدیر خم.",
            ),
        ),
        hijriFixed(
            "pr-eid-adha", 12, 10, true, "🐑",
            L10n("Eid al-Adha", "イード・アル＝アドハー", "عید سعید قربان"),
            L10n(
                "The Feast of Sacrifice — commemorating Abraham’s devotion.",
                "犠牲の祭。イブラーヒームの献身を記念。",
                "عید قربان؛ یادگار ایثار ابراهیم.",
            ),
        ),
        hijriFixed(
            "pr-prophet-birthday", 3, 17, true, "🎂",
            L10n("Birthday of the Prophet", "預言者生誕祭", "میلاد پیامبر و امام صادق"),
            L10n(
                "17 Rabi al-Awwal — birthday of Prophet Muhammad and Imam Ja’far al-Sadiq.",
                "ラビーI月17日。ムハンマドとイマーム・サーディクの誕生。",
                "هفدهم ربیع‌الاول؛ میلاد پیامبر اکرم و امام صادق.",
            ),
        ),
    )

    /** All built-in rules (order matters for deterministic expansion output). */
    val allBuiltinRules: List<EventRule> =
        internationalRules + usRules + jpRules + persianCulturalRules +
                persianNationalRules + persianReligiousRules
}
