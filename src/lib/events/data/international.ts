// Celestial — international observances (built-in, not legal holidays unless noted)
// Sorted by (month, day).
import type { EventRule } from '../types';

export const internationalRules: EventRule[] = [
  {
    id: 'int-education-day', category: 'international', kind: 'gregorian-fixed',
    month: 1, day: 24, emoji: '📚',
    names: { en: 'International Day of Education', ja: '国際教育デー', fa: 'روز جهانی آموزش' },
    descriptions: {
      en: 'A UN day celebrating the role of education in peace and development.',
      ja: '教育が平和と発展に果たす役割を称える国連の記念日。',
      fa: 'روز جهانی نقش آموزش در صلح و توسعه.',
    },
  },
  {
    id: 'int-cancer-day', category: 'international', kind: 'gregorian-fixed',
    month: 2, day: 4, emoji: '🎗️',
    names: { en: 'World Cancer Day', ja: '世界がんデー', fa: 'روز جهانی سرطان' },
    descriptions: {
      en: 'Raising worldwide awareness of cancer prevention, detection and treatment.',
      ja: 'がんの予防・早期発見・治療への意識を高める日。',
      fa: 'روز افزایش آگاهی درباره پیشگیری و درمان سرطان.',
    },
  },
  {
    id: 'int-women-science-day', category: 'international', kind: 'gregorian-fixed',
    month: 2, day: 11, emoji: '🔬',
    names: { en: 'International Day of Women and Girls in Science', ja: '女性及び少女の科学分野への参加のための国際デー', fa: 'روز جهانی زنان و دختران در علم' },
    descriptions: {
      en: 'Promoting equal access and participation of women and girls in science.',
      ja: '科学の分野における女性と少女の平等な参加を促す国際デー。',
      fa: 'روز ترویج مشارکت برابر زنان و دختران در علم.',
    },
  },
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
    id: 'int-happiness-day', category: 'international', kind: 'gregorian-fixed',
    month: 3, day: 20, emoji: '🙂',
    names: { en: 'International Day of Happiness', ja: '国際幸福デー', fa: 'روز جهانی شادکامی' },
    descriptions: {
      en: 'Recognising happiness and well-being as universal goals for all people.',
      ja: '幸福と福祉をすべての人の普遍的な目標と認める日。',
      fa: 'روز به رسمیت شناختن شادکامی و بهزیستی به‌عنوان هدفی جهانی.',
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
  {
    id: 'int-poetry-day', category: 'international', kind: 'gregorian-fixed',
    month: 3, day: 21, emoji: '🖋️',
    names: { en: 'World Poetry Day', ja: '世界詩歌デー', fa: 'روز جهانی شعر' },
    descriptions: {
      en: 'Celebrating poetry as one of humanity’s most treasured forms of expression.',
      ja: '人類の宝である詩の表現を祝う日。',
      fa: 'جشن شعر به‌عنوان گنجینه بیان انسانی.',
    },
  },
  {
    id: 'int-water-day', category: 'international', kind: 'gregorian-fixed',
    month: 3, day: 22, emoji: '💧',
    names: { en: 'World Water Day', ja: '世界水の日', fa: 'روز جهانی آب' },
    descriptions: {
      en: 'Highlighting the importance of fresh water and sustainable management of water resources.',
      ja: '淡水の大切さと水資源の持続可能な管理を訴える日。',
      fa: 'روز تأکید بر اهمیت آب شیرین و مدیریت پایدار منابع آب.',
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
    id: 'int-autism-day', category: 'international', kind: 'gregorian-fixed',
    month: 4, day: 2, emoji: '🧩',
    names: { en: 'World Autism Awareness Day', ja: '世界自閉症啓発デー', fa: 'روز جهانی آگاهی درباره اوتیسم' },
    descriptions: {
      en: 'Improving understanding and acceptance of people on the autism spectrum.',
      ja: '自閉スペクトラムの人々への理解と受容を深める日。',
      fa: 'روز ارتقای شناخت و پذیرش افراد دارای اوتیسم.',
    },
  },
  {
    id: 'int-health-day', category: 'international', kind: 'gregorian-fixed',
    month: 4, day: 7, emoji: '🩺',
    names: { en: 'World Health Day', ja: '世界保健デー', fa: 'روز جهانی بهداشت' },
    descriptions: {
      en: 'Marking the founding of the WHO and drawing attention to global health issues.',
      ja: 'WHOの設立を記念し、世界の健康課題に目を向ける日。',
      fa: 'سالروز تأسیس سازمان جهانی بهداشت و توجه به سلامت جهانی.',
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
    id: 'int-nurses-day', category: 'international', kind: 'gregorian-fixed',
    month: 5, day: 12, emoji: '🩹',
    names: { en: 'International Nurses Day', ja: '国際看護師デー', fa: 'روز جهانی پرستاران' },
    descriptions: {
      en: 'Honouring nurses on Florence Nightingale’s birthday for their care and courage.',
      ja: 'ナイチンゲールの誕生日に看護師の貢献を称える日。',
      fa: 'سالروز تولد نایتینگل — روز بزرگداشت پرستاران.',
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
    id: 'int-environment-day', category: 'international', kind: 'gregorian-fixed',
    month: 6, day: 5, emoji: '🌳',
    names: { en: 'World Environment Day', ja: '世界環境デー', fa: 'روز جهانی محیط زیست' },
    descriptions: {
      en: 'The UN’s principal vehicle for encouraging awareness and action for the environment.',
      ja: '環境保護への意識と行動を促す国連最大の記念日。',
      fa: 'مهم‌ترین رویداد سازمان ملل برای تشویق حمایت از محیط زیست.',
    },
  },
  {
    id: 'int-oceans-day', category: 'international', kind: 'gregorian-fixed',
    month: 6, day: 8, emoji: '🌊',
    names: { en: 'World Oceans Day', ja: '世界海洋デー', fa: 'روز جهانی اقیانوس‌ها' },
    descriptions: {
      en: 'Celebrating the ocean and reminding everyone of its role in our lives.',
      ja: '海の恵みと海洋保護の大切さを再認識する日。',
      fa: 'روز گرامیداشت اقیانوس‌ها و نقش آنان در زندگی ما.',
    },
  },
  {
    id: 'int-population-day', category: 'international', kind: 'gregorian-fixed',
    month: 7, day: 11, emoji: '👥',
    names: { en: 'World Population Day', ja: '世界人口デー', fa: 'روز جهانی جمعیت' },
    descriptions: {
      en: 'Focusing attention on the urgency and importance of population issues.',
      ja: '人口問題の緊急性と重要性に目を向ける日。',
      fa: 'روز توجه به اهمیت و فوریت مسائل جمعیتی.',
    },
  },
  {
    id: 'int-youth-day', category: 'international', kind: 'gregorian-fixed',
    month: 8, day: 12, emoji: '🎓',
    names: { en: 'International Youth Day', ja: '国際青年デー', fa: 'روز جهانی جوانان' },
    descriptions: {
      en: 'Celebrating the potential of young people as partners in change.',
      ja: '社会の変化を担う若者の力を祝う国際デー。',
      fa: 'روز ستایش توانمندی جوانان به‌عنوان یاران تغییر.',
    },
  },
  {
    id: 'int-literacy-day', category: 'international', kind: 'gregorian-fixed',
    month: 9, day: 8, emoji: '📖',
    names: { en: 'International Literacy Day', ja: '国際識字デー', fa: 'روز جهانی سوادآموزی' },
    descriptions: {
      en: 'Reminding the world of the value of literacy for individuals and societies.',
      ja: '識字の価値を個人と社会の両面で再確認する日。',
      fa: 'روز یادآوری ارزش سوادآموزی برای فرد و جامعه.',
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
    id: 'int-older-persons', category: 'international', kind: 'gregorian-fixed',
    month: 10, day: 1, emoji: '👵',
    names: { en: 'International Day of Older Persons', ja: '国際高齢者デー', fa: 'روز جهانی سالمندان' },
    descriptions: {
      en: 'Honouring the contributions of older people and their human rights.',
      ja: '高齢者の貢献と人権に敬意を表する日。',
      fa: 'روز بزرگداشت نقش و حقوق سالمندان.',
    },
  },
  {
    id: 'int-nonviolence-day', category: 'international', kind: 'gregorian-fixed',
    month: 10, day: 2, emoji: '✌️',
    names: { en: 'International Day of Non-Violence', ja: '国際非暴力デー', fa: 'روز جهانی عدم خشونت' },
    descriptions: {
      en: 'Marking Gandhi’s birthday and the universal message of non-violence.',
      ja: 'ガンジーの誕生日に非暴力の精神を広める日。',
      fa: 'سالروز تولد گاندی — روز گسترش پیام عدم خشونت.',
    },
  },
  {
    id: 'int-teachers-day', category: 'international', kind: 'gregorian-fixed',
    month: 10, day: 5, emoji: '🍎',
    names: { en: "World Teachers' Day", ja: '世界教師デー', fa: 'روز جهانی معلم' },
    descriptions: {
      en: 'Celebrating teachers and the transformation of education worldwide.',
      ja: '世界の教師と教育の変革を称える日。',
      fa: 'روز بزرگداشت معلمان و تحول آموزش.',
    },
  },
  {
    id: 'int-food-day', category: 'international', kind: 'gregorian-fixed',
    month: 10, day: 16, emoji: '🌾',
    names: { en: 'World Food Day', ja: '世界食料デー', fa: 'روز جهانی غذا' },
    descriptions: {
      en: 'Commemorating the founding of the FAO and promoting action against hunger.',
      ja: 'FAO設立を記念し、飢餓への取り組みを促す日。',
      fa: 'سالروز تأسیس فائو — روز اقدام علیه گرسنگی.',
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
    id: 'int-aids-day', category: 'international', kind: 'gregorian-fixed',
    month: 12, day: 1, emoji: '🎈',
    names: { en: 'World AIDS Day', ja: '世界エイズデー', fa: 'روز جهانی ایدز' },
    descriptions: {
      en: 'Uniting in the fight against HIV, remembering those lost and supporting those living with it.',
      ja: 'HIVとの闘いで団結し、亡くなった人々を偲ぶ日。',
      fa: 'روز همبستگی در مبارزه با ایدز و یادبود درگذشتگان.',
    },
  },
  {
    id: 'int-disabilities-day', category: 'international', kind: 'gregorian-fixed',
    month: 12, day: 3, emoji: '♿',
    names: { en: 'International Day of Persons with Disabilities', ja: '国際障害者デー', fa: 'روز جهانی معلولان' },
    descriptions: {
      en: 'Promoting the rights and well-being of persons with disabilities.',
      ja: '障害者の権利と福祉の促進を図る国際デー。',
      fa: 'روز ترویج حقوق و بهزیستی افراد دارای معلولیت.',
    },
  },
  {
    id: 'int-human-rights-day', category: 'international', kind: 'gregorian-fixed',
    month: 12, day: 10, emoji: '⚖️',
    names: { en: 'Human Rights Day', ja: '世界人権デー', fa: 'روز جهانی حقوق بشر' },
    descriptions: {
      en: 'Commemorating the adoption of the Universal Declaration of Human Rights in 1948.',
      ja: '1948年の世界人権宣言採択を記念する日。',
      fa: 'سالروز تصویب اعلامیه جهانی حقوق بشر (۱۹۴۸).',
    },
  },
  {
    id: 'int-migrants-day', category: 'international', kind: 'gregorian-fixed',
    month: 12, day: 18, emoji: '🧳',
    names: { en: 'International Migrants Day', ja: '国際移住者デー', fa: 'روز جهانی مهاجران' },
    descriptions: {
      en: 'Recognising the contributions of migrants and protecting their rights.',
      ja: '移民の貢献を認め、その権利を守る日。',
      fa: 'روز قدردانی از مشارکت مهاجران و دفاع از حقوقشان.',
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
];
