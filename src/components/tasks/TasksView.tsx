import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Trash2,
  Edit2,
  X,
  Filter,
  BookOpen,
  Sparkles,
  Hourglass,
  Search,
  ArrowUpDown,
  RotateCcw,
  Volume2,
  VolumeX,
  Award,
  CalendarDays,
  Flame,
  ChevronDown,
  Bell,
  BellRing,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { usePushNotification } from '../../context/PushNotificationContext.js';
import { api } from '../../services/api.js';
import type { Task, Subject, Priority, TaskStatus } from '../../types.js';
import { AestheticStickersBar } from '../common/AestheticStickersBar.js';
import { ProductivityQuoteBanner } from '../common/ProductivityQuoteBanner.js';

interface TasksViewProps {
  initialSubjectId?: string;
}

type TabFilter = 'today' | 'tomorrow' | 'this_week' | 'overdue' | 'completed' | 'all';
type SortOption = 'date' | 'priority' | 'duration' | 'subject';

export const TasksView: React.FC<TasksViewProps> = ({ initialSubjectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { triggerMockPush } = usePushNotification();

  // Filters state
  const [activeTab, setActiveTab] = useState<TabFilter>('today');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(initialSubjectId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('najah_task_sound') !== 'false';
  });

  // Interactivity feedback state
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [recentCompletedNotification, setRecentCompletedNotification] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const notificationTimeoutRef = useRef<any>(null);

  // Modal for new/edit task
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubjectId, setTaskSubjectId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskTime, setTaskTime] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('متوسطة');
  const [taskDuration, setTaskDuration] = useState<number>(45);
  const [taskDescription, setTaskDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, subjectsRes] = await Promise.all([api.getTasks(), api.getSubjects()]);
      setTasks(tasksRes);
      setSubjects(subjectsRes);

      // Pre-select subject if valid
      if (initialSubjectId && subjectsRes.some((s) => s.id === initialSubjectId)) {
        setSelectedSubjectFilter(initialSubjectId);
        setTaskSubjectId(initialSubjectId);
      } else if (subjectsRes.length > 0 && !taskSubjectId) {
        setTaskSubjectId(subjectsRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load tasks or subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialSubjectId]);

  // Handle sound setting change
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('najah_task_sound', String(next));
  };

  // Play gentle harmonious audio chime on completion
  const playCalmingChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1 (C5 - 523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.09, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.36);

      // Note 2 (E5 - 659.25 Hz, slightly delayed for a soothing chord chime)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.08);
      gain2.gain.setValueAtTime(0.09, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.52);
    } catch (e) {
      // Audio context may be restricted by browser until user gesture
    }
  };

  // Dates helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

  // Open Create Modal
  const handleOpenCreateModal = (defaultSubId?: string) => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
    setTaskTime('');
    setTaskPriority('متوسطة');
    setTaskDuration(45);
    setTaskDescription('');
    setFormError(null);

    const targetSubId = defaultSubId || (selectedSubjectFilter !== 'all' ? selectedSubjectFilter : subjects[0]?.id || '');
    setTaskSubjectId(targetSubId);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (t: Task) => {
    setEditingTaskId(t.id);
    setTaskTitle(t.title);
    setTaskSubjectId(t.subjectId);
    setTaskDueDate(t.dueDate || t.date || todayStr);
    setTaskTime(t.time || '');
    setTaskPriority(t.priority);
    setTaskDuration(t.estimatedMinutes || t.estimatedDurationMins || 45);
    setTaskDescription(t.description || '');
    setFormError(null);
    setShowModal(true);
  };

  // Save (Create or Update) Task
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!taskTitle.trim()) {
      setFormError('يرجى كتابة عنوان للمهمة أو التمرين');
      return;
    }

    if (!taskSubjectId) {
      setFormError('يرجى ربط المهمة بمادة دراسية من قائمة موادك');
      return;
    }

    const matchedSubject = subjects.find((s) => s.id === taskSubjectId);
    if (!matchedSubject) {
      setFormError('المادة المختارة غير موجودة في قاعدة بياناتك. يرجى اختيار مادة صالحة.');
      return;
    }

    setSavingTask(true);
    try {
      if (editingTaskId) {
        const updated = await api.updateTask(editingTaskId, {
          title: taskTitle.trim(),
          subjectId: taskSubjectId,
          dueDate: taskDueDate,
          time: taskTime || undefined,
          priority: taskPriority,
          estimatedMinutes: taskDuration,
          description: taskDescription || undefined,
        });
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await api.createTask({
          title: taskTitle.trim(),
          subjectId: taskSubjectId,
          dueDate: taskDueDate,
          time: taskTime || undefined,
          priority: taskPriority,
          estimatedMinutes: taskDuration,
          status: 'لم تبدأ',
          description: taskDescription || undefined,
        });
        setTasks((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ المهمة');
    } finally {
      setSavingTask(false);
    }
  };

  // Toggle Task Status with enhanced calming visual feedback
  const handleToggleStatus = async (task: Task) => {
    const isNowCompleting = task.status !== 'مكتملة';
    const nextStatus: TaskStatus = isNowCompleting ? 'مكتملة' : 'لم تبدأ';

    if (isNowCompleting) {
      // 1. Trigger calming highlight pulse
      setCompletingTaskId(task.id);
      setTimeout(() => {
        setCompletingTaskId((curr) => (curr === task.id ? null : curr));
      }, 1400);

      // 2. Play soft audio chime
      playCalmingChime();

      // 3. Trigger soft subtle confetti
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10B981', '#3B82F6', '#6366F1', '#F59E0B'],
          disableForReducedMotion: true,
        });
      } catch (e) {
        // Confetti optional
      }

      // 4. Show friendly celebratory notification with Undo
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      setRecentCompletedNotification({ id: task.id, title: task.title });
      notificationTimeoutRef.current = setTimeout(() => {
        setRecentCompletedNotification(null);
      }, 4500);
    } else {
      // If uncompleting, clear notification if matching
      if (recentCompletedNotification?.id === task.id) {
        setRecentCompletedNotification(null);
      }
    }

    try {
      const updated = await api.updateTask(task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Undo recent completion
  const handleUndoRecentCompletion = async () => {
    if (!recentCompletedNotification) return;
    const taskId = recentCompletedNotification.id;
    setRecentCompletedNotification(null);
    try {
      const updated = await api.updateTask(taskId, { status: 'لم تبدأ' });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error('Failed to undo completion:', err);
    }
  };

  // Postpone task days
  const handlePostponeDays = async (task: Task, daysToAdd: number) => {
    try {
      const current = task.dueDate ? new Date(task.dueDate) : new Date();
      current.setDate(current.getDate() + daysToAdd);
      const nextDateStr = current.toISOString().split('T')[0];
      const updated = await api.updateTask(task.id, { dueDate: nextDateStr });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error('Failed to postpone task:', err);
    }
  };

  // Reschedule all overdue tasks to today
  const handleRescheduleAllOverdueToToday = async () => {
    const overdueTasks = tasks.filter((t) => {
      const d = t.dueDate || t.date || '';
      return d !== '' && d < todayStr && t.status !== 'مكتملة';
    });

    if (overdueTasks.length === 0) return;
    if (!confirm(`هل تريد ترحيل جميع المهام المتأخرة (${overdueTasks.length} مهام) إلى تاريخ اليوم؟`)) return;

    setBulkActionLoading(true);
    try {
      const updatedList = await Promise.all(
        overdueTasks.map((t) => api.updateTask(t.id, { dueDate: todayStr }))
      );

      const updatedMap = new Map(updatedList.map((u) => [u.id, u]));
      setTasks((prev) => prev.map((t) => (updatedMap.has(t.id) ? updatedMap.get(t.id)! : t)));
      setActiveTab('today');
    } catch (err) {
      console.error('Failed to reschedule overdue tasks:', err);
      alert('تعذر ترحيل بعض المهام المتأخرة');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) return;
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (recentCompletedNotification?.id === id) {
        setRecentCompletedNotification(null);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Filtering & Sorting computations
  const { filteredTasks, counts, todayStats } = useMemo(() => {
    let todayCount = 0;
    let todayDoneCount = 0;
    let tomorrowCount = 0;
    let weekCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    tasks.forEach((t) => {
      const d = t.dueDate || t.date || '';
      const isDone = t.status === 'مكتملة';

      if (d === todayStr) {
        todayCount++;
        if (isDone) todayDoneCount++;
      }
      if (d === tomorrowStr) {
        tomorrowCount++;
      }
      if (d >= todayStr && d <= endOfWeekStr) {
        weekCount++;
      }
      if (d !== '' && d < todayStr && !isDone) {
        overdueCount++;
      }
      if (isDone) {
        completedCount++;
      }
    });

    // Filter tasks
    let result = tasks.filter((task) => {
      const d = task.dueDate || task.date || '';

      // Tab filter
      if (activeTab === 'today' && d !== todayStr) return false;
      if (activeTab === 'tomorrow' && d !== tomorrowStr) return false;
      if (activeTab === 'this_week' && !(d >= todayStr && d <= endOfWeekStr)) return false;
      if (activeTab === 'overdue' && !(d !== '' && d < todayStr && task.status !== 'مكتملة')) return false;
      if (activeTab === 'completed' && task.status !== 'مكتملة') return false;

      // Subject filter
      if (selectedSubjectFilter !== 'all' && task.subjectId !== selectedSubjectFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query) || false;
        const matchesSubject = task.subjectName?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesDesc && !matchesSubject) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    const priorityWeight: Record<Priority, number> = {
      عالية: 3,
      متوسطة: 2,
      منخفضة: 1,
    };

    result = result.sort((a, b) => {
      if (sortBy === 'priority') {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      if (sortBy === 'duration') {
        const durA = a.estimatedMinutes || a.estimatedDurationMins || 0;
        const durB = b.estimatedMinutes || b.estimatedDurationMins || 0;
        return durB - durA;
      }
      if (sortBy === 'subject') {
        return (a.subjectName || '').localeCompare(b.subjectName || '', 'ar');
      }
      // default: sortBy === 'date'
      const dateA = a.dueDate || a.date || '9999-12-31';
      const dateB = b.dueDate || b.date || '9999-12-31';
      const diff = dateA.localeCompare(dateB);
      if (diff !== 0) return diff;
      return (a.time || '23:59').localeCompare(b.time || '23:59');
    });

    return {
      filteredTasks: result,
      counts: {
        today: todayCount,
        tomorrow: tomorrowCount,
        this_week: weekCount,
        overdue: overdueCount,
        completed: completedCount,
        all: tasks.length,
      },
      todayStats: {
        total: todayCount,
        done: todayDoneCount,
        percent: todayCount > 0 ? Math.round((todayDoneCount / todayCount) * 100) : 0,
      },
    };
  }, [tasks, activeTab, selectedSubjectFilter, priorityFilter, searchQuery, sortBy, todayStr, tomorrowStr, endOfWeekStr]);

  // Find subject details helper
  const getSubjectInfo = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      {/* Top Notification / Toast for Completed Task */}
      <AnimatePresence>
        {recentCompletedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="p-3.5 sm:p-4 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-between gap-3 border border-emerald-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-100" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold">
                  أحسنت يا بطل! تم إنجاز المهمة بنجاح ✨
                </p>
                <p className="text-[11px] text-emerald-100 font-medium line-clamp-1">
                  «{recentCompletedNotification.title}»
                </p>
              </div>
            </div>

            <button
              onClick={handleUndoRecentCompletion}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تراجع</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Productivity Quote Banner */}
      <ProductivityQuoteBanner defaultCategory="focus" />

      {/* Aesthetic Stickers Bar */}
      <AestheticStickersBar title="ملصقات التحفيز والإنجاز 🏷️" showDesc={false} />

      {/* Header with Title & Today Progress Meter */}
      <div className="bg-[#0B152B] p-6 rounded-3xl border border-[#1C2F58] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-900/60 border border-blue-500/30 text-blue-300 flex items-center justify-center shrink-0 shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-['Cairo'] flex items-center gap-2">
                <span>إدارة المهام والتمارين الدراسية</span>
                <span>✍️🎯</span>
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                نظّم تمارينك اليومية، اربط كل مهمة بمادتها في المنهاج، ورتّب أولوياتك لضمان التفوق في البكالوريا.
              </p>
            </div>
          </div>
        </div>

        {/* Right side controls: Mock Push test & Sound toggle & Add button */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          <button
            onClick={() => triggerMockPush()}
            title="اختبار ظهور تنبيه منبثق (Push Notification) في الزاوية العلوية لاقتراب موعد المهمة"
            className="px-3 py-2.5 rounded-xl bg-[#0F1C38] hover:bg-[#16274E] text-blue-300 hover:text-white border border-[#1E3666] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">تجربة تنبيه فوري 🔔</span>
          </button>

          <button
            onClick={toggleSound}
            title={soundEnabled ? 'صوت الإنجاز مفعل (انقر للتعطيل)' : 'صوت الإنجاز معطل (انقر للتفعيل)'}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'الصوت مفعّل' : 'صامت'}</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>مهمة جديدة</span>
          </button>
        </div>
      </div>

      {/* Today Accomplishment Meter Banner */}
      {todayStats.total > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-blue-950/20 p-4 sm:p-5 rounded-3xl border border-blue-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  إنجاز مهام اليوم
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono">
                  {todayStats.done} من {todayStats.total} ({todayStats.percent}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {todayStats.percent === 100
                  ? 'رائع جداً! أتممت جميع مهام اليوم بنجاح، خطوة إضافية نحو البكالوريا بتفوق! 🎓'
                  : todayStats.percent >= 50
                  ? 'تقدم ممتاز! قطعت أكثر من نصف مهامك اليومية، واصل بنفس العزيمة.'
                  : 'ابدأ بالمهام ذات الأولوية العالية واستعن بمؤقت التركيز لإنجازها بكفاءة.'}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-48 shrink-0">
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${todayStats.percent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs (اليوم، غداً، هذا الأسبوع، متأخرة، المكتملة، الكل) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Primary Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {/* Today */}
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'today'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>اليوم</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === 'today'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {counts.today}
            </span>
          </button>

          {/* Tomorrow */}
          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'tomorrow'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>غداً</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === 'tomorrow'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {counts.tomorrow}
            </span>
          </button>

          {/* This Week */}
          <button
            onClick={() => setActiveTab('this_week')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'this_week'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>هذا الأسبوع</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === 'this_week'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {counts.this_week}
            </span>
          </button>

          {/* Overdue (متأخرة) with alert color */}
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : counts.overdue > 0
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>متأخرة</span>
            {counts.overdue > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'overdue' ? 'bg-rose-700 text-white' : 'bg-rose-600 text-white animate-pulse'
                }`}
              >
                {counts.overdue}
              </span>
            )}
          </button>

          {/* Completed (المكتملة) */}
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المكتملة</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === 'completed'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {counts.completed}
            </span>
          </button>

          {/* All (الكل) */}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>جميع المهام</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === 'all'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {counts.all}
            </span>
          </button>
        </div>

        {/* Overdue Action Banner */}
        {activeTab === 'overdue' && counts.overdue > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                لديك <strong>{counts.overdue}</strong> مهام تجاوزت تاريخ استحقاقها. يمكنك ترحيلها مباشرة إلى خطة اليوم.
              </span>
            </div>
            <button
              onClick={handleRescheduleAllOverdueToToday}
              disabled={bulkActionLoading}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shrink-0 flex items-center justify-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{bulkActionLoading ? 'جاري الترحيل...' : 'ترحيل الكل إلى اليوم'}</span>
            </button>
          </div>
        )}

        {/* Secondary Filter Bar: Subject Filter Chips from Database */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>تصفية حسب مادة دراسية من مقررك:</span>
            </span>

            {selectedSubjectFilter !== 'all' && (
              <button
                onClick={() => setSelectedSubjectFilter('all')}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                إظهار كافة المواد
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <button
              onClick={() => setSelectedSubjectFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 text-[11px] ${
                selectedSubjectFilter === 'all'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              جميع المواد
            </button>

            {subjects.map((sub) => {
              const subTasksCount = tasks.filter((t) => t.subjectId === sub.id && t.status !== 'مكتملة').length;
              const isSelected = selectedSubjectFilter === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectFilter(sub.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-400 dark:border-blue-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: sub.color }}
                  />
                  <span>{sub.name}</span>
                  {subTasksCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {subTasksCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Priority & Sort Row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث في عنوان المهمة أو الملاحظات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-8 pl-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">كافة الأولويات</option>
              <option value="عالية">أولوية عالية 🔥</option>
              <option value="متوسطة">أولوية متوسطة</option>
              <option value="منخفضة">أولوية منخفضة</option>
            </select>

            {/* Sorting */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-bold hidden md:inline flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                <span>ترتيب:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value="date">حسب الموعد</option>
                <option value="priority">حسب الأولوية</option>
                <option value="duration">حسب المدة</option>
                <option value="subject">حسب المادة</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Task List Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[260px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">جاري تحميل مهامك الدراسية ومقرر المواد...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3.5">
            <CheckSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {activeTab === 'overdue'
              ? 'لا توجد أي مهام متأخرة! أحسنت في الحفاظ على جدولك'
              : activeTab === 'completed'
              ? 'لم تكتمل أي مهام في هذا التصنيف بعد'
              : activeTab === 'tomorrow'
              ? 'لا توجد مهام مجدولة ليوم غد بعد'
              : activeTab === 'today'
              ? 'لا توجد مهام متبقية لليوم! استمتع بوقتك أو خطط للغد'
              : 'لم يتم العثور على أي مهمة تطابق الفلاتر المحددة'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            أضف تمارين اليوم أو حلول البكالوريات السابقة لتتبع إنجازك خطوة بخطوة.
          </p>
          <button
            onClick={() => handleOpenCreateModal()}
            className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مهمة جديدة الآن</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.map((t) => {
              const isDone = t.status === 'مكتملة';
              const isCompleting = completingTaskId === t.id;
              const sub = getSubjectInfo(t.subjectId);
              const dueDateVal = t.dueDate || t.date || '';
              const isOverdue = dueDateVal !== '' && dueDateVal < todayStr && !isDone;

              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: isCompleting ? 1.015 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCompleting
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                      : isDone
                      ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60 opacity-75'
                      : isOverdue
                      ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  {/* Left / Task Body */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Checkbox Button */}
                    <button
                      onClick={() => handleToggleStatus(t)}
                      title={isDone ? 'تعيين كغير مكتملة' : 'تعليم كمكتملة'}
                      className={`mt-0.5 rounded-full transition-transform active:scale-90 shrink-0 ${
                        isDone
                          ? 'text-emerald-600 hover:text-slate-400'
                          : 'text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      {/* Title & Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-xs sm:text-sm font-bold transition-all ${
                            isDone
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {t.title}
                        </h3>

                        {/* Subject Badge (Linked strictly to student's database) */}
                        {sub ? (
                          <button
                            onClick={() => setSelectedSubjectFilter(sub.id)}
                            title={`تصفية حسب مادة ${sub.name}`}
                            className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white shrink-0 hover:opacity-90 transition-opacity flex items-center gap-1 shadow-xs"
                            style={{ backgroundColor: sub.color }}
                          >
                            <span>{sub.name}</span>
                            <span className="text-[9px] opacity-85">م{sub.coefficient}</span>
                          </button>
                        ) : t.subjectName ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white bg-blue-600 shrink-0">
                            {t.subjectName}
                          </span>
                        ) : null}

                        {/* Priority Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                            t.priority === 'عالية'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                              : t.priority === 'متوسطة'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      {/* Description if present */}
                      {t.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {t.description}
                        </p>
                      )}

                      {/* Metadata row: Due date, time, estimated duration */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-mono">
                            {dueDateVal || 'بدون موعد'}
                            {isOverdue && (
                              <span className="mr-1 text-rose-600 dark:text-rose-400 font-bold">
                                (متأخرة)
                              </span>
                            )}
                          </span>
                        </span>

                        {t.time && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t.time}</span>
                          </span>
                        )}

                        {(t.estimatedMinutes || t.estimatedDurationMins) && (
                          <span className="flex items-center gap-1 font-mono text-blue-600 dark:text-blue-400">
                            <Hourglass className="w-3.5 h-3.5" />
                            <span>
                              {t.estimatedMinutes || t.estimatedDurationMins} دقيقة مقدرة
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Right side */}
                  <div className="flex items-center gap-1.5 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Postpone buttons if not completed */}
                    {!isDone && (
                      <>
                        {isOverdue && (
                          <button
                            onClick={() => handlePostponeDays(t, 0)} // will set to today in handlePostpone
                            title="ترحيل المهمة إلى تاريخ اليوم"
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 text-[11px] font-bold transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>لليوم</span>
                          </button>
                        )}

                        <button
                          onClick={() => handlePostponeDays(t, 1)}
                          title="تأجيل ليوم غد (+1 يوم)"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <span>تأجيل لغد</span>
                        </button>
                      </>
                    )}

                    {/* Push notification test trigger */}
                    {!isDone && (
                      <button
                        onClick={() => triggerMockPush(t)}
                        title="إظهار تنبيه منبثق فوري (Mock Push) لاقتراب موعد هذه المهمة في الزاوية العلوية"
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#122040] transition-colors"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEditModal(t)}
                      title="تعديل المهمة"
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      title="حذف المهمة"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal (Strict Subject Linking) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-right space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-['Cairo']">
                  {editingTaskId ? 'تعديل المهمة أو التمرين' : 'إضافة مهمة دراسية جديدة'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 border border-rose-200 dark:border-rose-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان المهمة أو التمرين <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حل مسألة المتتاليات بكالوريا 2022، مراجعة مقالة الإحساس..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Subject Selection (Strictly linked to student's database) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>
                      المادة الدراسية <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                      من قاعدة بياناتك
                    </span>
                  </label>
                  {subjects.length > 0 ? (
                    <select
                      value={taskSubjectId}
                      onChange={(e) => setTaskSubjectId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-hidden"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (معامل {s.coefficient})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-rose-500 font-bold p-2 bg-rose-50 rounded-xl">
                      لا توجد مواد مسجلة. يرجى تهيئة موادك من قسم المواد أولاً.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    تاريخ الاستحقاق <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    الوقت المستهدف (اختياري)
                  </label>
                  <input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    المدة المقدرة (دقيقة)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="240"
                    step="5"
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    الأولوية
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-hidden"
                  >
                    <option value="عالية">عالية 🔥</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="منخفضة">منخفضة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ملاحظات أو تفاصيل التمرين (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="صفحة التمرين، الملاحظات التوجيهية، أو النقاط الواجب الانتباه لها..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingTask || subjects.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingTask ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الحفظ والتأكيد...</span>
                    </>
                  ) : editingTaskId ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأكيد تعديل المهمة 🎯</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأكيد إضافة المهمة 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
