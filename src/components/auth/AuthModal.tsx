import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  GraduationCap,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: () => void;
}

const BAC_STREAMS = [
  'علوم تجريبية',
  'رياضيات',
  'تقني رياضي',
  'تسيير واقتصاد',
  'آداب وفلسفة',
  'لغات أجنبية',
  'الفنون',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [bacStream, setBacStream] = useState('علوم تجريبية');
  const [bacYear, setBacYear] = useState(2027);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onSuccess();
        onClose();
      } else if (mode === 'register') {
        if (!name.trim()) {
          throw new Error('يرجى كتابة الاسم الكامل');
        }
        await register(name, email, password, bacStream, bacYear);
        onSuccess();
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setSuccessMsg(res.message);
        if (res.canResetDirectly) {
          setMode('reset');
        }
      } else if (mode === 'reset') {
        const res = await api.resetPassword(email, newPassword);
        setSuccessMsg(res.message);
        setTimeout(() => {
          setMode('login');
          setSuccessMsg(null);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء العملية');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'تعذر تسجيل الدخول السريع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 text-right my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white font-black text-2xl mb-3 shadow-md">
            <span>ن</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-['Cairo']">
            {mode === 'login' && 'تسجيل الدخول إلى نجاح'}
            {mode === 'register' && 'إنشاء حساب جديد'}
            {mode === 'forgot' && 'استرجاع كلمة المرور'}
            {mode === 'reset' && 'تعيين كلمة مرور جديدة'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'login' && 'مرحباً بعودتك! نظّم يومك وواصل تقدمك.'}
            {mode === 'register' && 'ابدأ رحلة البكالوريا بثقة وخطة دراسية محكمة.'}
            {mode === 'forgot' && 'أدخل بريدك الإلكتروني لإعادة ضبط كلمة المرور.'}
            {mode === 'reset' && 'اكتب كلمة المرور الجديدة لحسابك.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              حساب جديد
            </button>
          </div>
        )}

        {/* Error / Success Banners */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الاسم الكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: أمين بن علي"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-left dir-ltr"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {(mode === 'login' || mode === 'register') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  كلمة المرور
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-left dir-ltr"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="لا تقل عن 6 أحرف"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-left dir-ltr"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  شعبة البكالوريا
                </label>
                <div className="relative">
                  <select
                    value={bacStream}
                    onChange={(e) => setBacStream(e.target.value)}
                    className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    {BAC_STREAMS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  سنة البكالوريا
                </label>
                <div className="relative">
                  <select
                    value={bacYear}
                    onChange={(e) => setBacYear(Number(e.target.value))}
                    className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 appearance-none font-mono"
                  >
                    <option value={2027}>2027</option>
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'دخول إلى حسابي'}
                  {mode === 'register' && 'إنشاء الحساب وبدء التنظيم'}
                  {mode === 'forgot' && 'إرسال تعليمات الاسترجاع'}
                  {mode === 'reset' && 'حفظ كلمة المرور الجديدة'}
                </span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>
        </form>

        {/* Back to login if forgot */}
        {(mode === 'forgot' || mode === 'reset') && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        )}

        {/* Quick Demo Access Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mb-3 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>تجربة فورية بنقرة واحدة (حسابات جاهزة):</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('ayman@najah.dz', 'bac2027')}
              className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-200 transition-colors text-center"
            >
              طالب بكالوريا (تجريبي)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@najah.dz', 'admin123456')}
              className="p-2 rounded-lg bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-purple-700 dark:text-purple-300 transition-colors text-center"
            >
              مشرف المنصة (Admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
