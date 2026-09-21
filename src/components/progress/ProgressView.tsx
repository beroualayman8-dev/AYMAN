import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  BarChart2,
  ShieldCheck,
  History,
  Target,
  CheckSquare,
} from 'lucide-react';
import { api } from '../../services/api.js';
import type { ProgressMetrics, FocusSession, Subject } from '../../types.js';
import { SubjectWeeklyTrendChart } from './SubjectWeeklyTrendChart.js';

export const ProgressView: React.FC = () => {
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [progressData, sessionsData, subjectsData] = await Promise.all([
          api.getProgress(),
          api.getFocusHistory().catch(() => []),
          api.getSubjects().catch(() => []),
        ]);
        setMetrics(progressData);
        setSessions(sessionsData);
        setSubjects(subjectsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate top subject by hours
  const sortedSubjectsByHours = [...metrics.subjectHoursBreakdown].sort((a, b) => b.hours - a.hours);
  const topSubject = sortedSubjectsByHours[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-['Cairo'] flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>مؤشرات التقدم والجاهزية للبكالوريا</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إحصائيات دراسية واقعية ودقيقة: ساعات الدراسة الفعلية، نسب إنجاز التمارين، وتوزيع الجهد حسب المواد.
          </p>
        </div>

        {/* Readiness Badge */}
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900 text-blue-900 dark:text-blue-200 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-mono font-black text-lg shadow-xs">
            {metrics.overallProgress}%
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">
              مؤشر الجاهزية الأكاديمية
            </span>
            <span className="text-xs font-bold">بناءً على التمارين وساعات المراجعة</span>
          </div>
        </div>
      </div>

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Study Hours */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">إجمالي ساعات الدراسة</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {metrics.totalStudyHours}
            </span>
            <span className="text-xs font-bold text-slate-500">ساعة</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">موثقة عبر جلسات التركيز</span>
        </div>

        {/* Task Completion Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">نسبة إنجاز المهام</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {metrics.taskCompletionRate}%
            </span>
            <span className="text-xs font-bold text-slate-500">
              ({metrics.completedTasks}/{metrics.totalTasks})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">تمارين ومسائل منجزة</span>
        </div>

        {/* Study Streak */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">سلسلة الالتزام</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {metrics.currentStreak}
            </span>
            <span className="text-xs font-bold text-slate-500">أيام متتالية</span>
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 block mt-1">
            {metrics.currentStreak > 0 ? 'استمرارية ممتازة' : 'ابدأ جلستك اليوم'}
          </span>
        </div>

        {/* Daily, Weekly, Monthly breakdown */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">ساعات الأسبوع والشهر</span>
            <BarChart2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="space-y-1 text-xs font-mono font-bold">
            <div className="flex justify-between">
              <span className="text-slate-400">هذا الأسبوع:</span>
              <span className="text-blue-600 dark:text-blue-400">{metrics.weeklyStudyHours || 0} س</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">هذا الشهر:</span>
              <span className="text-purple-600 dark:text-purple-400">{metrics.monthlyStudyHours || 0} س</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Subject Hours Evolution Line Chart */}
      <SubjectWeeklyTrendChart sessions={sessions} subjects={subjects} />

      {/* Grid: Subjects Breakdown & Weekly Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subjects breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo']">
                توزيع ساعات الدراسة والتقدم حسب المواد
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {metrics.subjectHoursBreakdown.map((sub, idx) => {
              const progressPct = sub.progressPercent ?? (sub.targetHours ? Math.min(100, Math.round((sub.hours / sub.targetHours) * 100)) : 0);
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {sub.subjectName}
                      </span>
                      {sub.coefficient && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-800 font-mono text-slate-500">
                          معامل {sub.coefficient}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="font-black text-slate-900 dark:text-white">
                        {sub.hours} {sub.targetHours ? `/ ${sub.targetHours}` : ''} س
                      </span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        ({progressPct}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%`, backgroundColor: sub.color }}
                    />
                  </div>

                  {/* Sub tasks count */}
                  {sub.tasksCount !== undefined && (
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                      <span>التمارين المنجزة: {sub.completedTasksCount || 0} من {sub.tasksCount}</span>
                      <span>ساعات موثقة</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Consistency & Recent Sessions (1 col) */}
        <div className="space-y-6">
          {/* Weekly consistency chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-['Cairo']">
                    ساعات الدراسة في الأيام الـ 7 الأخيرة
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">ساعة القياس اليومية</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200/60 dark:border-emerald-800/40">
                مؤشرات الجاهزية
              </span>
            </div>

            <div className="flex items-end justify-between gap-2.5 h-44 pt-3 px-1 mb-3">
              {metrics.weeklyConsistency.map((item) => {
                const maxHourScale = 6;
                const heightPercent = Math.min(100, Math.max(6, (item.hours / maxHourScale) * 100));

                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {item.hours > 0 ? `${item.hours}س` : '-'}
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800/90 rounded-xl h-28 flex items-end justify-center p-1">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${
                          item.hours > 0
                            ? 'bg-gradient-to-t from-blue-700 to-blue-500'
                            : 'bg-transparent'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 truncate">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Daily detail breakdown */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              {metrics.weeklyConsistency.map((item) => (
                <div key={item.day} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-['Cairo']">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{item.day}</span>
                  </div>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {item.hours > 0 ? `${item.hours} ساعة موثقة` : 'لم تسجل جلسة'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent study sessions */}
          {metrics.recentSessions && metrics.recentSessions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <History className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white font-['Cairo']">
                  سجل آخر جلسات التركيز
                </h3>
              </div>

              <div className="space-y-2">
                {metrics.recentSessions.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        جلسة {s.durationMinutes} دقيقة
                      </span>
                      {s.notes && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{s.notes}</p>}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{s.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
