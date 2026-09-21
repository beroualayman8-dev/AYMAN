import React, { useState } from 'react';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  User,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface OnboardingModalProps {
  isOpen: boolean;
  onFinished: () => void;
}

const STREAMS = [
  { name: 'علوم تجريبية', icon: '🔬', desc: 'العلوم الطبيعية، الرياضيات، والفيزياء' },
  { name: 'رياضيات', icon: '📐', desc: 'الرياضيات المتقدمة، والفيزياء' },
  { name: 'تقني رياضي', icon: '⚙️', desc: 'هندسة ميكانيكية، كهربائية، مدنية، طرائق' },
  { name: 'تسيير واقتصاد', icon: '📊', desc: 'محاسبة، اقتصاد، مناجمنت، وقانون' },
  { name: 'آداب وفلسفة', icon: '📜', desc: 'الفلسفة، الأدب العربي، والتاريخ' },
  { name: 'لغات أجنبية', icon: '🌍', desc: 'لغات حية: فرنسية، إنجليزية، إسبانية/ألمانية' },
  { name: 'الفنون', icon: '🎨', desc: 'فنون تشكيلية، مسرح، موسيقى، وسمعي بصري' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onFinished }) => {
  const { user, profile, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);

  // The 4 requested fields
  const [name, setName] = useState(user?.name || '');
  const [selectedStream, setSelectedStream] = useState(profile?.bacStream || 'علوم تجريبية');
  const [selectedYear, setSelectedYear] = useState(profile?.bacYear || 2027);
  const [dailyHours, setDailyHours] = useState(profile?.dailyTargetHours || 3.5);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setSaving(true);
      try {
        await completeOnboarding({
          name: name.trim() || user?.name || 'طالب البكالوريا',
          bacStream: selectedStream,
          bacYear: selectedYear,
          dailyTargetHours: dailyHours,
          onboardingCompleted: true,
        });
        onFinished();
      } catch (e) {
        console.error('Failed to complete onboarding:', e);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-right relative overflow-hidden">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-8 bg-blue-600'
                    : i < step
                    ? 'w-4 bg-emerald-500'
                    : 'w-4 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-400">الخطوة {step} من 3</span>
        </div>

        {/* Step 1: الاسم وسنة البكالوريا */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center pb-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-3">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-['Cairo']">
                أهلاً بك في نجاح | NAJAH
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                &quot;نظّم عامك، افهم تقدمك، وقرّب نجاحك.&quot;
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>الاسم الكامل</span>
              </label>
              <input
                type="text"
                required
                placeholder="أدخل اسمك الكريم"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>سنة دورة البكالوريا المستهدفة</span>
              </label>
              <div className="grid grid-cols-3 gap-2 py-1">
                {[2027, 2026, 2025].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                      selectedYear === yr
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-[11px] text-slate-400 block mb-0.5">دورة</span>
                    <span className="text-lg font-black font-mono">{yr}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: شعبة البكالوريا */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Cairo'] flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>اختر شعبة البكالوريا</span>
              </h2>
              <p className="text-xs text-slate-500">
                سيتم إعداد المواد والمعاملات الرسمية تلقائياً وفق الشعبة المختارة.
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {STREAMS.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setSelectedStream(s.name)}
                  className={`w-full p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                    selectedStream === s.name
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{s.desc}</p>
                    </div>
                  </div>
                  {selectedStream === s.name && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: الهدف اليومي للدراسة */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Cairo'] flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>الهدف اليومي للدراسة</span>
              </h2>
              <p className="text-xs text-slate-500">
                حدد عدد الساعات الواقعي الذي تنوي الالتزام به يومياً.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-3">
              <span className="text-4xl font-black font-mono text-blue-600 dark:text-blue-400">
                {dailyHours} <span className="text-sm font-bold text-slate-500">ساعات يومياً</span>
              </span>

              <input
                type="range"
                min="1.5"
                max="8"
                step="0.5"
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full accent-blue-600"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>1.5 س</span>
                <span>4 س (موصى به)</span>
                <span>8 س</span>
              </div>
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center justify-center gap-2">
              {[2, 3.5, 4, 5, 6].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => setDailyHours(hrs)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    dailyHours === hrs
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600'
                  }`}
                >
                  {hrs}س
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-5 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            disabled={saving}
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
          >
            <span>{step === 3 ? (saving ? 'جاري الإعداد...' : 'بدء رحلة النجاح') : 'التالي'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
