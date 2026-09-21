import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Check,
  Flame,
  Hourglass,
  Play,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { usePushNotification } from '../../context/PushNotificationContext.js';
import { api } from '../../services/api.js';
import type { AppNotification } from '../../types.js';
import { MOTIVATIONAL_QUOTES } from '../../data/motivationalQuotes.js';
import { SmallDigitalClock } from './SmallDigitalClock.js';

interface HeaderProps {
  title: string;
  onOpenMobileMenu: () => void;
  onStartFocus: () => void;
  streak?: number;
  daysRemaining?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenMobileMenu,
  onStartFocus,
  streak = 0,
  daysRemaining = 260,
}) => {
  const { user } = useAuth();
  const { triggerMockPush, soundEnabled, toggleSound } = usePushNotification();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const qInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 12000);
    return () => clearInterval(qInterval);
  }, []);

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  const cycleQuote = () => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // quiet fail
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 45000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await api.clearNotifications();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  return (
    <header className="sticky top-0 z-30 bg-[#081022]/95 backdrop-blur-md border-b border-[#16254A] transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left side (Right in RTL): Title & Mobile Menu button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            aria-label="فتح القائمة"
            className="p-2 -mr-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#112040] lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-black text-white font-['Cairo'] flex items-center gap-2">
              <span>{title}</span>
            </h1>
            {/* Clickable motivational quote pill */}
            <button
              type="button"
              onClick={cycleQuote}
              title="انقر لتغيير مقولة الإنتاجية 🔄"
              className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-blue-950/80 to-indigo-950/80 hover:from-blue-900/90 hover:to-indigo-900/90 text-blue-300 border border-blue-500/30 max-w-[360px] cursor-pointer transition-all shadow-xs active:scale-95"
            >
              <span className="text-sm select-none">{currentQuote.badgeEmoji}</span>
              <span className="truncate font-normal font-['Cairo']">{currentQuote.quote}</span>
              <span className="text-[9px] text-blue-400/70 shrink-0">🔄</span>
            </button>
          </div>
        </div>

        {/* Right side (Left in RTL): Small Digital Clock, BAC Countdown, Streak, Quick Focus, Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Small Live Clock */}
          <SmallDigitalClock className="hidden lg:inline-flex" />

          {/* BAC Countdown Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#0C1733] border border-[#1E3666] text-blue-200 text-xs font-semibold shadow-xs">
            <Hourglass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>باقي على البكالوريا:</span>
            <span className="font-bold text-amber-300 px-1.5 py-0.2 rounded bg-[#070D1E] border border-blue-900/60 font-mono">
              {daysRemaining}
            </span>
            <span>يوم 🎯</span>
          </div>

          {/* Streak Counter */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border shadow-xs ${
              streak > 0
                ? 'bg-[#181C10] text-amber-300 border-amber-500/40'
                : 'bg-[#0C1733] text-slate-400 border-[#1A2C54]'
            }`}
            title={`التتابع الدراسي: ${streak} أيام`}
          >
            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="font-mono font-bold">{streak}</span>
            <span className="hidden md:inline font-medium text-[11px]">يوم تتابع 🔥</span>
          </div>

          {/* Quick Focus Button */}
          <button
            onClick={onStartFocus}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-950/60 transition-all cursor-pointer border border-blue-400/30"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>جلسة تركيز ⏳</span>
          </button>

          {/* Notifications dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              aria-label="الإشعارات"
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Notification popover */}
            {showNotifs && (
              <div className="absolute left-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden text-right">
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">الإشعارات</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                        {unreadCount} جديد
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>قراءة الكل</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      لا توجد إشعارات حالياً. أنت على الطريق الصحيح!
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          !notif.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{notif.title}</p>
                          {!notif.read && (
                            <button
                              onClick={() => markRead(notif.id)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600"
                              title="تعليم كمقروء"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(notif.createdAt).toLocaleDateString('ar-DZ')}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* In-app Push Notification Mock quick launcher */}
                <div className="p-3 bg-slate-50 dark:bg-[#081126] border-t border-slate-100 dark:border-[#1E3666] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-blue-300">
                    <Bell className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                    <span className="font-bold text-[11px]">تنبيهات المهام (Push Mock)</span>
                  </div>
                  <button
                    onClick={() => {
                      triggerMockPush();
                      setShowNotifs(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    title="إظهار تنبيه تجريبي لاقتراب موعد تسليم مهمة دراسية في الزاوية العلوية"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>تجربة تنبيه فوري 🚀</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
