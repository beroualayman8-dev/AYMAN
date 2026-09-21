import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  GraduationCap,
  Calendar,
  Clock,
  Save,
  Moon,
  Sun,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { usePushNotification } from '../../context/PushNotificationContext.js';
import { api } from '../../services/api.js';

const BAC_STREAMS = [
  'علوم تجريبية',
  'رياضيات',
  'تقني رياضي',
  'تسيير واقتصاد',
  'آداب وفلسفة',
  'لغات أجنبية',
  'الفنون',
];

export const SettingsView: React.FC = () => {
  const { user, profile, updateProfile, theme, toggleTheme } = useAuth();
  const { soundEnabled, toggleSound, triggerMockPush } = usePushNotification();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bacStream, setBacStream] = useState(profile?.bacStream || 'علوم تجريبية');
  const [bacYear, setBacYear] = useState(profile?.bacYear || 2027);
  const [examDate, setExamDate] = useState(profile?.bacExamDate || '2027-06-08');
  const [dailyTargetHours, setDailyTargetHours] = useState(profile?.dailyTargetHours || 3.5);
  const [preferredStudyHours, setPreferredStudyHours] = useState(profile?.preferredStudyHours || 'المساء');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateProfile({
        name,
        email,
        bacStream,
        bacYear,
        bacExamDate: examDate,
        dailyTargetHours,
        preferredStudyHours,
      });
      setSuccessMsg('تم حفظ التعديلات بنجاح وتحديث خطتك الدراسية!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (
      !confirm(
        'تحذير: هل أنت متأكد من إعادة ضبط بيانات حسابك؟ سيتم إعادة تعيين المواد والمهام والجدول إلى الحالة الافتراضية.'
      )
    )
      return;
    try {
      await api.resetMyData();
      alert('تمت إعادة ضبط البيانات بنجاح. سيتم إعادة تحميل الصفحة.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'تعذر إعادة الضبط');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-right">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-['Cairo'] flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <span>الإعدادات والملف الشخصي</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة بيانات حسابك، شعبة وسنة البكالوريا، وتاريخ الامتحان المستهدف.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: البيانات الشخصية */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo'] pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>البيانات الشخصية</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الاسم الكامل
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-left dir-ltr"
              />
            </div>
          </div>
        </div>

        {/* Section 2: بيانات البكالوريا */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo'] pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>خطة البكالوريا والشعبة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                شعبة البكالوريا
              </label>
              <select
                value={bacStream}
                onChange={(e) => setBacStream(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              >
                {BAC_STREAMS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                دورة البكالوريا (السنة)
              </label>
              <select
                value={bacYear}
                onChange={(e) => setBacYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-medium"
              >
                <option value={2027}>2027</option>
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تاريخ امتحان البكالوريا
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">هدف ساعات المذاكرة اليومي:</span>
                <span className="font-mono text-blue-600">{dailyTargetHours} ساعات</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={dailyTargetHours}
                onChange={(e) => setDailyTargetHours(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                فترة المذاكرة المفضلة
              </label>
              <input
                type="text"
                value={preferredStudyHours}
                onChange={(e) => setPreferredStudyHours(e.target.value)}
                placeholder="مثال: المساء (18:00 - 22:00)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: المظهر والتفضيلات */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Cairo']">
              مظهر المنصة (الوضع الليلي / النهاري)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تبديل بين النمط الفاتح الهادئ والنمط الليلي المريح للعينين أثناء المذاكرة المتأخرة.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center gap-2"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>الوضع النهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span>الوضع الليلي</span>
              </>
            )}
          </button>
        </div>

        {/* Section 4: نظام التنبيهات المنبثقة لاقتراب موعد التسليم */}
        <div className="bg-[#0B152B] rounded-3xl border border-[#1C2F58] p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-900/50 border border-blue-500/30 text-blue-300 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-['Cairo'] flex items-center gap-2">
                  <span>تنبيهات المهام المنبثقة (In-App Push Mock)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                    نشط تلقائياً
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  تظهر بطاقة إشعار أنيقة في الزاوية العلوية عند اقتراب موعد تسليم التمارين أو تأخرها، مع إمكانية إنجاز المهمة أو تأجيلها فورياً.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleSound}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50'
                    : 'bg-[#122042] text-slate-400 border-[#1E3666] hover:text-slate-200'
                }`}
                title="تشغيل أو كتم نغمة التنبيه"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'نغمة التنبيه مفعلة' : 'النغمة صامتة'}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerMockPush()}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-950/50 transition-all flex items-center gap-1.5 cursor-pointer"
                title="إطلاق تنبيه منبثق تجريبي في الزاوية العلوية الآن"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>تجربة التنبيه الفوري 🔔</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#081126] border border-[#16274E] text-[11px] text-slate-300 flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>يقوم النظام بفحص مهام اليوم والمواعيد الحرجة تلقائياً كل 90 ثانية لضمان عدم فوات أي تمرين.</span>
            </span>
            <span className="text-blue-300 font-mono text-[10px]">دقة التوقيت: مباشر (Web Audio + Motion)</span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>إعادة ضبط الحساب والبيانات</span>
          </button>
        </div>
      </form>
    </div>
  );
};
