import React, { useState } from 'react';
import {
  CheckCircle2,
  BookOpen,
  Calendar,
  Timer,
  TrendingUp,
  FileText,
  ShieldCheck,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  ChevronDown,
  Clock,
  Target,
  Flame,
  HelpCircle,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onExploreDemo: () => void;
}

const STREAMS_LIST = [
  { name: 'علوم تجريبية', icon: '🔬', coeff: 'علوم 6، رياضيات 5، فيزياء 5', desc: 'تركيز مكثف على العلوم الدقيقة والتجريبية' },
  { name: 'رياضيات', icon: '📐', coeff: 'رياضيات 7، فيزياء 6', desc: 'التعمق في التفكير الرياضي والفيزيائي' },
  { name: 'تقني رياضي', icon: '⚙️', coeff: 'تكنولوجيا 6، رياضيات 6، فيزياء 6', desc: 'الهندسة الميكانيكية، الكهربائية، المدنية، وطرائق' },
  { name: 'تسيير واقتصاد', icon: '📊', coeff: 'محاسبة 6، اقتصاد 5، رياضيات 5', desc: 'العلوم المالية، الاقتصادية، والقانونية' },
  { name: 'آداب وفلسفة', icon: '📜', coeff: 'فلسفة 6، لغة عربية 6', desc: 'الفكر الفلسفي، التحليل الأدبي، والتاريخ' },
  { name: 'لغات أجنبية', icon: '🌍', coeff: 'لغة ثالثة 5، فرنسية 4، إنجليزية 4', desc: 'إتقان اللغات الأجنبية والآداب العالمية' },
  { name: 'الفنون', icon: '🎨', coeff: 'مادة التخصص 6، رسم/موسيقى', desc: 'الفنون التشكيلية، المسرح، الموسيقى، والسمعي بصري' },
];

