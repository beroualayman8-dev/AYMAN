import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api.js';
import type { Task, Priority } from '../types.js';
import confetti from 'canvas-confetti';

export interface PushNotificationItem {
  id: string;
  taskId: string;
  title: string;
  subjectName: string;
  subjectColor: string;
  dueDate: string;
  time?: string;
  priority: Priority;
  urgency: 'overdue' | 'due_today' | 'due_soon' | 'test_mock';
  urgencyLabel: string;
  message: string;
  createdAt: number;
  durationMs: number;
}

interface PushNotificationContextType {
  notifications: PushNotificationItem[];
  soundEnabled: boolean;
  toggleSound: () => void;
  dismissNotification: (id: string) => void;
  snoozeNotification: (id: string, minutes?: number) => void;
  completeTaskFromNotification: (taskId: string, notifId: string) => Promise<void>;
  triggerMockPush: (customTask?: Partial<Task>) => void;
  checkUpcomingTasks: () => Promise<void>;
  onNavigateToTasks?: (taskId?: string) => void;
  setOnNavigateToTasks: (callback: (taskId?: string) => void) => void;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

// Sound effects using Web Audio API (gentle & calming)
export const playPushChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First note: Warm high chime (F5 - 698.46 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.09); // Ascend to A5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Second note: Bright harmonic sparkle (C6 - 1046.5 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.08);
    gain2.gain.setValueAtTime(0.07, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch {
    // Audio might be prevented until first user gesture
  }
};

export const playTaskCompletionChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic chord C-E-G
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.08, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + idx * 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + 0.45 + idx * 0.05);
    });
  } catch {}
};

export const PushNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('najahi_push_sound');
    return saved !== null ? saved === 'true' : true;
  });

  const onNavigateRef = useRef<((taskId?: string) => void) | undefined>(undefined);
  const shownTaskIdsRef = useRef<Set<string>>(new Set());
  const snoozedTasksRef = useRef<Map<string, number>>(new Map()); // taskId -> unsnooze timestamp

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('najahi_push_sound', String(next));
      return next;
    });
  };

  const setOnNavigateToTasks = useCallback((callback: (taskId?: string) => void) => {
    onNavigateRef.current = callback;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const snoozeNotification = useCallback((id: string, minutes: number = 15) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target) {
        const unsnoozeAt = Date.now() + minutes * 60 * 1000;
        snoozedTasksRef.current.set(target.taskId, unsnoozeAt);
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const completeTaskFromNotification = useCallback(async (taskId: string, notifId: string) => {
    dismissNotification(notifId);
    if (soundEnabled) {
      playTaskCompletionChime();
    }
    try {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.2, x: 0.8 },
        colors: ['#10B981', '#3B82F6', '#6366F1', '#F59E0B'],
        disableForReducedMotion: true,
      });
    } catch {}

    try {
      await api.updateTask(taskId, { status: 'مكتملة' });
    } catch (err) {
      console.error('Failed to complete task from notification:', err);
    }
  }, [dismissNotification, soundEnabled]);

  // Push an item to notifications queue
  const enqueuePush = useCallback(
    (item: PushNotificationItem) => {
      setNotifications((prev) => {
        // avoid duplicates
        if (prev.some((n) => n.taskId === item.taskId)) {
          return prev;
        }
        // keep maximum 2 toasts at a time to prevent UI clutter
        const updated = [item, ...prev.slice(0, 1)];
        return updated;
      });

      if (soundEnabled) {
        playPushChime();
      }
    },
    [soundEnabled]
  );

  // Manual trigger for testing/simulation
  const triggerMockPush = useCallback(
    (customTask?: Partial<Task>) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const mockId = `mock_${Date.now()}`;

      const mockItem: PushNotificationItem = {
        id: mockId,
        taskId: customTask?.id || `task_mock_${Date.now()}`,
        title: customTask?.title || 'حل مسألة الدوال الأسية واللوغارتمية (بكالوريا تجريبية)',
        subjectName: customTask?.subjectName || 'الرياضيات',
        subjectColor: customTask?.subjectColor || '#3B82F6',
        dueDate: customTask?.date || customTask?.dueDate || todayStr,
        time: customTask?.time || '18:00',
        priority: customTask?.priority || 'عالية',
        urgency: 'due_today',
        urgencyLabel: '⏰ موعد التسليم اليوم',
        message: 'اقترب موعد تسليم هذه المهمة! احرص على حل التمارين وتدوين استنتاجاتك في الوقت المناسب.',
        createdAt: Date.now(),
        durationMs: 12000,
      };

      enqueuePush(mockItem);
    },
    [enqueuePush]
  );

  // Scanner for upcoming/overdue tasks
  const checkUpcomingTasks = useCallback(async () => {
    try {
      const tasks = await api.getTasks();
      if (!tasks || tasks.length === 0) return;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Filter non-completed tasks
      const activeTasks = tasks.filter((t) => t.status !== 'مكتملة');
      const nowTimeMs = Date.now();

      for (const t of activeTasks) {
        const d = t.dueDate || t.date || '';
        if (!d) continue;

        // Check if snoozed
        const snoozedUntil = snoozedTasksRef.current.get(t.id);
        if (snoozedUntil && nowTimeMs < snoozedUntil) {
          continue;
        }

        // Has it already been shown in this active window?
        if (shownTaskIdsRef.current.has(t.id) && !snoozedUntil) {
          continue;
        }

        const isOverdue = d < todayStr;
        const isToday = d === todayStr;

        if (isOverdue || isToday || t.priority === 'عالية') {
          shownTaskIdsRef.current.add(t.id);
          snoozedTasksRef.current.delete(t.id);

          const urgency: PushNotificationItem['urgency'] = isOverdue
            ? 'overdue'
            : isToday
            ? 'due_today'
            : 'due_soon';

          const urgencyLabel = isOverdue
            ? '⚠️ مهمة دراسية متأخرة'
            : isToday
            ? '⏰ موعد التسليم اليوم'
            : '🔥 أولوية دراسية عالية';

          const message = isOverdue
            ? `تجاوزت هذه المهمة موعد استحقاقها (${d}). أنجزها الآن أو رحّلها لجدولك اليوم.`
            : `تستحق هذه المهمة التسليم اليوم ${t.time ? `قبل ${t.time}` : ''}. حافظ على التزامك بالتفوق!`;

          enqueuePush({
            id: `push_${t.id}_${Date.now()}`,
            taskId: t.id,
            title: t.title,
            subjectName: t.subjectName || 'مادة دراسية',
            subjectColor: t.subjectColor || '#3B82F6',
            dueDate: d,
            time: t.time,
            priority: t.priority,
            urgency,
            urgencyLabel,
            message,
            createdAt: Date.now(),
            durationMs: 12000,
          });

          // Show at most one new task per check cycle
          break;
        }
      }
    } catch {
      // Quiet fail if offline or not logged in yet
    }
  }, [enqueuePush]);

  // Initial check after app mount (give UI 2.5s to settle)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkUpcomingTasks();
    }, 2500);

    // Periodic check every 90 seconds
    const interval = setInterval(() => {
      checkUpcomingTasks();
    }, 90000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkUpcomingTasks]);

  return (
    <PushNotificationContext.Provider
      value={{
        notifications,
        soundEnabled,
        toggleSound,
        dismissNotification,
        snoozeNotification,
        completeTaskFromNotification,
        triggerMockPush,
        checkUpcomingTasks,
        onNavigateToTasks: onNavigateRef.current,
        setOnNavigateToTasks,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
};

export const usePushNotification = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotification must be used within a PushNotificationProvider');
  }
  return context;
};
