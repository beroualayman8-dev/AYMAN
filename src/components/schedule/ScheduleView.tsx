import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  X,
  Sparkles,
  BookOpen,
  Play,
  CalendarDays,
  Target,
  Flame,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { api } from '../../services/api.js';
import type { ScheduleItem, Subject, Priority } from '../../types.js';
import { FUN_STICKERS } from '../../data/motivationalQuotes.js';
import { ProductivityQuoteBanner } from '../common/ProductivityQuoteBanner.js';
import { AestheticStickersBar } from '../common/AestheticStickersBar.js';

const DAYS_OF_WEEK = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

interface ScheduleViewProps {
  onStartFocusWithSubject?: (subjectId: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onStartFocusWithSubject }) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('السبت');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('weekly');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [day, setDay] = useState('السبت');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<Priority>('عالية');
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedRes, subsRes] = await Promise.all([api.getSchedule(), api.getSubjects()]);
      setSchedule(schedRes);
      setSubjects(subsRes);
      if (subsRes.length > 0 && !subjectId) {
        setSubjectId(subsRes[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleCompleted = async (item: ScheduleItem) => {
    try {
      const updated = await api.updateScheduleItem(item.id, { completed: !item.completed });
      setSchedule((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('حذف هذه الحصة من جدول المذاكرة؟')) return;
    try {
      await api.deleteScheduleItem(id);
      setSchedule((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;
    try {
      setIsSubmitting(true);
      const created = await api.createScheduleItem({
        day,
        subjectId,
        startTime,
        endTime,
        priority,
        goal: goal.trim() || undefined,
        completed: false,
      });
      setSchedule((prev) => [...prev, created]);
      setShowAddModal(false);
      setGoal('');
    } catch (err: any) {
      alert(err.message || 'تعذر إضافة الحصة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to calculate total planned hours
  const calculateTotalPlannedHours = () => {
    let totalMinutes = 0;
    schedule.forEach((item) => {
      const [sH, sM] = item.startTime.split(':').map(Number);
      const [eH, eM] = item.endTime.split(':').map(Number);
      const diff = (eH * 60 + eM) - (sH * 60 + sM);
      if (diff > 0) totalMinutes += diff;
    });
    return Math.round((totalMinutes / 60) * 10) / 10;
  };

  const priorityOrder: Record<string, number> = { عالية: 3, متوسطة: 2, منخفضة: 1 };

  const selectedDayItems = schedule
    .filter((s) => s.day === selectedDay)
    .filter((s) => priorityFilter === 'all' || (s.priority || 'متوسطة') === priorityFilter)
    .sort((a, b) => {
      // Prioritize high priority first, then by startTime
      const pDiff = (priorityOrder[b.priority || 'متوسطة'] || 2) - (priorityOrder[a.priority || 'متوسطة'] || 2);
      if (pDiff !== 0) return pDiff;
      return a.startTime.localeCompare(b.startTime);
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-right">
      {/* Productivity Quote Banner */}
      <ProductivityQuoteBanner defaultCategory="grit" />

      {/* Aesthetic Stickers Bar */}
      <AestheticStickersBar title="ملصقات تنظيم الوقت والجدول الأسبوعي 🏷️" showDesc={false} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B152B] p-6 rounded-3xl border border-[#1C2F58] shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white font-['Cairo'] flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-900/50 border border-blue-500/30 text-blue-300 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
            </div>
            <span>جدول المراجعة الأسبوعي للبكالوريا 📅🎯</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            خطط لحصص المذاكرة اليومية من السبت إلى الجمعة مع تحديد الأولويات، تأكيد الحصص، ومتابعة الإنجاز.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-[#070D1E] border border-[#1C2F58] text-xs font-bold text-blue-300 flex items-center gap-1.5 font-mono shadow-xs">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{calculateTotalPlannedHours()} س مخطط أسبوعياً ⏳</span>
          </div>

          <button
            onClick={() => {
              setDay(selectedDay);
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold shadow-md shadow-blue-950/50 transition-colors flex items-center gap-1.5 border border-blue-400/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حصة ✍️</span>
          </button>
        </div>
      </div>

      {/* Days Tabs (Saturday to Friday) */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-xs font-bold text-center">
          {DAYS_OF_WEEK.map((d) => {
            const dayItems = schedule.filter((s) => s.day === d);
            const isSelected = selectedDay === d;

            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`py-3 px-1 sm:px-3 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="truncate w-full">{d}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : dayItems.length > 0
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {dayItems.length} {dayItems.length === 1 ? 'حصة' : 'حصص'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Sessions List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo']">
              حصص يوم {selectedDay}
            </h2>
            <span className="text-xs font-mono text-slate-400">({selectedDayItems.length} حصة)</span>
          </div>

          {/* Priority filter pills & Add Session */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
              <span className="text-[11px] text-slate-400 px-1">الأولوية:</span>
              {(['all', 'عالية', 'متوسطة', 'منخفضة'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] transition-all ${
                    priorityFilter === p
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p === 'all' ? 'الكل' : p}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setDay(selectedDay);
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حصة لـ {selectedDay}</span>
            </button>
          </div>
        </div>

        {selectedDayItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              لا توجد حصص مراجعة مجدولة ليوم {selectedDay} {priorityFilter !== 'all' && `بأولوية "${priorityFilter}"`}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              خصص فترات دراسية واضحة وحدد أولوية كل مادة لتنظيم أسبوعك بأعلى فعالية.
            </p>
            <button
              onClick={() => {
                setDay(selectedDay);
                setShowAddModal(true);
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حصة الآن</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayItems.map((item) => {
              const sub = subjects.find((s) => s.id === item.subjectId);
              const isHigh = item.priority === 'عالية';
              const isMedium = item.priority === 'متوسطة';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.completed
                      ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800 opacity-75'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Completion checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(item)}
                      className="mt-1 sm:mt-0 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Time slot pill */}
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold shrink-0 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.startTime} - {item.endTime}</span>
                    </div>

                    {/* Subject badge, Priority & goal */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {sub && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white shrink-0"
                            style={{ backgroundColor: sub.color }}
                          >
                            {sub.name} (معامل {sub.coefficient})
                          </span>
                        )}

                        {/* Priority Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                            isHigh
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : isMedium
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}
                        >
                          أولوية: {item.priority || 'متوسطة'}
                        </span>

                        {item.completed && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                            تمت الحصة بنجاح ✅
                          </span>
                        )}
                      </div>

                      {item.goal && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          الهدف: {item.goal}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {sub && onStartFocusWithSubject && (
                      <button
                        type="button"
                        onClick={() => onStartFocusWithSubject(sub.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>بدء التركيز</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <form
            onSubmit={handleAddItem}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-right space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Cairo'] flex items-center gap-2">
                <span>إضافة حصة مذاكرة أسبوعية</span>
                <span className="text-xs font-normal text-slate-400">📅</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اليوم المستهدف
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-hidden"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                المادة الدراسية
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-hidden"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (معامل {s.coefficient})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selector for the session */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                أولوية الحصة في الأسبوع
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['عالية', 'متوسطة', 'منخفضة'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      priority === p
                        ? p === 'عالية'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                          : p === 'متوسطة'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-700 text-white border-slate-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p === 'عالية' && '🔥 '}
                    {p === 'متوسطة' && '⚡ '}
                    {p === 'منخفضة' && '🌱 '}
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  من الساعة
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  إلى الساعة
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                هدف الحصة (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثال: حل موضوعين بكالوريا، حفظ درس التاريخ..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التأكيد...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد إضافة الحصة 🎯</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