const FAQS = [
  {
    q: 'ما هي منصة نجاح | NAJAH؟',
    a: 'نجاح هي منصة ويب تعليمية متكاملة مصممة خصيصاً لطلبة شهادة البكالوريا في الجزائر، لمساعدتهم على تنظيم المواد، التمارين، جدول المراجعة الأسبوعي، ومتابعة ساعات دراستهم الفعلية بكل هدوء.',
  },
  {
    q: 'هل تدعم المنصة جميع شُعب البكالوريا الجزائرية؟',
    a: 'نعم، تدعم المنصة الشُعب السبع الرسمية المعتمدة في وزارة التربية الوطنية: علوم تجريبية، رياضيات، تقني رياضي، تسيير واقتصاد، آداب وفلسفة، لغات أجنبية، والفنون، مع مراعاة المعاملات الرسمية لكل مادة.',
  },
  {
    q: 'كيف يعمل مؤقت التركيز المدمج؟',
    a: 'يعتمد على تقنية بومودورو الأكاديمية (25 دقيقة تركيز + 5 دقائق استراحة) أو فترات مخصصة، ويقوم بتوثيق ساعات دراستك لكل مادة تلقائياً في قاعدة البيانات وحساب نسبة جاهزيتك.',
  },
  {
    q: 'هل بياناتي محفوظة دائماً؟',
    a: 'نعم، جميع مهامك، وملاحظاتك، وجدولك الأسبوعي، وإحصائيات جلساتك مخزنة ومعزولة تماماً في قاعدة بيانات حسابك الشخصي.',
  },
  {
    q: 'هل يمكنني تغيير تاريخ الامتحان وأهدافي اليومية؟',
    a: 'نعم، يمكنك من خلال صفحة الإعدادات تعديل تاريخ الامتحان لحساب الأيام المتبقية بدقة، وتحديد ساعات المذاكرة اليومية المستهدفة.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onExploreDemo }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white font-['IBM_Plex_Sans_Arabic',sans-serif]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-blue-900 flex items-center justify-center text-white font-bold text-xl shadow-xs">
              <span className="font-['Cairo']">ن</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['Cairo']">
                  نجاح
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono tracking-wider border border-blue-200/60 dark:border-blue-900/60">
                  NAJAH
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">بكالوريا الجزائر</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all"
            >
              ابدأ مجاناً
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 text-xs font-semibold mb-6">
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>منصة طلبة البكالوريا في الجزائر</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white font-['Cairo'] tracking-tight leading-[1.2] mb-6">
            نجاحك لا يحتاج إلى فوضى.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            منصة بسيطة تساعدك على تنظيم دراستك، متابعة تقدمك، وإدارة وقتك خلال رحلة البكالوريا.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>ابدأ مجاناً</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all"
            >
              اكتشف المنصة
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>مجاني لجميع الطلبة</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>جميع الشُعب الـ 7 معتمدة</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>حفظ دائم ومعزول للبيانات</span>
            </span>
          </div>
        </div>
      </section>

      {/* What NAJAH is */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-['Cairo'] mb-3">
              عن منصة نجاح | NAJAH
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              صُممت نجاح لتكون الأداة الأكاديمية الأولى لطالب البكالوريا الجزائري، مبنية على الهدوء، التركيز، وتجنب التشتت الرقمي.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-right">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 font-['Cairo']">
                تركيز على الأولويات والمعاملات
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                لكل شعبة موادها ومعاملاتها الأساسية. تساعدك نجاح على توجيه وقتك للمواد ذات الوزن الأكبر دون إهمال المواد الثانوية.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-right">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 font-['Cairo']">
                ساعات دراسة فعلية، لا وهمية
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                جلسات تركيز بومودورو توثق دقائق دراستك الحقيقية وتعطيك أرقاماً واضحة لتقدمك الأسبوعي والشهري.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-right">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 font-['Cairo']">
                خطة أسبوعية وروزنامة امتحانات
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                جدول أسبوعي منظم من السبت إلى الجمعة، مع تتبع مواعيد البكالوريا التجريبية والفروض الفصلية والعد التنازلي للباك.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-['Cairo'] mb-3">
              كل ما تحتاجه للباكالوريا، في مكان واحد
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              أدوات متكاملة تدعمك في كل مرحلة من السنة الدراسية.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo'] mb-1">
                نظام المواد والمعاملات
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                تحديد أهداف المراجعة بالساعات، حساب نسب الإنجاز، وربط المهام والملاحظات بكل مادة.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo'] mb-1">
                إدارة المهام والتمارين
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                تنظيم مهام اليوم، غداً، وهذا الأسبوع، مع إمكانية التأجيل وتحديد الأولويات وزمن الإنجاز.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-3">
                <Timer className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo'] mb-1">
                مؤقت التركيز الأكاديمي
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                فترات تركيز بومودورو (25، 45، 60 دقيقة) مع توثيق الملاحظات في قاعدة البيانات تلقائياً.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo'] mb-1">
                جدول المراجعة الأسبوعي
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                توزيع الحصص من السبت إلى الجمعة مع تحديد الأهداف والمواعيد ومتابعة إنجازها.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo'] mb-1">
                الملاحظات والملخصات
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                تدوين القوانين والمنهجيات وتثبيت الملاحظات المهمة مع إمكانية البحث والفلترة حسب المادة.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo'] mb-1">
                مؤشرات الجاهزية والتقدم
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                رسوم بيانية توضح توزيع ساعات الدراسة، نسبة إنجاز المهام، ومعدل الاستمرارية الأسبوعي.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works in 3 steps */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-['Cairo'] mb-2">
              كيف تعمل المنصة في 3 خطوات؟
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              انطلاقة سريعة بدون تعقيدات أو تضييع للوقت.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
            <div className="p-6 rounded-3xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center font-mono mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo'] mb-2">
                اختر شعبتك وهدفك
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                حدد شعبتك وسنة اجتياز البكالوريا، وسنقوم بتهيئة المواد والمعاملات وساعات الدراسة المستهدفة تلقائياً.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center font-mono mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo'] mb-2">
                نظّم حصصك ومهامك اليومية
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                ضع مهام المراجعة لليوم، وابدأ جلسات تركيز بومودورو بنقرة واحدة لتوثيق جهدك الحقيقي.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center font-mono mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo'] mb-2">
                راقب تقدمك وقرّب نجاحك
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                شاهد مؤشر جاهزيتك يرتفع يوماً بعد يوم، مع الحفاظ على سلسلة التتابع الدراسي حتى يوم الامتحان.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported BAC Streams */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-['Cairo'] mb-3">
              شُعب البكالوريا المدعومة رسمياً
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              معاملات دقيقة ومواد معدة مسبقاً وفق البرامج الرسمية لوزارة التربية الوطنية.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STREAMS_LIST.map((s) => (
              <div
                key={s.name}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{s.icon}</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo']">
                      {s.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{s.desc}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {s.coeff}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-['Cairo'] mb-2 flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span>الأسئلة الشائعة</span>
            </h2>
            <p className="text-xs text-slate-500">إجابات مباشرة على أكثر الأسئلة طرحاً من الطلبة.</p>
          </div>

          <div className="space-y-3 text-right">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-[#F8FAFC] dark:bg-slate-800/40"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-right flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/60 dark:border-slate-800">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 border-t border-slate-800 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-extrabold font-['Cairo'] text-sm">نجاح | NAJAH</span>
            <span className="text-[11px] text-slate-500">منصة مراجعة شهادة البكالوريا الجزائرية</span>
          </div>
          <p className="text-[11px] text-slate-500">
            &quot;نظّم عامك، افهم تقدمك، وقرّب نجاحك.&quot;
          </p>
        </div>
      </footer>
    </div>
  );
};
