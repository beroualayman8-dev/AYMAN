import React, { useState, useEffect, useRef } from 'react';
import {
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Coffee,
  Brain,
  History,
  Clock,
  Flame,
  Save,
  X,
} from 'lucide-react';
import { api } from '../../services/api.js';
import type { Subject, FocusSession } from '../../types.js';
import { ProductivityQuoteBanner } from '../common/ProductivityQuoteBanner.js';
import { AestheticStickersBar } from '../common/AestheticStickersBar.js';

interface FocusTimerViewProps {
  initialSubjectId?: string;
  onSessionComplete?: () => void;
}

type Mode = 'focus' | 'short_break' | 'long_break';

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({
  initialSubjectId,
  onSessionComplete,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');
  const [mode, setMode] = useState<Mode>('focus');
  const [customMinutes, setCustomMinutes] = useState(25);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Reflection modal
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [savingSession, setSavingSession] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState<{ duration: number; subId: string } | null>(null);

  // History list
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const [subs, history] = await Promise.all([api.getSubjects(), api.getFocusHistory()]);
        setSubjects(subs);
        setRecentSessions(history.slice(0, 5));
        if (subs.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subs[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubs();
  }, []);

  // Update selected subject if prop changes
  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId]);

  // Mode changes
  const switchMode = (newMode: Mode) => {
    setIsRunning(false);
    setIsPaused(false);
    setMode(newMode);
    if (newMode === 'focus') {
      setTimeLeft(customMinutes * 60);
    } else if (newMode === 'short_break') {
      setTimeLeft(5 * 60);
    } else if (newMode === 'long_break') {
      setTimeLeft(15 * 60);
    }
  };

  const setPresetDuration = (mins: number) => {
    setCustomMinutes(mins);
    if (mode === 'focus') {
      setIsRunning(false);
      setIsPaused(false);
      setTimeLeft(mins * 60);
    }
  };

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleTimerFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, customMinutes, selectedSubjectId]);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {}
  };

  const handleTimerFinished = () => {
    setIsRunning(false);
    setIsPaused(false);
    playChime();

    if (mode === 'focus') {
      setCompletedSessionData({
        duration: customMinutes,
        subId: selectedSubjectId,
      });
      setShowReflectionModal(true);
    } else {
      alert('انتهت فترة الاستراحة! هل أنت مستعد للعودة لجلسة التركيز التالية؟');
      switchMode('focus');
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    if (mode === 'focus') setTimeLeft(customMinutes * 60);
    else if (mode === 'short_break') setTimeLeft(5 * 60);
    else if (mode === 'long_break') setTimeLeft(15 * 60);
  };

  const handleSaveReflection = async () => {
    if (!completedSessionData) return;
    setSavingSession(true);
    try {
      const res = await api.logFocusSession({
        subjectId: completedSessionData.subId,
        durationMinutes: completedSessionData.duration,
        type: 'بومودورو',
        notes: sessionNotes.trim() || undefined,
      });
      setShowReflectionModal(false);
      setSessionNotes('');
      setRecentSessions((prev) => [res.session, ...prev.slice(0, 4)]);
      if (onSessionComplete) onSessionComplete();
      switchMode('short_break');
    } catch (err: any) {
      alert(err.message || 'تعذر حفظ جلسة التركيز');
    } finally {
      setSavingSession(false);
    }
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Circle percentage
  const totalModeSeconds =
    mode === 'focus' ? customMinutes * 60 : mode === 'short_break' ? 5 * 60 : 15 * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalModeSeconds - timeLeft) / totalModeSeconds) * 100));

  // Calculate today's total studied minutes from recent sessions
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStudiedMinutes = recentSessions
    .filter((s) => s.date === todayStr)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-right">
      {/* Productivity Quote Banner */}
      <ProductivityQuoteBanner defaultCategory="focus" />

      {/* Aesthetic Stickers Bar */}
      <AestheticStickersBar title="ملصقات شحذ الهمة والتركيز 🏷️" showDesc={false} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B152B] p-6 rounded-3xl border border-[#1C2F58] shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white font-['Cairo'] flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
              <TimerIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <span>مؤقت التركيز الأكاديمي (بومودورو) ⏳🧠</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            جلسات دراسة هادئة بدون مقاطعات مع توثيق دقائق دراستك الفعلية تلقائياً لكل مادة.
          </p>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer ${
            soundEnabled
              ? 'border-emerald-500/30 bg-emerald-950/60 text-emerald-300'
              : 'border-[#1C2F58] bg-[#070D1E] text-slate-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? 'صوت الجرس مفعّل 🔔' : 'صامت 🔕'}</span>
        </button>
      </div>

      {/* Main Timer Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
        {/* Mode selector pills */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold mb-8">
          <button
            onClick={() => switchMode('focus')}
            className={`px-5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              mode === 'focus'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>جلسة تركيز ({customMinutes}د)</span>
          </button>

          <button
            onClick={() => switchMode('short_break')}
            className={`px-5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              mode === 'short_break'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>استراحة قصيرة (5د)</span>
          </button>

          <button
            onClick={() => switchMode('long_break')}
            className={`px-5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              mode === 'long_break'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>استراحة طويلة (15د)</span>
          </button>
        </div>

        {/* Subject dropdown if in focus mode */}
        {mode === 'focus' && (
          <div className="w-full max-w-xs mb-6 text-center">
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
              المادة الدراسية قيد المراجعة:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={isRunning}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center focus:outline-hidden disabled:opacity-60"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (معامل {s.coefficient})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Timer Circle Display */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
          {/* SVG Progress Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="5"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`transition-all duration-500 ${
                mode === 'focus'
                  ? 'stroke-emerald-600'
                  : mode === 'short_break'
                  ? 'stroke-blue-600'
                  : 'stroke-purple-600'
              }`}
              strokeWidth="5"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Time text centered */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
              {formattedTime}
            </span>
            <span className="text-xs font-bold text-slate-400 mt-2">
              {isRunning
                ? 'جلسة نشطة • ركز الآن'
                : isPaused
                ? 'مؤقت متوقف'
                : 'جاهز للانطلاق'}
            </span>
            {currentSubject && mode === 'focus' && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white mt-1.5"
                style={{ backgroundColor: currentSubject.color }}
              >
                {currentSubject.name}
              </span>
            )}
          </div>
        </div>

        {/* Duration presets (if not running) */}
        {mode === 'focus' && !isRunning && !isPaused && (
          <div className="flex items-center gap-2 mt-4 text-xs font-bold">
            <span className="text-slate-400 text-[11px]">مدة الجلسة:</span>
            {[25, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPresetDuration(m)}
                className={`px-3 py-1 rounded-xl border transition-all font-mono ${
                  customMinutes === m
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600'
                }`}
              >
                {m}د
              </button>
            ))}
          </div>
        )}

        {/* Action Controls: بدء / إيقاف مؤقت / استئناف / إعادة ضبط */}
        <div className="flex items-center gap-3 mt-8">
          {!isRunning && !isPaused && (
            <button
              onClick={handleStart}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>بدء</span>
            </button>
          )}

          {isRunning && (
            <button
              onClick={handlePause}
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              <span>إيقاف مؤقت</span>
            </button>
          )}

          {isPaused && (
            <button
              onClick={handleResume}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>استئناف</span>
            </button>
          )}

          {(isRunning || isPaused || timeLeft < totalModeSeconds) && (
            <button
              onClick={handleReset}
              className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats & Recent Sessions History */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Today's Focus Overview */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white font-['Cairo']">
              ساعات التركيز المسجلة اليوم
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {Math.round((todayStudiedMinutes / 60) * 10) / 10}
            </span>
            <span className="text-xs font-bold text-slate-500">ساعة</span>
            <span className="text-xs text-slate-400 font-mono">({todayStudiedMinutes} دقيقة)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            يتم تحديث إحصائياتك وسلسلة التتابع الأكاديمي مباشرة بعد كل جلسة ناجحة.
          </p>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white font-['Cairo']">
              آخر الجلسات المنجزة
            </h3>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">لا توجد جلسات سابقة مسجلة اليوم.</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.slice(0, 3).map((s) => {
                const sub = subjects.find((sub) => sub.id === s.subjectId);
                return (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {sub?.name || 'جلسة عامة'}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 font-bold">
                      {s.durationMinutes} دقيقة
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reflection Modal after completing a session */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-right space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-black font-['Cairo']">
                  أحسنت! اكتملت جلسة التركيز 🎉
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReflectionModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              تم تسجيل <strong className="text-slate-900 dark:text-white font-mono">{customMinutes} دقيقة</strong> دراسة في مادة{' '}
              <strong className="text-blue-600">{currentSubject?.name || 'المادة المحددة'}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ما الذي أنجزته أو استخلصته من هذه الجلسة؟ (اختياري)
              </label>
              <textarea
                rows={3}
                placeholder="مثال: راجعت قانون نيوتن الثاني وحللت التمرين رقم 4..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                disabled={savingSession}
                onClick={handleSaveReflection}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتوثيق الجلسة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
