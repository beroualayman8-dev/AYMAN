import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Calendar,
  Timer,
  TrendingUp,
} from 'lucide-react';
import type { NavTab } from './Sidebar.js';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const items = [
    { id: 'dashboard' as NavTab, label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'tasks' as NavTab, label: 'المهام', icon: CheckSquare },
    { id: 'focus' as NavTab, label: 'التركيز', icon: Timer, highlight: true },
    { id: 'schedule' as NavTab, label: 'الجدول', icon: Calendar },
    { id: 'subjects' as NavTab, label: 'المواد', icon: BookOpen },
    { id: 'progress' as NavTab, label: 'التقدم', icon: TrendingUp },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden px-2 py-1.5 flex items-center justify-around safe-area-pb">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        if (item.highlight) {
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="relative -top-3 flex flex-col items-center justify-center p-2"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-blue-700 text-white ring-4 ring-blue-100 dark:ring-blue-900'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 ring-4 ring-white dark:ring-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center transition-colors ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
