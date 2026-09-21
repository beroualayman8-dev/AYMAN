import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  Trash2,
  X,
  AlertCircle,
  Calendar,
  Hourglass,
  Tag,
  Save,
} from 'lucide-react';
import { api } from '../../services/api.js';
import type { EventItem, EventType } from '../../types.js';

export const EventsView: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('امتحان تجريبي');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    try {
      const created = await api.createEvent({
        title: title.trim(),
        type,
        date,
        time: time || undefined,
        description: description || undefined,
      });
      setEvents((prev) => [...prev, created]);
      setShowModal(false);
      setTitle('');
      setDate('');
      setTime('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'تعذر إضافة الحدث');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا الموعد من الروزنامة؟')) return;
    try {
      await api.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to calculate days remaining
  const calculateDaysRemaining = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-['Cairo'] flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-purple-600" />
            <span>روزنامة الأحداث والامتحانات التجريبية</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تابع مواعيد البكالوريا التجريبية (Bac blanc)، فروض واختبارات الفصول، وتواريخ التسجيلات الرسمية.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موعد أو امتحان</span>
        </button>
      </div>

      {/* Events List / Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">جاري تحميل الروزنامة...</div>
      ) : sortedEvents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 mx-auto flex items-center justify-center mb-3">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            لا توجد أحداث أو اختبارات مسجلة
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            أضف موعد البكالوريا البيضاء أو الفروض القادمة لحساب الأيام المتبقية.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
          >
            إضافة موعد الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEvents.map((evt) => {
            const daysLeft = calculateDaysRemaining(evt.date);
            const isPast = daysLeft < 0;
            const isBacOfficial = evt.type === 'بكالوريا رسمية';

            return (
              <div
                key={evt.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  isBacOfficial
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-300 dark:border-blue-900 shadow-sm ring-1 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-md font-bold ${
                        isBacOfficial
                          ? 'bg-blue-600 text-white'
                          : evt.type === 'امتحان تجريبي'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : evt.type === 'فرض أو اختبار'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {evt.type}
                    </span>

                    {/* Countdown indicator */}
                    <div
                      className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        isPast
                          ? 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                          : daysLeft <= 14
                          ? 'text-rose-600 bg-rose-50 dark:bg-rose-950'
                          : 'text-blue-600 bg-blue-50 dark:bg-blue-950'
                      }`}
                    >
                      <Hourglass className="w-3 h-3" />
                      {isPast ? <span>انتهى</span> : <span>باقي {daysLeft} يوم</span>}
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {evt.title}
                  </h3>

                  {evt.description && (
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {evt.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {evt.date}
                    </span>
                    {evt.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {evt.time}
                      </span>
                    )}
                  </div>
                </div>

                {!isBacOfficial && (
                  <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => handleDelete(evt.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-right space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Cairo']">
                إضافة حدث أو امتحان جديد
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                عنوان الحدث / الامتحان
              </label>
              <input
                type="text"
                required
                placeholder="مثال: البكالوريا البيضاء (الامتحان التجريبي)، اختبار الثلاثي الثاني..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نوع الحدث
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as EventType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="امتحان تجريبي">امتحان تجريبي (Bac blanc)</option>
                  <option value="فرض أو اختبار">فرض أو اختبار فصلي</option>
                  <option value="موعد مهم">موعد هام (تسجيل، سحب الاستدعاء...)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  التاريخ
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الوقت (اختياري)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ملاحظات التحضير (اختياري)
              </label>
              <textarea
                rows={2}
                placeholder="مثال: مراجعة الوحدات الأولى والثانية والثالثة..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>إضافة إلى الروزنامة</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
