import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Calendar,
  Timer,
  TrendingUp,
  FileText,
  CalendarDays,
  Settings,
  ShieldCheck,
  LogOut,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export type NavTab =
  | 'dashboard'
  | 'subjects'
  | 'tasks'
  | 'schedule'
  | 'focus'
  | 'progress'
  | 'notes'
  | 'events'
  | 'settings'
  | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen, onCloseMobile }) => {
  const { user, profile, logout, theme, toggleTheme } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'الرئيسية', icon: LayoutDashboard, emoji: '🏠' },
    { id: 'subjects' as NavTab, label: 'المواد والمعاملات', icon: BookOpen, emoji: '📚' },
    { id: 'tasks' as NavTab, label: 'المهام والتمارين', icon: CheckSquare, emoji: '✍️' },
    { id: 'schedule' as NavTab, label: 'جدول المراجعة', icon: Calendar, emoji: '📅' },
    { id: 'focus' as NavTab, label: 'مؤقت التركيز', icon: Timer, emoji: '⏳' },
    { id: 'progress' as NavTab, label: 'مؤشرات الجاهزية', icon: TrendingUp, emoji: '📊' },
    { id: 'notes' as NavTab, label: 'الملاحظات واللوح', icon: FileText, emoji: '📝' },
    { id: 'events' as NavTab, label: 'روزنامة الأحداث', icon: CalendarDays, emoji: '🎯' },
    { id: 'settings' as NavTab, label: 'الإعدادات والملف', icon: Settings, emoji: '⚙️' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin' as NavTab, label: 'لوحة الإدارة', icon: ShieldCheck, emoji: '🛡️' });
  }

  const handleNavClick = (tabId: NavTab) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-[#081022] border-l border-[#16254A] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#16254A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-900 to-indigo-950 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-950/50 ring-2 ring-blue-500/30">
              <span className="font-['Cairo']">ن</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-['Cairo']">
                  نجاح
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 font-sans tracking-wider border border-blue-800/60">
                  NAJAH
                </span>
              </div>
              <p className="text-[11px] text-blue-400/80 truncate max-w-[140px] flex items-center gap-1">
                <span>أزرق ليلي 🌙</span>
                <span>•</span>
                <span>بكالوريا الجزائر</span>
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="تبديل المظهر"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#112040] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>
        </div>

        {/* Student Profile snippet */}
        {user && (
          <div className="mx-4 my-3 p-3 rounded-2xl bg-[#0C1730] border border-[#1A2C54] flex items-center gap-3 shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-blue-400/20">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-blue-300 truncate font-medium">
                  {profile?.bacStream || (user.role === 'admin' ? 'مشرف المنصة' : 'طالب بكالوريا')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-950/60 border border-blue-400/40 translate-x-[-2px]'
                    : 'text-slate-300 hover:text-white hover:bg-[#101F3E] border border-transparent hover:border-[#1E335E]'
                }`}
              >
                <span className="text-base select-none">{item.emoji}</span>
                <span className="truncate flex-1 text-right">{item.label}</span>
                {item.id === 'focus' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                    25د
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-[#16254A] space-y-2">
          {/* Productivity Tip Box */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#0B1733] to-[#0E1E42] border border-[#1E3666] text-[11px] text-blue-200 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-blue-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>وقود الهمة والتركيز ⚡</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              &ldquo;الانضباط اليومي هو الفرق الوحيد بين الحلم والتفوق الحقيقي.&rdquo;
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
};
