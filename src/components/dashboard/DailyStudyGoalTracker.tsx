import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Target,
  Clock,
  Flame,
  Award,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import type { FocusSession } from '../../types.js';
import { api } from '../../services/api.js';

interface DailyStudyGoalTrackerProps {
  dailyTargetHours: number;
  todayStudyMinutes?: number;
  currentStreak?: number;
  onStartFocus?: (subjectId?: string) => void;
  onRefresh?: () => void;
}

export const DailyStudyGoalTracker: React.FC<DailyStudyGoalTrackerProps> = ({
  dailyTargetHours = 4,
  todayStudyMinutes: initialTodayMinutes = 0,
  currentStreak = 0,
  onStartFocus,
  onRefresh,
}) => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [computedTodayMinutes, setComputedTodayMinutes] = useState<number>(initialTodayMinutes);
  const [customGoal, setCustomGoal] = useState<number>(dailyTargetHours);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Load custom goal override if saved in local storage
  useEffect(() => {
    const savedGoal = localStorage.getItem('najahi_daily_target_hours');
    if (savedGoal) {
      const parsed = parseFloat(savedGoal);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 16) {
        setCustomGoal(parsed);
      }
    } else {
      setCustomGoal(dailyTargetHours);
    }
  }, [dailyTargetHours]);

  // Fetch today's focus session history
  useEffect(() => {
    let mounted = true;

    async function loadFocusHistory() {
      try {
        setLoadingHistory(true);
        const history = await api.getFocusHistory();
        if (!mounted) return;

        if (Array.isArray(history)) {
          setSessions(history);

          // Compute today's total studied minutes from focus history records
          const todayStr = new Date().toISOString().split('T')[0];
          const todaySessions = history.filter((s) => {
            const sessionDate = s.date || (s.completedAt ? s.completedAt.split('T')[0] : '');
            return sessionDate === todayStr;
          });

          const totalMins = todaySessions.reduce(
            (acc, curr) => acc + (Number(curr.durationMinutes) || 0),
            0
          );

          // Use the higher value between initial prop & actual computed sum
          setComputedTodayMinutes(Math.max(initialTodayMinutes, totalMins));
        }
      } catch (err) {
        console.error('Error fetching focus session history for goal tracker:', err);
        setComputedTodayMinutes(initialTodayMinutes);
      } finally {
        if (mounted) setLoadingHistory(false);
      }
    }

    loadFocusHistory();

    return () => {
      mounted = false;
    };
  }, [initialTodayMinutes]);

  // Calculations
  const targetHours = customGoal > 0 ? customGoal : 4;
  const targetMinutes = Math.round(targetHours * 60);
  const studiedMinutes = computedTodayMinutes;
  const studiedHours = Math.round((studiedMinutes / 60) * 10) / 10;
  const remainingMinutes = Math.max(0, targetMinutes - studiedMinutes);
  const remainingHours = Math.round((remainingMinutes / 60) * 10) / 10;
  const progressRatio = Math.min(1.5, studiedMinutes / (targetMinutes || 1));
  const progressPercent = Math.min(100, Math.round((studiedMinutes / (targetMinutes || 1)) * 100));
  const isGoalReached = studiedMinutes >= targetMinutes && targetMinutes > 0;

  // SVG Progress Ring Geometry
  const size = 168;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - Math.min(1, progressRatio) * circumference;

  // Filter today's sessions for breakdown list
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions
    .filter((s) => {
      const sDate = s.date || (s.completedAt ? s.completedAt.split('T')[0] : '');
      return sDate === todayStr;
    })
    .slice(0, 3); // top 3 recent sessions

  const handleSaveGoal = (newGoal: number) => {
    const val = Math.max(1, Math.min(14, newGoal));
    setCustomGoal(val);
    localStorage.setItem('najahi_daily_target_hours', String(val));
    setIsEditingGoal(false);
  };

  return (
    <div className="bg-[#0B152B] rounded-3xl border border-[#1C2F58] p-5 sm:p-6 shadow-md relative overflow-hidden transition-all hover:border-blue-500/40">
      {/* Subtle ambient light glow */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      {isGoalReached && (
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-[#1E3666]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white font-['Cairo'] flex items-center gap-2">
              <span>تتبع هدف المذاكرة اليومي</span>
              <span className="text-xs">🎯</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              متابعة دقيقة لساعات التركيز المحققة مقارنة بالهدف المطلوب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditingGoal ? (
            <div className="flex items-center gap-1.5 bg-[#122144] p-1 rounded-xl border border-[#213564]">
              <input
                type="number"
                min="1"
                max="14"
                step="0.5"
                value={customGoal}
                onChange={(e) => setCustomGoal(parseFloat(e.target.value) || 1)}
                className="w-14 bg-transparent text-center text-xs font-mono font-bold text-white outline-none"
              />
              <span className="text-[10px] text-slate-400">ساعة</span>
              <button
                onClick={() => handleSaveGoal(customGoal)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
              >
                حفظ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingGoal(true)}
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-[#122144] hover:bg-[#182c5c] px-2.5 py-1.5 rounded-xl border border-[#213564] transition-colors flex items-center gap-1 cursor-pointer"
              title="تعديل الهدف اليومي بالساعات"
            >
              <span>الهدف: {targetHours}س</span>
              <span className="text-[10px] text-slate-400">✏️</span>
            </button>
          )}

          {onStartFocus && (
            <button
              onClick={() => onStartFocus()}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="بدء جلسة تركيز جديدة الآن"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">بدء تركيز</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Visual Progress Ring & Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Visual Circular Progress Ring */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg
              width={size}
              height={size}
              className="transform -rotate-90 origin-center drop-shadow-md"
            >
              {/* Background Ring Track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#152445"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Dynamic Gradient Progress Stroke */}
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={isGoalReached ? 'url(#emeraldGoalGrad)' : 'url(#blueGoalGrad)'}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />

              {/* Definitions for Linear Gradients */}
              <defs>
                <linearGradient id="blueGoalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
                <linearGradient id="emeraldGoalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="50%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Ring Metric Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              <span className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
                <span>{progressPercent}</span>
                <span className="text-sm font-normal text-blue-400">%</span>
              </span>
              <span className="text-[11px] font-bold text-slate-300 font-mono mt-0.5">
                {studiedHours}س / {targetHours}س
              </span>

              {isGoalReached ? (
                <span className="mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>اكتمل الهدف! 🎉</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 mt-1">
                  باقي {remainingHours} ساعة
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>معدل الإنجاز اليومي لماراثون البكالوريا</span>
            </span>
          </div>
        </div>

        {/* Detailed Breakdown & Recent Focus Sessions */}
        <div className="md:col-span-7 space-y-3.5">
          {/* 3 Metric Cards in Pill Style */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            {/* Achieved */}
            <div className="p-3 rounded-2xl bg-[#0F1C38] border border-[#1E3666]">
              <span className="text-[10px] text-slate-400 block font-medium">ساعات منجزة</span>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-lg sm:text-xl font-black text-white font-mono">
                  {studiedHours}
                </span>
                <span className="text-[10px] text-blue-400 font-bold">س</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                ({studiedMinutes} دقيقة)
              </span>
            </div>

            {/* Target */}
            <div className="p-3 rounded-2xl bg-[#0F1C38] border border-[#1E3666]">
              <span className="text-[10px] text-slate-400 block font-medium">الهدف المطلوب</span>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-lg sm:text-xl font-black text-white font-mono">
                  {targetHours}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">س</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                ({targetMinutes} دقيقة)
              </span>
            </div>

            {/* Remaining / Extra */}
            <div className="p-3 rounded-2xl bg-[#0F1C38] border border-[#1E3666]">
              <span className="text-[10px] text-slate-400 block font-medium">
                {isGoalReached ? 'فائض إضافي' : 'المتبقي لليوم'}
              </span>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span
                  className={`text-lg sm:text-xl font-black font-mono ${
                    isGoalReached ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isGoalReached ? `+${(studiedHours - targetHours).toFixed(1)}` : remainingHours}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">س</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                {isGoalReached ? 'إنجاز ممتاز 🌟' : `(${remainingMinutes} دقيقة)`}
              </span>
            </div>
          </div>

          {/* Focus History Source Mini-feed */}
          <div className="rounded-2xl bg-[#081126] border border-[#16274E] p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>جلسات التركيز المسجلة اليوم ({todaySessions.length}):</span>
              </span>
              <span className="text-[10px] text-blue-400/80 font-mono">
                مستخرجة من سجل التركيز
              </span>
            </div>

            {todaySessions.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-1 text-center font-normal">
                لم تسجل جلسة تركيز بمؤقت البومودورو اليوم بعد. اضغط &quot;بدء تركيز&quot; لزيادة رصيدك!
              </p>
            ) : (
              <div className="space-y-1.5">
                {todaySessions.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-[#0E1B38] border border-[#1C2F58]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-white font-bold">{s.subjectName || 'جلسة تركيز'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {s.completedAt ? new Date(s.completedAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-blue-400 text-xs">
                      +{s.durationMinutes} دقيقة
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Motivational Status Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {currentStreak > 0
                  ? `التتابع الدراسي مستمر: ${currentStreak} أيام متتالية 🔥`
                  : 'أكمل ساعات اليوم للحفاظ على سلسلة التتابع!'}
              </span>
            </div>

            {isGoalReached ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>حققت الهدف اليومي! 🏅</span>
              </span>
            ) : (
              <span className="text-blue-300 font-mono">
                {Math.max(0, Math.ceil(remainingMinutes / 25))} جلسات بومودورو متبقية
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
