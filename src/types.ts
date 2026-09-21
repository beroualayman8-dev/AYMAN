export type BacStreamCode =
  | 'experimental_sciences' // علوم تجريبية
  | 'mathematics'           // رياضيات
  | 'math_technical'        // تقني رياضي
  | 'management_economics'  // تسيير واقتصاد
  | 'literature_philosophy' // آداب وفلسفة
  | 'foreign_languages'     // لغات أجنبية
  | 'arts';                 // الفنون

export type Priority = 'منخفضة' | 'متوسطة' | 'عالية';
export type TaskStatus = 'لم تبدأ' | 'قيد الإنجاز' | 'مكتملة';
export type EventType =
  | 'امتحان تجريبي'
  | 'فرض أو اختبار'
  | 'موعد مهم'
  | 'بكالوريا رسمية'
  | 'امتحان'
  | 'اختبار'
  | 'واجب'
  | 'جلسة مراجعة'
  | 'حدث دراسي مهم';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  createdAt: string;
  status?: 'active' | 'suspended';
  stream?: string;
  bacYear?: number;
  taskCount?: number;
  sessionCount?: number;
}

export interface UserProfile {
  userId: string;
  name?: string;
  bacStream: string;
  bacYear: number;
  dailyTargetHours: number;
  preferredStudyHours: string;
  onboardingCompleted: boolean;
  bacExamDate: string; // YYYY-MM-DD
  theme?: 'light' | 'dark';
  notifyTasks?: boolean;
  notifyEvents?: boolean;
  streak?: number;
}

export interface StreamSubjectTemplate {
  name: string;
  code: string;
  coefficient: number;
  color: string;
  defaultHoursTarget: number;
}

export interface BacStream {
  id: string;
  name: string;
  code: BacStreamCode;
  description: string;
  defaultSubjects: StreamSubjectTemplate[];
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  coefficient: number;
  color: string;
  priority: Priority;
  targetHours: number;
  completedHours: number;
  tasksCount?: number;
  completedTasksCount?: number;
  notesCount?: number;
  isCustom?: boolean;
}

export interface Task {
  id: string;
  userId: string;
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // alias for date
  time?: string; // HH:MM
  priority: Priority;
  status: TaskStatus;
  estimatedDurationMins: number;
  estimatedMinutes?: number;
  completedAt?: string;
  createdAt: string;
}

export interface ScheduleSession {
  id: string;
  userId: string;
  dayOfWeek: 'السبت' | 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة';
  day?: string; // alias for dayOfWeek
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  goal: string;
  notes?: string;
  priority?: Priority;
  completed?: boolean;
}

export type ScheduleItem = ScheduleSession;

export interface FocusSession {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  durationMinutes: number;
  completedAt: string;
  sessionType: 'pomodoro' | 'custom';
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: string;
  type?: string;
}

export interface Note {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  subjectColor?: string;
  taskId?: string;
  title: string;
  content: string;
  pinned?: boolean;
  handwrittenData?: string; // Base64 data URL for drawing/handwritten canvas
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyEvent {
  id: string;
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  type: EventType;
  description?: string;
  notes?: string;
}

export type EventItem = StudyEvent;

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'event' | 'streak' | 'system';
  read: boolean;
  createdAt: string;
}

export interface MotivationalMessage {
  id: string;
  message: string;
  author?: string;
  active: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'عادية' | 'مهمة' | 'عاجلة';
  active: boolean;
}

export interface SystemSettings {
  bacExamDate: string; // YYYY-MM-DD default for new users
  currentBacYear: number;
  platformNotice?: string;
}

export interface DashboardSummary {
  todayDate: string;
  daysRemainingUntilBac: number;
  bacExamDate: string;
  dailyTargetHours: number;
  todayStudyMinutes: number;
  todayTasksCount: number;
  todayCompletedTasksCount: number;
  overallProgressPercent: number;
  currentStreak: number;
  motivationalMessage: string;
  todayTasks: Task[];
  upcomingEvents: StudyEvent[];
  weekOverview: {
    day: string;
    date: string;
    studiedMinutes: number;
    tasksCompleted: number;
  }[];
  subjectsSummary: {
    id: string;
    name: string;
    color: string;
    coefficient: number;
    tasksTotal: number;
    tasksCompleted: number;
    progressPercent: number;
  }[];
}

export interface ProgressMetrics {
  overallProgress: number;
  totalStudyHours: number;
  weeklyStudyHours?: number;
  monthlyStudyHours?: number;
  completedTasks: number;
  totalTasks: number;
  taskCompletionRate: number;
  currentStreak: number;
  weeklyConsistency: { day: string; hours: number }[];
  subjectHoursBreakdown: {
    subjectName: string;
    hours: number;
    color: string;
    coefficient?: number;
    targetHours?: number;
    progressPercent?: number;
    tasksCount?: number;
    completedTasksCount?: number;
  }[];
  recentSessions?: FocusSession[];
}

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalStudyHours: number;
  totalCompletedTasks: number;
  totalFocusSessions: number;
  streamDistribution: { stream: string; count: number }[];
}
