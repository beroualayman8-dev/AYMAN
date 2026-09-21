export interface MotivationalQuote {
  id: string;
  quote: string;
  author: string;
  badgeEmoji: string;
  tag: 'productivity' | 'calm' | 'focus' | 'grit';
}

export interface QuranicVerse {
  id: string;
  verse: string;
  surah: string;
  ayahNumber: number | string;
  theme: string;
}

export const QURANIC_VERSES: QuranicVerse[] = [
  {
    id: 'qv-1',
    verse: 'وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ ۝ وَأَنَّ سَعْيَهُ سَوْفَ يُرَىٰ',
    surah: 'سورة النجم',
    ayahNumber: '39-40',
    theme: 'اليقين بالجزاء والسعي',
  },
  {
    id: 'qv-2',
    verse: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    surah: 'سورة طه',
    ayahNumber: 114,
    theme: 'طلب البركة والتوفيق في العلم',
  },
  {
    id: 'qv-3',
    verse: 'إِنَّا لَا نُضِيعُ أَجْرَ مَنْ أَحْسَنَ عَمَلًا',
    surah: 'سورة الكهف',
    ayahNumber: 30,
    theme: 'إتقان العمل وحفظ الجهد',
  },
  {
    id: 'qv-4',
    verse: 'فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ',
    surah: 'سورة آل عمران',
    ayahNumber: 159,
    theme: 'العزيمة والتوكل الصادق',
  },
  {
    id: 'qv-5',
    verse: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    surah: 'سورة الشرح',
    ayahNumber: '5-6',
    theme: 'الفرج وتيسير كل صعب',
  },
  {
    id: 'qv-6',
    verse: 'رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي ۝ وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي',
    surah: 'سورة طه',
    ayahNumber: '25-27',
    theme: 'شرح الصدر وتيسير الفهم',
  },
  {
    id: 'qv-7',
    verse: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ',
    surah: 'سورة هود',
    ayahNumber: 88,
    theme: 'التوفيق من الله وحده',
  },
  {
    id: 'qv-8',
    verse: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ',
    surah: 'سورة المجادلة',
    ayahNumber: 11,
    theme: 'رفعة أهل العلم ومكانتهم',
  },
];

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: 'q-1',
    quote: 'خطوة صغيرة متزنة اليوم تصنع بهجتك وفرحة والديك يوم إعلان نتائج البكالوريا 🏆',
    author: 'الحكمة الأكاديمية',
    badgeEmoji: '🎯',
    tag: 'productivity',
  },
  {
    id: 'q-2',
    quote: 'لا تحتاج إلى ساعات خارقة ترهق ذهنك؛ نصف ساعة بتركيز عميق دون مشتتات تصنع فارق النقطتين ⚡',
    author: 'منهجية الامتياز',
    badgeEmoji: '💡',
    tag: 'focus',
  },
  {
    id: 'q-3',
    quote: 'كل فكرة مسألة تفهم عمقها اليوم هي علامة إضافية مضمونة في ورقة إجابتك الرسمية ✍️',
    author: 'فريق نجاح',
    badgeEmoji: '📚',
    tag: 'productivity',
  },
  {
    id: 'q-4',
    quote: 'الانضباط التراكمي الهادئ يعلو دائماً على فترات الحماس المتقطع.. الثبات سر العباقرة 🌟',
    author: 'توجيه أكاديمي',
    badgeEmoji: '🚀',
    tag: 'grit',
  },
  {
    id: 'q-5',
    quote: 'نظّم فتراتك بحسب ذروة طاقتك اليومية؛ أنت من يقود دفة وقتك بوعي وليس العكس 🕒',
    author: 'قاعدة ذهبية',
    badgeEmoji: '⏳',
    tag: 'calm',
  },
  {
    id: 'q-6',
    quote: 'الصعوبة التي تبذل جهداً لفك رموزها اليوم هي درعك الحصين أمام مفاجآت الامتحان الرسمي 🛡️',
    author: 'عزيمة البكالوريا',
    badgeEmoji: '🔥',
    tag: 'grit',
  },
  {
    id: 'q-7',
    quote: 'استمرارية التراكم المتتالي تدك جبال القلق، اجعل تركيزك محصوراً في الحصة التي بين يديك 🧘‍♂️',
    author: 'همة عالية',
    badgeEmoji: '✨',
    tag: 'calm',
  },
  {
    id: 'q-8',
    quote: 'معدل الامتياز لا يطلب معجزة مفاجئة، بل تدريباً متواصلاً وتدقيقاً شجاعاً في تصحيح الأخطاء 🎯',
    author: 'أسرار المتفوقين',
    badgeEmoji: '🥇',
    tag: 'productivity',
  },
  {
    id: 'q-9',
    quote: 'أغلق شاشات المشتتات خلال جلسة التركيز، لتكتشف صفاء ذهنك وقدرتك على استيعاب أصعب الدروس 📵',
    author: 'قانون التركيز العميق',
    badgeEmoji: '🧠',
    tag: 'focus',
  },
  {
    id: 'q-10',
    quote: 'تعب السهر والمراجعة يتبدد بلمحة بصر فور سماع زغاريد الفرح ورؤية علامة النجاح 🎓',
    author: 'حلم البكالوريا',
    badgeEmoji: '🌙',
    tag: 'grit',
  },
];

export interface AestheticSticker {
  id: string;
  emoji: string;
  label: string;
  desc?: string;
  badgeColor?: string;
}

export const FUN_STICKERS: AestheticSticker[] = [
  { id: 'stk-1', emoji: '🎓', label: 'طريق 18 في الباك', desc: 'هدف واضح لا تراجع عنه' },
  { id: 'stk-2', emoji: '⚡', label: 'تركيز عميق 100%', desc: 'بدون مشتتات أو هواتف' },
  { id: 'stk-3', emoji: '🧠', label: 'عقلية المتفوقين', desc: 'فهم عميق وتحليل هادئ' },
  { id: 'stk-4', emoji: '🔥', label: 'همة لا تنطفئ', desc: 'انضباط واستمرار يومي' },
  { id: 'stk-5', emoji: '📚', label: 'حل بكالوريا سابقة', desc: 'تمارين مع الحل النموذجي' },
  { id: 'stk-6', emoji: '🌙', label: 'أزرق ليلي هادئ', desc: 'مذاكرة ليلية صافية' },
  { id: 'stk-7', emoji: '🏆', label: 'طبيب / مهندس الغد', desc: 'المستقبل يبدأ اليوم' },
  { id: 'stk-8', emoji: '✍️', label: 'مسألة وانفكت عقدتها', desc: 'كل فكرة تزيدك ثقة' },
  { id: 'stk-9', emoji: '☕', label: 'استراحة محارب', desc: 'راحة قصيرة ثم استئناف' },
  { id: 'stk-10', emoji: '⭐', label: 'امتياز واستحقاق', desc: 'جهدك لن يضيع أبداً' },
];
