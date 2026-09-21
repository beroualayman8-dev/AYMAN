import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Play,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  TrendingUp,
  BookOpen,
  CalendarDays,
  Sparkles,
  Flame,
  ArrowLeft,
  ChevronLeft,
  AlertCircle,
  Timer,
  ChevronRight,
  Target,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { usePushNotification } from '../../context/PushNotificationContext.js';
import { api } from '../../services/api.js';
import type { DashboardSummary, Task, Subject } from '../../types.js';
import type { NavTab } from '../common/Sidebar.js';
import { CustomStudyProgramCard } from './CustomStudyProgramCard.js';
import { FUN_STICKERS, MOTIVATIONAL_QUOTES } from '../../data/motivationalQuotes.js';
import { ProductivityQuoteBanner } from '../common/ProductivityQuoteBanner.js';
import { ClassicalQuotesHorizontalBar } from '../common/ClassicalQuotesHorizontalBar.js';
import { QuranicVersesSection } from '../common/QuranicVersesSection.js';
import { SmallDigitalClock } from '../common/SmallDigitalClock.js';
import { AestheticStickersBar } from '../common/AestheticStickersBar.js';
import { DailyStudyGoalTracker } from './DailyStudyGoalTracker.js';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenNewTask: (subjectId?: string) => void;
  onOpenNewNote: () => void;
  onStartFocus: (subjectId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewTask,
  onOpenNewNote,
  onStartFocus,
}) => {
  const { user, profile } = useAuth();
  const { triggerMockPush } = usePushNotification();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل بيانات لوحة المتابعة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (task: Task) => {
    try {
      const nextStatus = task.status === 'مكتملة' ? 'لم تبدأ' : 'مكتملة';
      await api.updateTask(task.id, { status: nextStatus });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">جاري تجهيز لوحة المتابعة...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-12">
        <div className="inline-flex p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">تعذر تحميل لوحة المتابعة</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'يرجى التحقق من اتصالك وإعادة المحاولة'}</p>
        <button
          onClick={fetchDashboard}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const todayHoursDone = Math.round((data.todayStudyMinutes / 60) * 10) / 10;
  const targetPercent =
    data.dailyTargetHours > 0
      ? Math.min(100, Math.round((todayHoursDone / data.dailyTargetHours) * 100))
      : 0;

  // Sort tasks for "Today's Focus": priority 'عالية' first, then uncompleted first
  const priorityRank: Record<string, number> = { عالية: 3, متوسطة: 2, منخفضة: 1 };
  const sortedTodayTasks = [...data.todayTasks].sort((a, b) => {
    if (a.status !== 'مكتملة' && b.status === 'مكتملة') return -1;
    if (a.status === 'مكتملة' && b.status !== 'مكتملة') return 1;
    return (priorityRank[b.priority] || 1) - (priorityRank[a.priority] || 1);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-right">
      {/* Classical-Modern Horizontal Quotes Banner */}
      <ClassicalQuotesHorizontalBar />

      {/* Dedicated Quranic Verses Section (قبس من القرآن الكريم) */}
      <QuranicVersesSection />

      {/* Aesthetic Stickers Bar */}
      <AestheticStickersBar title="ملصقات الهمة والتفوق في البكالوريا 🏷️" showDesc={true} />

      {/* Top Greeting Header with Small Digital Clock */}
      <div className="bg-[#0B152B] p-6 sm:p-7 rounded-3xl border border-[#1C2F58] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Cairo'] tracking-tight flex items-center gap-2">
              <span>مرحباً، {user?.name || 'طالب البكالوريا'}</span>
              <span className="text-2xl animate-bounce">👋</span>
            </h1>
            {/* Small live digital clock */}
            <SmallDigitalClock className="shrink-0" />
          </div>
          <p className="text-sm sm:text-base font-bold text-blue-400 mt-1 flex items-center gap-2">
            <span>ماذا ستنجز اليوم نحو التميز؟ 🎯</span>
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-medium">
            <span className="bg-[#122144] px-2.5 py-0.5 rounded-md border border-[#213564] text-blue-300">
              شعبة {profile?.bacStream || 'العلوم'} 📚
            </span>
            <span>•</span>
            <span className="bg-[#122144] px-2.5 py-0.5 rounded-md border border-[#213564] text-amber-300 font-mono">
              دورة {profile?.bacYear || 2027} 🎓
            </span>
          </div>
        </div>

        {/* Calm Motivational Message */}
        {data.motivationalMessage && (
          <div className="max-w-md p-4 rounded-2xl bg-[#0E1C38] border border-[#1E3666] flex items-start gap-3 shadow-inner">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-blue-300 block mb-0.5">
                تذكير أكاديمي هادئ 🧘‍♂️
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                &quot;{data.motivationalMessage}&quot;
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Days remaining until BAC */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">باقي على البكالوريا</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                {data.daysRemainingUntilBac}
              </span>
              <span className="text-xs font-bold text-slate-400">يوم متبقي</span>
            </div>
            <span className="text-[11px] text-blue-400 block mt-1 font-['Tajawal'] font-medium">
              ينقص كل يوم كتذكير لعزيمتك ⏳
            </span>
          </div>
        </div>

        {/* Today's Study Target */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">هدف دراسة اليوم</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Timer className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {todayHoursDone}
              </span>
              <span className="text-xs text-slate-500">/ {data.dailyTargetHours} س</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${targetPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Completed Tasks Today */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">مهام اليوم المكتملة</span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {data.todayCompletedTasksCount}
              </span>
              <span className="text-xs text-slate-500">/ {data.todayTasksCount} مهمة</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              {data.todayTasksCount > 0
                ? `${Math.round((data.todayCompletedTasksCount / data.todayTasksCount) * 100)}% منجز`
                : 'أضف مهامك لتنظيم اليوم'}
            </span>
          </div>
        </div>

        {/* Current Study Streak */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">التتابع الأكاديمي</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {data.currentStreak}
              </span>
              <span className="text-xs font-bold text-slate-500">أيام متتالية</span>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 block mt-1">
              {data.currentStreak > 0 ? 'استمر في الحفاظ على وتيرتك!' : 'سجّل دراسة اليوم لبدء السلسلة'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Row & Motivational Stickers */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => onOpenNewTask()}
              className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مهمة</span>
            </button>

            <button
              onClick={() => onStartFocus()}
              className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>جلسة دراسة</span>
            </button>

            <button
              onClick={onOpenNewNote}
              className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/60 dark:border-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>ملاحظة</span>
            </button>

            <button
              onClick={() => onNavigate('schedule')}
              className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>جدول</span>
            </button>
          </div>
        </div>

        {/* Motivational Stickers Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <span>ملصقات الهمة 🏷️:</span>
          </span>
          {FUN_STICKERS.map((stk) => (
            <div
              key={stk.id}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-bold text-slate-300 shrink-0 shadow-xs hover:border-blue-500/50 transition-colors"
            >
              <span className="text-sm">{stk.emoji}</span>
              <span>{stk.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Study Goal Tracking Component with Visual Progress Ring */}
      <DailyStudyGoalTracker
        dailyTargetHours={data.dailyTargetHours}
        todayStudyMinutes={data.todayStudyMinutes}
        currentStreak={data.currentStreak}
        onStartFocus={onStartFocus}
        onRefresh={fetchDashboard}
      />

      {/* Custom Student-Defined Study Program */}
      <CustomStudyProgramCard onNavigateToSchedule={() => onNavigate('schedule')} />

      {/* Main Grid: Today's Focus & Upcoming Events / Week Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Right side (2 cols): Today's Focus (الأولويات والمهام) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Today's Focus (تركيز اليوم) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo']">
                  تركيز اليوم
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {data.todayTasks.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerMockPush()}
                  title="اختبار تنبيه منبثق (Push Notification) لاقتراب موعد المهمة"
                  className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">تجربة تنبيه</span>
                </button>
                <button
                  onClick={() => onOpenNewTask()}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>مهمة جديدة</span>
                </button>
              </div>
            </div>

            {sortedTodayTasks.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center mb-3">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  لم تضف أي مهمة بعد لليوم.
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  ابدأ بإضافة أهم تمرين أو درس ترغب في مراجعته اليوم.
                </p>
                <button
                  onClick={() => onOpenNewTask()}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مهمة الآن</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedTodayTasks.map((t) => {
                  const isDone = t.status === 'مكتملة';
                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isDone
                          ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800/60 opacity-75'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleTask(t)}
                          aria-label="تغيير حالة المهمة"
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50 dark:fill-emerald-950" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                isDone
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {t.title}
                            </span>
                            {t.subjectName && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white shrink-0"
                                style={{ backgroundColor: t.subjectColor || '#3B82F6' }}
                              >
                                {t.subjectName}
                              </span>
                            )}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                                t.priority === 'عالية'
                                  ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                                  : t.priority === 'متوسطة'
                                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>
                          {t.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {!isDone && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => triggerMockPush(t)}
                            title="تنبيه منبثق فوري لاقتراب موعد هذه المهمة (Push Mock)"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onStartFocus(t.subjectId)}
                            title="بدء مؤقت تركيز لهذه المهمة"
                            className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Subject Progress Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo']">
                  تقدم المواد الدراسية
                </h2>
              </div>
              <button
                onClick={() => onNavigate('subjects')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                <span>جميع المواد</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.subjectsSummary.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => onNavigate('subjects')}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {sub.name}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      معامل {sub.coefficient}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>التمارين: {sub.tasksCompleted} / {sub.tasksTotal}</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {sub.progressPercent}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${sub.progressPercent}%`,
                        backgroundColor: sub.color || '#2563EB',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left side (1 col): Weekly Progress + Upcoming Events */}
        <div className="space-y-6">
          {/* Weekly Activity Visualization */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-['Cairo'] flex items-center gap-1.5">
                    <span>جدول ساعات الدراسة في الأيام الـ 7 الأخيرة</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    تتبع دقيق لوقت الإنجاز اليومي ⏱️
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('progress')}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/40"
              >
                مؤشرات الجاهزية ←
              </button>
            </div>

            {/* Vertical Chart Visualization with generous height and small clock */}
            <div className="flex items-end justify-between gap-2.5 h-48 pt-4 px-2 bg-slate-50/50 dark:bg-[#070F22] rounded-2xl border border-slate-200/60 dark:border-[#132348] mb-4">
              {data.weekOverview.map((dayItem, idx) => {
                const hours = Math.round((dayItem.studiedMinutes / 60) * 10) / 10;
                // Max scale 6 hours
                const barHeight = Math.min(100, Math.max(6, (hours / 6) * 100));
                const isToday = idx === data.weekOverview.length - 1;

                return (
                  <div key={dayItem.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="flex items-center gap-0.5 text-[10px] font-mono text-slate-400 font-bold">
                      {hours > 0 ? (
                        <>
                          <Clock className="w-2.5 h-2.5 text-blue-400 inline" />
                          <span>{hours}س</span>
                        </>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800/80 rounded-xl h-32 flex items-end justify-center p-1 relative overflow-hidden">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${
                          isToday
                            ? 'bg-gradient-to-t from-blue-700 to-blue-500 shadow-md shadow-blue-500/20'
                            : hours > 0
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                            : 'bg-transparent'
                        }`}
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-[10px] font-medium leading-none ${
                          isToday ? 'font-black text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {dayItem.day}
                      </span>
                      {isToday && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono mt-0.5">
                          اليوم
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Structured Table: Daily study breakdown with small clock */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-300 block mb-2 font-['Tajawal']">
                تفاصيل الوقت المنجز بالأيام:
              </span>
              <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {data.weekOverview.slice().reverse().map((dayItem, idx) => {
                  const hours = Math.round((dayItem.studiedMinutes / 60) * 10) / 10;
                  const isToday = idx === 0;

                  return (
                    <div
                      key={dayItem.date}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-all ${
                        isToday
                          ? 'bg-blue-600/10 border-blue-500/30 text-white'
                          : 'bg-slate-50 dark:bg-[#0A1428] border-slate-200/50 dark:border-[#14264C] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-bold font-['Cairo'] text-slate-800 dark:text-slate-200">
                          {dayItem.day}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({dayItem.date})
                        </span>
                        {isToday && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold">
                            اليوم
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs">
                        <div className="flex items-center gap-1 text-blue-400 font-bold">
                          <span>{dayItem.studiedMinutes} دقيقة</span>
                          <span>({hours} ساعة)</span>
                        </div>
                        {dayItem.tasksCompleted > 0 && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded">
                            {dayItem.tasksCompleted} تمرين ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Academic Events */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white font-['Cairo']">
                  المواعيد والامتحانات القادمة
                </h3>
              </div>
              <button
                onClick={() => onNavigate('events')}
                className="text-[11px] text-blue-600 font-bold hover:underline"
              >
                الروزنامة
              </button>
            </div>

            {data.upcomingEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <p>لا توجد مواعيد قريبة مسجلة.</p>
                <button
                  onClick={() => onNavigate('events')}
                  className="mt-2 text-blue-600 font-bold hover:underline"
                >
                  إضافة موعد أو امتحان
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.upcomingEvents.map((evt) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const target = new Date(evt.date);
                  target.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={evt.id}
                      className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold inline-block mb-1">
                          {evt.type}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {evt.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                          {evt.date} {evt.time ? `• ${evt.time}` : ''}
                        </span>
                      </div>
                      <div className="text-left font-mono shrink-0">
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                          {diffDays === 0 ? 'اليوم' : diffDays === 1 ? 'غداً' : `باقي ${diffDays} يوم`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
