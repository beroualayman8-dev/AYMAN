import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Clock,
  CheckSquare,
  Megaphone,
  Database,
  Search,
  UserCheck,
  UserX,
  Send,
  Sparkles,
  BarChart2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api.js';
import type { AdminStats, User } from '../../types.js';

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([api.getAdminStats(), api.getAdminUsers()]);
      setStats(statsRes);
      setUsers(usersRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleUserStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateAdminUser(user.id, { status: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
    } catch (err: any) {
      alert(err.message || 'تعذر تحديث حالة المستخدم');
    }
  };

  const handleToggleUserRole = async (user: User) => {
    const nextRole = user.role === 'admin' ? 'student' : 'admin';
    try {
      await api.updateAdminUser(user.id, { role: nextRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
    } catch (err: any) {
      alert(err.message || 'تعذر تحديث الرتبة');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setSendingBroadcast(true);
    setBroadcastSuccess(null);
    try {
      const res = await api.broadcastNotification(broadcastTitle.trim(), broadcastMessage.trim());
      setBroadcastSuccess(res.message);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'تعذر إرسال الإعلان');
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-['Cairo'] flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <span>لوحة إدارة منصة نجاح | NAJAH Admin</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إحصائيات المنصة الكلية، توزيع الطلبة حسب الشُعب، إدارة الحسابات، وبث الإعلانات العامة.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          نظام التشغيل: مستقر 100%
        </div>
      </div>

      {/* Global Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">إجمالي الطلبة المسجلين</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.totalUsers}
            </div>
            <span className="text-[11px] text-blue-600 block mt-1">حسابات موثقة</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">إجمالي ساعات الدراسة المنجزة</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.totalStudyHours} س
            </div>
            <span className="text-[11px] text-emerald-600 block mt-1">عبر جلسات بومودورو</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">إجمالي التمارين المحلولة</span>
              <CheckSquare className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.totalCompletedTasks}
            </div>
            <span className="text-[11px] text-purple-600 block mt-1">تمارين بكالوريا منجزة</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">جلسات التركيز المسجلة</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.totalFocusSessions}
            </div>
            <span className="text-[11px] text-amber-600 block mt-1">جلسة أكاديمية</span>
          </div>
        </div>
      )}

      {/* Two columns: Broadcast Announcement + Stream Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo']">
              بث إعلان رسمي لجميع الطلبة
            </h3>
          </div>

          {broadcastSuccess && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{broadcastSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                عنوان الإعلان
              </label>
              <input
                type="text"
                required
                placeholder="مثال: اقتراب موعد امتحان البكالوريا البيضاء"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نص الإشعار / التوجيه الأكاديمي
              </label>
              <textarea
                required
                rows={3}
                placeholder="اكتب التوجيه أو التنبيه الذي سيظهر في جرس إشعارات جميع الطلبة..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={sendingBroadcast}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{sendingBroadcast ? 'جاري الإرسال...' : 'إرسال الإعلان للجميع'}</span>
            </button>
          </form>
        </div>

        {/* Stream Distribution */}
        {stats && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo']">
                توزيع الطلبة حسب الشعب
              </h3>
            </div>

            <div className="space-y-3">
              {stats.streamDistribution.map((item, idx) => {
                const percent =
                  stats.totalUsers > 0 ? Math.round((item.count / stats.totalUsers) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {item.stream}
                      </span>
                      <span className="font-mono text-slate-500">
                        {item.count} طالب ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Management Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Cairo']">
              إدارة حسابات الطلبة والمشرفين
            </h3>
            <p className="text-xs text-slate-500">عرض حالة كل مستخدم، وتعديل الصلاحيات أو تجميد الحسابات.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                <th className="py-3 px-3">المستخدم</th>
                <th className="py-3 px-3">الشعبة</th>
                <th className="py-3 px-3">الرتبة</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-3">تاريخ التسجيل</th>
                <th className="py-3 px-3 text-left">إجراءات الإدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono text-left dir-ltr">{u.email}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                    {u.stream || 'غير محدد'}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        u.role === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {u.role === 'admin' ? 'مشرف المنصة' : 'طالب'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        u.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {u.status === 'active' ? 'نشط' : 'مجمّد'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString('ar-DZ')}
                  </td>
                  <td className="py-3 px-3 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                          u.status === 'active'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900'
                        }`}
                      >
                        {u.status === 'active' ? 'تجميد' : 'تفعيل'}
                      </button>

                      <button
                        onClick={() => handleToggleUserRole(u)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[10px] font-bold"
                      >
                        {u.role === 'admin' ? 'خفض لطالب' : 'ترقية لمشرف'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
