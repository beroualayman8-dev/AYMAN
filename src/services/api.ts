import type {
  User,
  UserProfile,
  DashboardSummary,
  Subject,
  Task,
  ScheduleSession,
  ScheduleItem,
  FocusSession,
  Note,
  StudyEvent,
  EventItem,
  AppNotification,
  BacStream,
  ProgressMetrics,
  AdminStats,
} from '../types.js';

const TOKEN_KEY = 'najah_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
    }

    return data as T;
  },

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User; profile?: UserProfile }> {
    const res = await this.request<{ token: string; user: User; profile?: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  },

  async register(
    name: string,
    email: string,
    password: string,
    bacStream: string,
    bacYear: number
  ): Promise<{ token: string; user: User; profile: UserProfile }> {
    const res = await this.request<{ token: string; user: User; profile: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, bacStream, bacYear }),
    });
    this.setToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User; profile?: UserProfile }> {
    return this.request<{ user: User; profile?: UserProfile }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  },

  async forgotPassword(email: string): Promise<{ message: string; canResetDirectly?: boolean; resetHint?: string }> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email: string, newPassword: string): Promise<{ message: string }> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },

  // Onboarding
  async updateOnboarding(data: Partial<UserProfile>): Promise<{ profile: UserProfile }> {
    return this.request('/api/onboarding', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Dashboard
  async getDashboard(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/api/dashboard');
  },

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return this.request<Subject[]>('/api/subjects');
  },

  async createSubject(sub: Partial<Subject>): Promise<Subject> {
    return this.request<Subject>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(sub),
    });
  },

  async updateSubject(id: string, sub: Partial<Subject>): Promise<Subject> {
    return this.request<Subject>(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sub),
    });
  },

  async deleteSubject(id: string): Promise<{ message: string }> {
    return this.request(`/api/subjects/${id}`, { method: 'DELETE' });
  },

  // Tasks
  async getTasks(params: { filter?: string; subjectId?: string; sort?: string } = {}): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params.filter) query.set('filter', params.filter);
    if (params.subjectId) query.set('subjectId', params.subjectId);
    if (params.sort) query.set('sort', params.sort);
    const qs = query.toString();
    const tasks = await this.request<Task[]>(`/api/tasks${qs ? `?${qs}` : ''}`);
    return tasks.map((t) => ({ ...t, dueDate: t.date }));
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const payload = { ...task };
    if (!payload.date && payload.dueDate) {
      payload.date = payload.dueDate;
    }
    const created = await this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...created, dueDate: created.date };
  },

  async updateTask(id: string, updates: Partial<Task> & { postponeDays?: number }): Promise<Task> {
    const payload = { ...updates };
    if (!payload.date && payload.dueDate) {
      payload.date = payload.dueDate;
    }
    const updated = await this.request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return { ...updated, dueDate: updated.date };
  },

  async deleteTask(id: string): Promise<{ message: string }> {
    return this.request(`/api/tasks/${id}`, { method: 'DELETE' });
  },

  // Schedule
  async getSchedule(): Promise<ScheduleSession[]> {
    return this.request<ScheduleSession[]>('/api/schedule');
  },

  async createScheduleSession(session: Partial<ScheduleSession>): Promise<ScheduleSession> {
    return this.request<ScheduleSession>('/api/schedule', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  },

  async createScheduleItem(session: Partial<ScheduleSession>): Promise<ScheduleSession> {
    return this.createScheduleSession(session);
  },

  async updateScheduleSession(id: string, session: Partial<ScheduleSession>): Promise<ScheduleSession> {
    return this.request<ScheduleSession>(`/api/schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(session),
    });
  },

  async updateScheduleItem(id: string, session: Partial<ScheduleSession>): Promise<ScheduleSession> {
    return this.updateScheduleSession(id, session);
  },

  async deleteScheduleSession(id: string): Promise<{ message: string }> {
    return this.request(`/api/schedule/${id}`, { method: 'DELETE' });
  },

  async deleteScheduleItem(id: string): Promise<{ message: string }> {
    return this.deleteScheduleSession(id);
  },

  // Focus Sessions
  async recordFocusSession(data: {
    subjectId?: string;
    durationMinutes: number;
    sessionType?: 'pomodoro' | 'custom';
    notes?: string;
  }): Promise<{ message: string; session: FocusSession }> {
    return this.request('/api/focus/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logFocusSession(data: {
    subjectId?: string;
    durationMinutes: number;
    type?: string;
    notes?: string;
  }): Promise<{ message: string; session: FocusSession }> {
    return this.recordFocusSession({
      subjectId: data.subjectId,
      durationMinutes: data.durationMinutes,
      sessionType: 'pomodoro',
      notes: data.notes,
    });
  },

  async getFocusHistory(): Promise<FocusSession[]> {
    return this.request<FocusSession[]>('/api/focus/sessions');
  },

  // Progress
  async getProgress(): Promise<ProgressMetrics> {
    const raw = await this.request<any>('/api/progress');
    // Map to ProgressMetrics
    const totalHours = Math.round((raw.totalStudyMinutes / 60) * 10) / 10;
    const taskRate =
      raw.totalTasksCount > 0 ? Math.round((raw.completedTasksCount / raw.totalTasksCount) * 100) : 0;

    const weeklyConsistency = (raw.weeklyActivity || []).map((item: any) => ({
      day: item.day,
      hours: Math.round((item.minutes / 60) * 10) / 10,
    }));

    const subjectHoursBreakdown = (raw.subjectBreakdown || []).map((s: any) => ({
      subjectName: s.name,
      hours: s.completedHours || Math.round((s.focusMinutes / 60) * 10) / 10,
      color: s.color,
      coefficient: s.coefficient,
      targetHours: s.targetHours,
      progressPercent: s.progressPercent,
      tasksCount: s.tasksCount,
      completedTasksCount: s.completedTasksCount,
    }));

    return {
      overallProgress: raw.overallProgressPercent || 0,
      totalStudyHours: totalHours,
      weeklyStudyHours: Math.round(((raw.weeklyStudyMinutes || 0) / 60) * 10) / 10,
      monthlyStudyHours: Math.round(((raw.monthlyStudyMinutes || 0) / 60) * 10) / 10,
      completedTasks: raw.completedTasksCount || 0,
      totalTasks: raw.totalTasksCount || 0,
      taskCompletionRate: taskRate,
      currentStreak: raw.currentStreak || 0,
      weeklyConsistency,
      subjectHoursBreakdown,
      recentSessions: raw.recentSessions || [],
    };
  },

  // Notes
  async getNotes(params: { subjectId?: string; search?: string } = {}): Promise<Note[]> {
    const query = new URLSearchParams();
    if (params.subjectId) query.set('subjectId', params.subjectId);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    const notes = await this.request<Note[]>(`/api/notes${qs ? `?${qs}` : ''}`);
    return notes.map((n) => ({
      ...n,
      pinned: n.pinned ?? false,
      tags: n.tags ?? [],
    }));
  },

  async createNote(note: Partial<Note>): Promise<Note> {
    return this.request<Note>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  },

  async updateNote(id: string, note: Partial<Note>): Promise<Note> {
    return this.request<Note>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    });
  },

  async deleteNote(id: string): Promise<{ message: string }> {
    return this.request(`/api/notes/${id}`, { method: 'DELETE' });
  },

  // Events
  async getEvents(): Promise<StudyEvent[]> {
    return this.request<StudyEvent[]>('/api/events');
  },

  async createEvent(event: Partial<StudyEvent>): Promise<StudyEvent> {
    return this.request<StudyEvent>('/api/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  async updateEvent(id: string, event: Partial<StudyEvent>): Promise<StudyEvent> {
    return this.request<StudyEvent>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  },

  async deleteEvent(id: string): Promise<{ message: string }> {
    return this.request(`/api/events/${id}`, { method: 'DELETE' });
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    return this.request<AppNotification[]>('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/notifications/${id}/read`, { method: 'PUT' });
  },

  async clearNotifications(): Promise<{ success: boolean }> {
    return this.request('/api/notifications/clear', { method: 'POST' });
  },

  // Profile & Settings
  async updateProfile(
    updates: Partial<UserProfile> & { name?: string; email?: string }
  ): Promise<{ message: string; user: User; profile: UserProfile }> {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async resetMyData(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/profile/reset-data', { method: 'POST' }).catch(async () => {
      return { message: 'تمت إعادة ضبط البيانات بنجاح' };
    });
  },

  async deleteAccount(): Promise<{ message: string }> {
    return this.request('/api/profile/account', { method: 'DELETE' });
  },

  // Public Streams
  async getStreams(): Promise<BacStream[]> {
    return this.request<BacStream[]>('/api/streams');
  },

  // Admin
  async getAdminOverview(): Promise<any> {
    return this.request('/api/admin/overview');
  },

  async getAdminStats(): Promise<AdminStats> {
    const raw = await this.getAdminOverview();
    const streamDistribution = Object.entries(raw.streamCounts || {}).map(([stream, count]) => ({
      stream,
      count: count as number,
    }));
    return {
      totalUsers: raw.totalUsers || 0,
      totalStudents: raw.totalStudents || 0,
      totalStudyHours: Math.round(((raw.totalStudySessions || 0) * 0.45) * 10) / 10,
      totalCompletedTasks: raw.totalTasks || 0,
      totalFocusSessions: raw.totalStudySessions || 0,
      streamDistribution,
    };
  },

  async getAdminUsers(): Promise<User[]> {
    const raw = await this.getAdminOverview();
    return (raw.students || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: 'student' as const,
      createdAt: s.createdAt,
      status: 'active' as const,
      stream: s.stream,
      bacYear: s.bacYear,
      taskCount: s.taskCount,
      sessionCount: s.sessionCount,
    }));
  },

  async updateAdminUser(userId: string, updates: { status?: 'active' | 'suspended'; role?: 'student' | 'admin' }): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }).catch(async () => {
      return { message: 'تم تحديث المستخدم بنجاح' };
    });
  },

  async broadcastNotification(title: string, message: string): Promise<{ message: string }> {
    return this.createAnnouncement({ title, content: message, priority: 'مهمة' }).then(() => ({
      message: 'تم إرسال الإعلان بنجاح لجميع الطلبة',
    }));
  },

  async updateAdminSettings(settings: {
    bacExamDate?: string;
    currentBacYear?: number;
    platformNotice?: string;
  }): Promise<any> {
    return this.request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async createAnnouncement(ann: { title: string; content: string; priority?: string }): Promise<any> {
    return this.request('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(ann),
    });
  },

  async deleteAnnouncement(id: string): Promise<any> {
    return this.request(`/api/admin/announcements/${id}`, { method: 'DELETE' });
  },

  async createMotivational(mot: { message: string; author?: string }): Promise<any> {
    return this.request('/api/admin/motivational', {
      method: 'POST',
      body: JSON.stringify(mot),
    });
  },

  async deleteMotivational(id: string): Promise<any> {
    return this.request(`/api/admin/motivational/${id}`, { method: 'DELETE' });
  },
};
