import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  TrendingUp,
  X,
  Play,
  FileText,
  Trash2,
  Save,
  ChevronLeft,
  Calendar,
  Sparkles,
  Sliders,
  History,
  CheckSquare,
} from 'lucide-react';
import { api } from '../../services/api.js';
import type { Subject, Task, Note, FocusSession, Priority } from '../../types.js';

interface SubjectsViewProps {
  onStartFocusWithSubject?: (subjectId: string) => void;
  onCreateTaskForSubject?: (subjectId: string) => void;
  onStartFocus?: (subjectId?: string) => void;
  onOpenNewTask?: (subjectId?: string) => void;
  onOpenNewNote?: (subjectId?: string) => void;
}

type SubjectDetailTab = 'tasks' | 'notes' | 'sessions' | 'settings';

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  onStartFocusWithSubject,
  onCreateTaskForSubject,
  onStartFocus,
  onOpenNewTask,
  onOpenNewNote,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected subject for full detail modal/drawer
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState<SubjectDetailTab>('tasks');

  // Edit subject form inside details
  const [editPriority, setEditPriority] = useState<Priority>('متوسطة');
  const [editTargetHours, setEditTargetHours] = useState(40);
  const [editColor, setEditColor] = useState('#2563EB');

  // New task quick add inside subject detail
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [newSubTaskPriority, setNewSubTaskPriority] = useState<Priority>('متوسطة');
  const [addingTask, setAddingTask] = useState(false);

  // New note quick add inside subject detail
  const [newSubNoteTitle, setNewSubNoteTitle] = useState('');
  const [newSubNoteContent, setNewSubNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Custom subject modal
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCoeff, setCustomCoeff] = useState(2);
  const [customTargetHours, setCustomTargetHours] = useState(30);
  const [customPriority, setCustomPriority] = useState<Priority>('متوسطة');
  const [customColor, setCustomColor] = useState('#2563EB');

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [subsRes, tasksRes, notesRes, focusRes] = await Promise.all([
        api.getSubjects(),
        api.getTasks(),
        api.getNotes(),
        api.getFocusHistory(),
      ]);
      setSubjects(subsRes);
      setTasks(tasksRes);
      setNotes(notesRes);
      setFocusSessions(focusRes);
    } catch (err) {
      console.error('Failed to load subjects data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const openSubjectDetail = (sub: Subject) => {
    setSelectedSubject(sub);
    setEditPriority(sub.priority);
    setEditTargetHours(sub.targetHours);
    setEditColor(sub.color);
    setActiveTab('tasks');
  };

  const handleSaveSubjectSettings = async () => {
    if (!selectedSubject) return;
    try {
      const updated = await api.updateSubject(selectedSubject.id, {
        priority: editPriority,
        targetHours: editTargetHours,
        color: editColor,
      });
      setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setSelectedSubject(updated);
      alert('تم حفظ إعدادات المادة بنجاح');
    } catch (err: any) {
      alert(err.message || 'تعذر تحديث إعدادات المادة');
    }
  };

  const handleDeleteSubject = async (subId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟ سيتم إزالتها من قائمتك.')) return;
    try {
      await api.deleteSubject(subId);
      setSubjects((prev) => prev.filter((s) => s.id !== subId));
      setSelectedSubject(null);
    } catch (err: any) {
      alert(err.message || 'تعذر حذف المادة');
    }
  };

  const handleCreateCustomSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    try {
      const created = await api.createSubject({
        name: customName.trim(),
        coefficient: customCoeff,
        targetHours: customTargetHours,
        priority: customPriority,
        color: customColor,
        isCustom: true,
      });
      setSubjects((prev) => [...prev, created]);
      setShowAddCustomModal(false);
      setCustomName('');
    } catch (err: any) {
      alert(err.message || 'تعذر إضافة المادة');
    }
  };

  // Toggle task from inside subject detail
  const handleToggleTask = async (task: Task) => {
    try {
      const nextStatus = task.status === 'مكتملة' ? 'لم تبدأ' : 'مكتملة';
      const updated = await api.updateTask(task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  };

  // Quick add task inside subject detail
  const handleAddQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !newSubTaskTitle.trim()) return;
    try {
      setAddingTask(true);
      const created = await api.createTask({
        title: newSubTaskTitle.trim(),
        subjectId: selectedSubject.id,
        dueDate: new Date().toISOString().split('T')[0],
        priority: newSubTaskPriority,
        status: 'لم تبدأ',
      });
      setTasks((prev) => [created, ...prev]);
      setNewSubTaskTitle('');
    } catch (err: any) {
      alert(err.message || 'تعذر إنشاء المهمة');
    } finally {
      setAddingTask(false);
    }
  };

  // Quick add note inside subject detail
  const handleAddQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !newSubNoteTitle.trim() || !newSubNoteContent.trim()) return;
    try {
      setAddingNote(true);
      const created = await api.createNote({
        title: newSubNoteTitle.trim(),
        content: newSubNoteContent.trim(),
        subjectId: selectedSubject.id,
      });
      setNotes((prev) => [created, ...prev]);
      setNewSubNoteTitle('');
      setNewSubNoteContent('');
    } catch (err: any) {
      alert(err.message || 'تعذر إنشاء الملاحظة');
    } finally {
      setAddingNote(false);
    }
  };

  // Subject statistics helper
  const getSubjectStats = (subId: string, targetHours: number, completedHours: number) => {
    const subTasks = tasks.filter((t) => t.subjectId === subId);
    const completedTasks = subTasks.filter((t) => t.status === 'مكتملة');
    const remainingTasks = subTasks.length - completedTasks.length;

    const percent =
      targetHours > 0
        ? Math.min(100, Math.round((completedHours / targetHours) * 100))
        : subTasks.length > 0
        ? Math.round((completedTasks.length / subTasks.length) * 100)
        : 0;

    return {
      subTasks,
      completedTasksCount: completedTasks.length,
      remainingTasksCount: remainingTasks,
      totalTasksCount: subTasks.length,
      percent,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Active subject context for modal
  const currentSubStats = selectedSubject
    ? getSubjectStats(selectedSubject.id, selectedSubject.targetHours, selectedSubject.completedHours)
    : null;
  const currentSubNotes = selectedSubject
    ? notes.filter((n) => n.subjectId === selectedSubject.id)
    : [];
  const currentSubSessions = selectedSubject
    ? focusSessions.filter((s) => s.subjectId === selectedSubject.id)
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-['Cairo'] flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>مواد البكالوريا الرسمية والمعاملات</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            اضغط على أي مادة لاستعراض تمارينها، ملخصاتها، جلسات دراستها، وتحديد ساعات الهدف.
          </p>
        </div>

        <button
          onClick={() => setShowAddCustomModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مادة مخصصة</span>
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => {
          const stats = getSubjectStats(sub.id, sub.targetHours, sub.completedHours);
          const isHighPriority = sub.priority === 'عالية';

          return (
            <div
              key={sub.id}
              onClick={() => openSubjectDetail(sub)}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 cursor-pointer shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Circular Performance Indicator, Name, Coeff & Priority */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    {/* Visual Performance Circle Indicator */}
                    <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        {/* Background circle track */}
                        <path
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Dynamic progress stroke */}
                        <path
                          style={{
                            strokeDasharray: `${stats.percent}, 100`,
                            stroke: sub.color || '#3B82F6',
                            transition: 'stroke-dasharray 0.6s ease',
                          }}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      {/* Percent inside the circle */}
                      <span className="absolute text-[11px] font-mono font-black text-slate-800 dark:text-white">
                        {stats.percent}%
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-['Cairo']">
                        {sub.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        معامل رسمي: {sub.coefficient}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                      isHighPriority
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        : sub.priority === 'متوسطة'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {sub.priority}
                  </span>
                </div>

                {/* Progress Bar & percentage */}
                <div className="my-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">نسبة التقدم الأكاديمي</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {stats.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.percent}%`, backgroundColor: sub.color }}
                    />
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[11px] text-slate-400 block mb-0.5">ساعات المذاكرة</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-black font-mono text-blue-600 dark:text-blue-400">
                        {sub.completedHours}
                      </span>
                      <span className="text-[10px] text-slate-400">/ {sub.targetHours} س</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[11px] text-slate-400 block mb-0.5">المهام والتمارين</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {stats.completedTasksCount}
                      </span>
                      <span className="text-[10px] text-slate-400">/ {stats.totalTasksCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom quick actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onStartFocusWithSubject) {
                      onStartFocusWithSubject(sub.id);
                    } else if (onStartFocus) {
                      onStartFocus(sub.id);
                    }
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>بدء جلسة تركيز</span>
                </button>

                <span className="text-xs font-bold text-blue-600 group-hover:translate-x-[-2px] transition-transform flex items-center gap-0.5">
                  <span>فتح التفاصيل</span>
                  <ChevronLeft className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Subject Details Modal / Sheet */}
      {selectedSubject && currentSubStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 text-right my-8 max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div>
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: selectedSubject.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-['Cairo']">
                        {selectedSubject.name}
                      </h2>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600">
                        معامل {selectedSubject.coefficient}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      أولوية المراجعة: {selectedSubject.priority}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSubject(null)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Top stats bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block mb-0.5">نسبة التقدم</span>
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                    {currentSubStats.percent}%
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block mb-0.5">ساعات المذاكرة</span>
                  <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">
                    {selectedSubject.completedHours} / {selectedSubject.targetHours} س
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block mb-0.5">تمارين منجزة</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {currentSubStats.completedTasksCount}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block mb-0.5">تمارين متبقية</span>
                  <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                    {currentSubStats.remainingTasksCount}
                  </span>
                </div>
              </div>

              {/* Navigation Tabs inside modal */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto text-xs font-bold mb-4">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'tasks'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>المهام والتمارين ({currentSubStats.totalTasksCount})</span>
                </button>

                <button
                  onClick={() => setActiveTab('notes')}
                  className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'notes'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>الملخصات والملاحظات ({currentSubNotes.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'sessions'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>جلسات التركيز ({currentSubSessions.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>إعدادات المادة</span>
                </button>
              </div>

              {/* Tab Content 1: Tasks */}
              {activeTab === 'tasks' && (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {/* Quick Add Task */}
                  <form onSubmit={handleAddQuickTask} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="إضافة تمرين أو درس جديد لهذه المادة..."
                      value={newSubTaskTitle}
                      onChange={(e) => setNewSubTaskTitle(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                    <select
                      value={newSubTaskPriority}
                      onChange={(e) => setNewSubTaskPriority(e.target.value as Priority)}
                      className="px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="عالية">عالية</option>
                      <option value="متوسطة">متوسطة</option>
                      <option value="منخفضة">منخفضة</option>
                    </select>
                    <button
                      type="submit"
                      disabled={addingTask}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      إضافة
                    </button>
                  </form>

                  {/* Tasks List */}
                  {currentSubStats.subTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      لا توجد مهام أو تمارين مسجلة لهذه المادة بعد.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentSubStats.subTasks.map((t) => {
                        const isDone = t.status === 'مكتملة';
                        return (
                          <div
                            key={t.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                              isDone
                                ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-70'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleTask(t)}
                                className="text-slate-400 hover:text-emerald-600"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <span
                                className={`truncate font-bold ${
                                  isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {t.title}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                                t.priority === 'عالية'
                                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950'
                                  : t.priority === 'متوسطة'
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content 2: Notes */}
              {activeTab === 'notes' && (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {/* Quick Add Note */}
                  <form onSubmit={handleAddQuickNote} className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      required
                      placeholder="عنوان الملاحظة أو القانون..."
                      value={newSubNoteTitle}
                      onChange={(e) => setNewSubNoteTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden"
                    />
                    <textarea
                      rows={2}
                      required
                      placeholder="اكتب الملخص أو المنهجية أو الملاحظة هنا..."
                      value={newSubNoteContent}
                      onChange={(e) => setNewSubNoteContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={addingNote}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                    >
                      حفظ الملاحظة
                    </button>
                  </form>

                  {currentSubNotes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      لا توجد ملاحظات أو ملخصات مدونة لهذه المادة بعد.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {currentSubNotes.map((n) => (
                        <div
                          key={n.id}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                            {n.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {n.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content 3: Focus Sessions History */}
              {activeTab === 'sessions' && (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {currentSubSessions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      لم تسجل أي جلسات تركيز موثقة لهذه المادة حتى الآن.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentSubSessions.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              جلسة تركيز ({s.durationMinutes} دقيقة)
                            </span>
                            {s.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{s.notes}</p>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">{s.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content 4: Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-4 py-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      درجة الأولوية في المراجعة:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['منخفضة', 'متوسطة', 'عالية'] as Priority[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditPriority(p)}
                          className={`py-2.5 rounded-xl font-bold border transition-all ${
                            editPriority === p
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">
                        الهدف الإجمالي لساعات المذاكرة:
                      </span>
                      <span className="font-mono text-blue-600">{editTargetHours} ساعة</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={editTargetHours}
                      onChange={(e) => setEditTargetHours(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                      لون تمييز المادة:
                    </label>
                    <div className="flex gap-3">
                      {['#2563EB', '#059669', '#7C3AED', '#D97706', '#DC2626', '#EC4899', '#0891B2'].map(
                        (c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            className={`w-7 h-7 rounded-full transition-transform ${
                              editColor === c ? 'ring-3 ring-slate-400 scale-110' : ''
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        )
                      )}
                    </div>
                  </div>

                  {selectedSubject.isCustom && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(selectedSubject.id)}
                        className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف هذه المادة المخصصة</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => {
                  if (onStartFocusWithSubject) {
                    onStartFocusWithSubject(selectedSubject.id);
                  } else if (onStartFocus) {
                    onStartFocus(selectedSubject.id);
                  }
                  setSelectedSubject(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>بدء جلسة تركيز لهذه المادة</span>
              </button>

              <div className="flex gap-2">
                {activeTab === 'settings' && (
                  <button
                    type="button"
                    onClick={handleSaveSubjectSettings}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSubject(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Subject Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <form
            onSubmit={handleCreateCustomSubject}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-right space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Cairo']">
                إضافة مادة دراسية جديدة
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم المادة
              </label>
              <input
                type="text"
                required
                placeholder="مثال: هندسة الطرائق، لغة إيطالية، ميكانيك..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  المعامل
                </label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={customCoeff}
                  onChange={(e) => setCustomCoeff(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ساعات الهدف
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  step="5"
                  value={customTargetHours}
                  onChange={(e) => setCustomTargetHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الأولوية
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['منخفضة', 'متوسطة', 'عالية'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCustomPriority(p)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      customPriority === p
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                إضافة المادة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
