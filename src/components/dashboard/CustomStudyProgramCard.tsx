import React, { useState, useEffect } from 'react';
import {
  Clock,
  Compass,
  Sparkles,
  Save,
  CheckCircle2,
  Sliders,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

interface CustomStudyProgramCardProps {
  onNavigateToSchedule?: () => void;
}

export const CustomStudyProgramCard: React.FC<CustomStudyProgramCardProps> = ({
  onNavigateToSchedule,
}) => {
  const { user, profile, refreshUser } = useAuth();

  const [dailyHours, setDailyHours] = useState<number>(profile?.dailyTargetHours || 4);
  const [preferredPace, setPreferredPace] = useState<'morning' | 'afternoon' | 'evening' | 'night'>(
    'evening'
  );
  const [studyStyle, setStudyStyle] = useState<string>('جلسات مركزة 45 دقيقة مع فترات راحة قصيرة');
  const [weeklyFocus, setWeeklyFocus] = useState<string>('التركيز على المواد الأساسية ذات المعاملات العالية');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile?.dailyTargetHours) {
      setDailyHours(profile.dailyTargetHours);
    }
    const savedPace = localStorage.getItem('najah_study_pace') as any;
    if (savedPace) setPreferredPace(savedPace);
    const savedStyle = localStorage.getItem('najah_study_style');
    if (savedStyle) setStudyStyle(savedStyle);
    const savedFocus = localStorage.getItem('najah_weekly_focus');
    if (savedFocus) setWeeklyFocus(savedFocus);
  }, [profile]);

  const handleSaveProgram = async () => {
    try {
      setIsSaving(true);
      await api.updateProfile({
        dailyTargetHours: dailyHours,
      });
      localStorage.setItem('najah_study_pace', preferredPace);
      localStorage.setItem('najah_study_style', studyStyle);
      localStorage.setItem('najah_weekly_focus', weeklyFocus);
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving program:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const paces = [
    { id: 'morning', label: 'صباحي باكر 🌅', desc: '05:30 - 08:00 (صفاء ذهني وحفظ)' },
    { id: 'afternoon', label: 'بعد الظهر ☀️', desc: '14:00 - 17:00 (حل مسائل وتطبيقات)' },
    { id: 'evening', label: 'مسائي 🌆', desc: '18:00 - 21:30 (مذاكرة مكثفة ومراجعة)' },
    { id: 'night', label: 'ليلي هادئ 🌙', desc: '21:30 - 00:30 (هدوء وسكون تام)' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs relative overflow-hidden">
      {/* Decorative sticker */}
      <div className="absolute top-4 left-4 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-[11px] font-bold text-blue-400">
        <span>🧭</span>
        <span>برنامجي الحر والمتوازن</span>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-['Cairo']">
            برنامج المذاكرة المخصص (تحكم كامل بجدولك)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            أنت من يحدد طاقته وساعات مذاكرته بدون قيود مسبقة، لتلائم نمط حياتك والتزاماتك.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Step 1: Hours Slider */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>هدفي اليومي من الساعات</span>
            </span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              {dailyHours} ساعات
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={dailyHours}
            onChange={(e) => setDailyHours(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>1 س (مرن خفيف)</span>
            <span>5 س (متوسط)</span>
            <span>10 س (مكثف حر)</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            اختر ما يناسب استيعابك الحقيقي، نصف ساعة منتظمة أفضل من ساعات تشتت.
          </p>
        </div>

        {/* Step 2: Preferred Time of Day */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>فترتي الإنتاجية المفضلة</span>
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            {paces.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreferredPace(p.id as any)}
                className={`p-2 rounded-xl text-right transition-all border text-xs ${
                  preferredPace === p.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <div className="font-bold text-[11px]">{p.label}</div>
                <div className="text-[9px] opacity-75 truncate">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Weekly Goal & Style */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>أولويتي واستراتيجيتي لهذا الأسبوع</span>
          </span>

          <input
            type="text"
            value={weeklyFocus}
            onChange={(e) => setWeeklyFocus(e.target.value)}
            placeholder="مثال: إنهاء متتاليات الرياضيات وحفظ وحدتين تاريخ"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
          />

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSaveProgram}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم حفظ برنامجي بنجاح! ✨</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>تأكيد واعتماد البرنامج 🎯</span>
                </>
              )}
            </button>

            {onNavigateToSchedule && (
              <button
                type="button"
                onClick={onNavigateToSchedule}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>الجدول الأسبوعي</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
