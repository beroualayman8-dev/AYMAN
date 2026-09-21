import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCircle2,
  Clock,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  Flame,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  usePushNotification,
  type PushNotificationItem,
} from '../../context/PushNotificationContext.js';

interface ToastItemProps {
  item: PushNotificationItem;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onComplete: (taskId: string, notifId: string) => void;
  onViewTask?: (taskId: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  item,
  soundEnabled,
  onToggleSound,
  onDismiss,
  onSnooze,
  onComplete,
  onViewTask,
}) => {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const [completing, setCompleting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(item.durationMs);

  useEffect(() => {
    let animFrame: number;
    let lastTick = Date.now();

    const tick = () => {
      if (!isHovered) {
        const now = Date.now();
        const delta = now - lastTick;
        remainingTimeRef.current -= delta;

        const pct = Math.max(0, (remainingTimeRef.current / item.durationMs) * 100);
        setProgress(pct);

        if (remainingTimeRef.current <= 0) {
          onDismiss(item.id);
          return;
        }
      }
      lastTick = Date.now();
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [isHovered, item.durationMs, item.id, onDismiss]);

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(item.taskId, item.id);
  };

  // Color schemes based on urgency
  const isOverdue = item.urgency === 'overdue';
  const isHighPriority = item.priority === 'عالية';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto relative w-full sm:w-96 rounded-2xl bg-[#0B152B]/95 backdrop-blur-md border border-[#1E3666] shadow-2xl shadow-blue-950/80 overflow-hidden text-right select-none transition-shadow hover:border-blue-500/50 hover:shadow-blue-900/30"
    >
      {/* Top ambient color glow line */}
      <div
        className={`h-1 w-full bg-gradient-to-r ${
          isOverdue
            ? 'from-rose-500 via-amber-500 to-rose-600'
            : isHighPriority
            ? 'from-amber-500 via-orange-500 to-blue-500'
            : 'from-blue-500 via-cyan-400 to-indigo-500'
        }`}
      />

      <div className="p-4 space-y-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Right side in RTL: App Title & Urgency Tag */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isOverdue
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              <Bell className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white font-['Cairo'] tracking-wide">
                  تنبيه المهام الدراسية
                </span>
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isOverdue ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isOverdue ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                </span>
              </div>
              <span className="text-[10px] text-blue-300/80 font-mono">
                {item.urgencyLabel}
              </span>
            </div>
          </div>

          {/* Left side in RTL: Sound toggle & Dismiss button */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'صوت التنبيه مفعّل' : 'صوت التنبيه صامت'}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#15254A] transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
            <button
              onClick={() => onDismiss(item.id)}
              title="إغلاق التنبيه"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#15254A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Title & Subject Pill */}
        <div className="space-y-1.5 pr-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-xs flex items-center gap-1"
              style={{ backgroundColor: item.subjectColor || '#3B82F6' }}
            >
              <span>{item.subjectName}</span>
            </span>

            {item.priority === 'عالية' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>أولوية عالية</span>
              </span>
            )}

            {item.time && (
              <span className="text-[10px] text-slate-300 font-mono flex items-center gap-1 bg-[#122042] px-2 py-0.5 rounded-md border border-[#1E3666]">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>{item.time}</span>
              </span>
            )}
          </div>

          <h4 className="text-xs sm:text-sm font-black text-white font-['Cairo'] line-clamp-2 leading-snug">
            {item.title}
          </h4>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {item.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completing ? 'جاري الإنجاز...' : 'إنجاز الآن ✅'}</span>
          </button>

          {onViewTask && (
            <button
              onClick={() => onViewTask(item.taskId)}
              className="px-3 py-2 rounded-xl bg-[#122042] hover:bg-[#1A2E5E] text-blue-300 text-xs font-bold border border-[#1E3666] transition-colors flex items-center gap-1 cursor-pointer"
              title="فتح المهمة في قسم المهام"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">عرض</span>
            </button>
          )}

          <button
            onClick={() => onSnooze(item.id, 15)}
            className="px-2.5 py-2 rounded-xl bg-[#0F1C38] hover:bg-[#16274E] text-slate-300 text-xs font-medium border border-[#1C2F58] transition-colors flex items-center gap-1 cursor-pointer"
            title="تأجيل التنبيه لمدة 15 دقيقة"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span className="text-[11px]">تأجيل 15د</span>
          </button>
        </div>
      </div>

      {/* Auto-dismiss timer progress bar */}
      <div className="w-full h-1 bg-[#070D1E] overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ${
            isOverdue
              ? 'bg-rose-500'
              : isHighPriority
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export const PushNotificationContainer: React.FC<{
  onNavigateToTasks?: (taskId?: string) => void;
}> = ({ onNavigateToTasks }) => {
  const {
    notifications,
    soundEnabled,
    toggleSound,
    dismissNotification,
    snoozeNotification,
    completeTaskFromNotification,
  } = usePushNotification();

  const handleViewTask = (taskId: string) => {
    if (onNavigateToTasks) {
      onNavigateToTasks(taskId);
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto"
    >
      <AnimatePresence mode="sync">
        {notifications.map((item) => (
          <ToastItem
            key={item.id}
            item={item}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onDismiss={dismissNotification}
            onSnooze={snoozeNotification}
            onComplete={completeTaskFromNotification}
            onViewTask={handleViewTask}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
