import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { dbService, verifyPassword } from './server/db.js';
import type { Task, StudyEvent, ScheduleSession, Note, FocusSession, Subject, UserProfile } from './src/types.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    profile?: UserProfile;
  };
}

// Authentication Middleware
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'الرجاء تسجيل الدخول أولاً' });
  }

  const token = authHeader.substring(7).trim();
  const user = dbService.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'جلسة الدخول منتهية الصلاحية أو غير صالحة' });
  }

  req.user = user;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح لك بالوصول إلى لوحة التحكم الإدارية' });
    }
    next();
  });
}

// Streak Calculation Helper
function calculateStreak(userId: string): number {
  const db = dbService.db;
  const userSessions = db.studySessions.filter((s) => s.userId === userId);
  const userTasks = db.tasks.filter((t) => t.userId === userId && t.status === 'مكتملة' && t.completedAt);

  const activeDates = new Set<string>();
  userSessions.forEach((s) => activeDates.add(s.date));
  userTasks.forEach((t) => {
    if (t.completedAt) {
      activeDates.add(t.completedAt.split('T')[0]);
    }
  });

  if (activeDates.size === 0) return 0;

  const today = new Date();
  let streak = 0;
  let checkDate = new Date(today);

  // Check if active today or yesterday
  const todayStr = checkDate.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) {
    return 0;
  }

  if (activeDates.has(todayStr)) {
    checkDate = today;
  } else {
    checkDate = yesterday;
  }

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (activeDates.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Days until BAC helper
function getDaysUntilBac(examDateStr: string): number {
  try {
    const exam = new Date(examDateStr);
    const now = new Date();
    // Normalize to midnight
    exam.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = exam.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  } catch {
    return 260;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), platform: 'NAJAH' });
  });

  // ------------------- AUTH ROUTES -------------------

  // Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password, bacStream, bacYear } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'يرجى ملء جميع الحقول الإلزامية (الاسم، البريد، كلمة المرور)' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور عن 6 أحرف' });
      }

      const streamName = bacStream || 'علوم تجريبية';
      const year = Number(bacYear) || 2027;

      const newUser = dbService.createUser(name, email, password, 'student');
      const token = dbService.createSession(newUser.id);

      // Create profile
      const defaultExamDate = dbService.db.settings.bacExamDate || `${year}-06-06`;
      const profile: UserProfile = {
        userId: newUser.id,
        bacStream: streamName,
        bacYear: year,
        dailyTargetHours: 3.5,
        preferredStudyHours: 'المساء (18:00 - 21:00)',
        onboardingCompleted: false, // Let user experience onboarding
        bacExamDate: defaultExamDate,
        theme: 'light',
        notifyTasks: true,
        notifyEvents: true,
      };
      dbService.db.profiles.push(profile);

      // Setup default subjects for the chosen stream
      dbService.setupUserSubjects(newUser.id, streamName);

      // Add welcoming notification
      dbService.db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: newUser.id,
        title: 'أهلاً بك في منصة نجاح!',
        message: 'تم إنشاء حسابك بنجاح وتجهيز مواد شعبتك. نتمنى لك رحلة مكللة بالتفوق والامتياز.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      });

      dbService.save();

      res.status(201).json({
        token,
        user: newUser,
        profile,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'حدث خطأ أثناء التسجيل' });
    }
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const db = dbService.db;
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const token = dbService.createSession(user.id);
    let profile = db.profiles.find((p) => p.userId === user.id);

    // If profile missing, initialize default
    if (!profile && user.role === 'student') {
      profile = {
        userId: user.id,
        bacStream: 'علوم تجريبية',
        bacYear: 2027,
        dailyTargetHours: 3.5,
        preferredStudyHours: 'المساء (18:00 - 21:00)',
        onboardingCompleted: true,
        bacExamDate: db.settings.bacExamDate || '2027-06-06',
        theme: 'light',
      };
      db.profiles.push(profile);
      dbService.setupUserSubjects(user.id, 'علوم تجريبية');
      dbService.save();
    }

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
      profile,
    });
  });

  // Current User (Session Check)
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({
      user: req.user,
      profile: req.user?.profile,
    });
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      dbService.deleteSession(token);
    }
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
  });

  // Forgot password
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني' });
    }
    const user = dbService.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      // Return success to avoid email enumeration
      return res.json({ message: 'إذا كان البريد مسجلاً، فقد تم إرسال تعليمات إعادة التعيين.' });
    }

    // In a production setup, an email token is mailed. Here we grant a temporary reset token:
    res.json({
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.',
      resetHint: 'يمكنك الآن إدخال كلمة المرور الجديدة مباشرة.',
      canResetDirectly: true,
      email: user.email,
    });
  });

  // Reset password
  app.post('/api/auth/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'يرجى كتابة كلمة مرور صالحة لا تقل عن 6 أحرف' });
    }
    const user = dbService.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const { hash, salt } = crypto.pbkdf2Sync
      ? {
          salt: crypto.randomBytes(16).toString('hex'),
          hash: crypto.pbkdf2Sync(newPassword, crypto.randomBytes(16).toString('hex'), 1000, 64, 'sha512').toString('hex'),
        }
      : { salt: '', hash: '' };

    // Re-hash cleanly
    const s = crypto.randomBytes(16).toString('hex');
    const h = crypto.pbkdf2Sync(newPassword, s, 1000, 64, 'sha512').toString('hex');
    user.salt = s;
    user.passwordHash = h;

    dbService.save();
    res.json({ message: 'تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.' });
  });

  // ------------------- ONBOARDING -------------------

  app.put('/api/onboarding', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { bacStream, bacYear, dailyTargetHours, preferredStudyHours } = req.body;

    const db = dbService.db;
    let profile = db.profiles.find((p) => p.userId === userId);

    if (!profile) {
      profile = {
        userId,
        bacStream: bacStream || 'علوم تجريبية',
        bacYear: Number(bacYear) || 2027,
        dailyTargetHours: Number(dailyTargetHours) || 3,
        preferredStudyHours: preferredStudyHours || 'المساء',
        onboardingCompleted: true,
        bacExamDate: db.settings.bacExamDate || '2027-06-06',
        theme: 'light',
      };
      db.profiles.push(profile);
    } else {
      if (bacStream && bacStream !== profile.bacStream) {
        profile.bacStream = bacStream;
        dbService.setupUserSubjects(userId, bacStream);
      }
      if (bacYear) profile.bacYear = Number(bacYear);
      if (dailyTargetHours) profile.dailyTargetHours = Number(dailyTargetHours);
      if (preferredStudyHours) profile.preferredStudyHours = preferredStudyHours;
      profile.onboardingCompleted = true;
    }

    dbService.save();
    res.json({ message: 'تم إكمال الإعداد الأولي بنجاح', profile });
  });

  // ------------------- DASHBOARD SUMMARY -------------------

  app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const db = dbService.db;
    const profile = db.profiles.find((p) => p.userId === userId) || {
      userId,
      bacStream: 'علوم تجريبية',
      bacYear: 2027,
      dailyTargetHours: 3.5,
      preferredStudyHours: 'المساء',
      onboardingCompleted: true,
      bacExamDate: db.settings.bacExamDate || '2027-06-06',
    };

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's tasks
    const allUserTasks = db.tasks.filter((t) => t.userId === userId);
    const todayTasks = allUserTasks.filter((t) => t.date === todayStr);
    const todayCompletedTasks = todayTasks.filter((t) => t.status === 'مكتملة');

    // Focus time today
    const userFocusSessions = db.studySessions.filter((s) => s.userId === userId);
    const todayFocusMinutes = userFocusSessions
      .filter((s) => s.date === todayStr)
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    // Days until BAC
    const daysRemaining = getDaysUntilBac(profile.bacExamDate || db.settings.bacExamDate || '2027-06-06');

    // Streak
    const streak = calculateStreak(userId);

    // Motivational quote (rotate or random active)
    const activeMotivations = db.motivationalMessages.filter((m) => m.active);
    const randomMot = activeMotivations.length > 0
      ? activeMotivations[Math.floor(Math.random() * activeMotivations.length)].message
      : 'خطوة صغيرة اليوم أفضل من ضغط كبير غداً.';

    // Upcoming events (today and future)
    const userEvents = db.events
      .filter((e) => e.userId === userId && e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);

    // Subjects summary with computed progress
    const userSubjects = db.subjects.filter((s) => s.userId === userId);
    const subjectsSummary = userSubjects.map((sub) => {
      const subTasks = allUserTasks.filter((t) => t.subjectId === sub.id);
      const subCompleted = subTasks.filter((t) => t.status === 'مكتملة');
      const progressPercent = sub.targetHours > 0
        ? Math.min(100, Math.round((sub.completedHours / sub.targetHours) * 100))
        : subTasks.length > 0
        ? Math.round((subCompleted.length / subTasks.length) * 100)
        : 0;

      return {
        id: sub.id,
        name: sub.name,
        color: sub.color,
        coefficient: sub.coefficient,
        tasksTotal: subTasks.length,
        tasksCompleted: subCompleted.length,
        progressPercent,
      };
    });

    // Overall progress percent across all subjects
    const totalTargetHours = userSubjects.reduce((acc, s) => acc + (s.targetHours || 0), 0);
    const totalCompletedHours = userSubjects.reduce((acc, s) => acc + (s.completedHours || 0), 0);
    const overallProgressPercent = totalTargetHours > 0
      ? Math.min(100, Math.round((totalCompletedHours / totalTargetHours) * 100))
      : allUserTasks.length > 0
      ? Math.round((allUserTasks.filter((t) => t.status === 'مكتملة').length / allUserTasks.length) * 100)
      : 0;

    // Week overview (last 7 days)
    const weekOverview = [];
    const arabicDaysShort = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = arabicDaysShort[d.getDay()];

      const dayMinutes = userFocusSessions
        .filter((s) => s.date === dStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      const dayTasks = allUserTasks.filter((t) => t.completedAt && t.completedAt.startsWith(dStr)).length;

      weekOverview.push({
        day: dayName,
        date: dStr,
        studiedMinutes: dayMinutes,
        tasksCompleted: dayTasks,
      });
    }

    res.json({
      todayDate: todayStr,
      daysRemainingUntilBac: daysRemaining,
      bacExamDate: profile.bacExamDate,
      dailyTargetHours: profile.dailyTargetHours,
      todayStudyMinutes: todayFocusMinutes,
      todayTasksCount: todayTasks.length,
      todayCompletedTasksCount: todayCompletedTasks.length,
      overallProgressPercent,
      currentStreak: streak,
      motivationalMessage: randomMot,
      todayTasks,
      upcomingEvents: userEvents,
      weekOverview,
      subjectsSummary,
    });
  });

  // ------------------- SUBJECTS -------------------

  app.get('/api/subjects', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const db = dbService.db;
    let subjects = db.subjects.filter((s) => s.userId === userId);

    if (subjects.length === 0) {
      // Auto setup if empty
      const profile = db.profiles.find((p) => p.userId === userId);
      const streamName = profile?.bacStream || 'علوم تجريبية';
      subjects = dbService.setupUserSubjects(userId, streamName);
    }

    const tasks = db.tasks.filter((t) => t.userId === userId);
    const notes = db.notes.filter((n) => n.userId === userId);

    const detailedSubjects = subjects.map((sub) => {
      const subTasks = tasks.filter((t) => t.subjectId === sub.id);
      const completedTasks = subTasks.filter((t) => t.status === 'مكتملة');
      const subNotes = notes.filter((n) => n.subjectId === sub.id);

      return {
        ...sub,
        tasksCount: subTasks.length,
        completedTasksCount: completedTasks.length,
        notesCount: subNotes.length,
      };
    });

    res.json(detailedSubjects);
  });

  app.post('/api/subjects', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { name, coefficient, color, priority, targetHours } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'اسم المادة مطلوب' });
    }

    const newSub: Subject = {
      id: `subj_${Date.now()}`,
      userId,
      name,
      coefficient: Number(coefficient) || 2,
      color: color || '#2563EB',
      priority: priority || 'متوسطة',
      targetHours: Number(targetHours) || 30,
      completedHours: 0,
    };

    dbService.db.subjects.push(newSub);
    dbService.save();
    res.status(201).json(newSub);
  });

  app.put('/api/subjects/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const subId = req.params.id;
    const subject = dbService.db.subjects.find((s) => s.id === subId && s.userId === userId);

    if (!subject) {
      return res.status(404).json({ error: 'المادة غير موجودة' });
    }

    const { name, coefficient, color, priority, targetHours, completedHours } = req.body;
    if (name !== undefined) subject.name = name;
    if (coefficient !== undefined) subject.coefficient = Number(coefficient);
    if (color !== undefined) subject.color = color;
    if (priority !== undefined) subject.priority = priority;
    if (targetHours !== undefined) subject.targetHours = Number(targetHours);
    if (completedHours !== undefined) subject.completedHours = Number(completedHours);

    dbService.save();
    res.json(subject);
  });

  app.delete('/api/subjects/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const subId = req.params.id;

    dbService.db.subjects = dbService.db.subjects.filter((s) => !(s.id === subId && s.userId === userId));
    // Cleanup tasks with this subject
    dbService.db.tasks = dbService.db.tasks.filter((t) => !(t.subjectId === subId && t.userId === userId));
    dbService.save();
    res.json({ message: 'تم حذف المادة بنجاح' });
  });

  // ------------------- TASKS -------------------

  app.get('/api/tasks', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { filter, subjectId, sort } = req.query;
    const db = dbService.db;

    let tasks = db.tasks.filter((t) => t.userId === userId);
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter by subject
    if (subjectId && typeof subjectId === 'string' && subjectId !== 'all') {
      tasks = tasks.filter((t) => t.subjectId === subjectId);
    }

    // Filter type
    if (filter === 'today') {
      tasks = tasks.filter((t) => t.date === todayStr);
    } else if (filter === 'completed') {
      tasks = tasks.filter((t) => t.status === 'مكتملة');
    } else if (filter === 'uncompleted') {
      tasks = tasks.filter((t) => t.status !== 'مكتملة');
    } else if (filter === 'week') {
      const now = new Date();
      const endOfWeek = new Date();
      endOfWeek.setDate(now.getDate() + 7);
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
      tasks = tasks.filter((t) => t.date >= todayStr && t.date <= endOfWeekStr);
    }

    // Attach subject details if missing
    const userSubjects = db.subjects.filter((s) => s.userId === userId);
    const subMap = new Map(userSubjects.map((s) => [s.id, s]));

    tasks = tasks.map((t) => ({
      ...t,
      subjectName: subMap.get(t.subjectId)?.name || t.subjectName || 'عام',
      subjectColor: subMap.get(t.subjectId)?.color || t.subjectColor || '#3B82F6',
    }));

    // Sorting
    if (sort === 'priority') {
      const order: Record<string, number> = { عالية: 3, متوسطة: 2, منخفضة: 1 };
      tasks.sort((a, b) => (order[b.priority] || 0) - (order[a.priority] || 0));
    } else if (sort === 'status') {
      const order: Record<string, number> = { 'قيد الإنجاز': 3, 'لم تبدأ': 2, مكتملة: 1 };
      tasks.sort((a, b) => (order[b.status] || 0) - (order[a.status] || 0));
    } else {
      // Sort by date then time
      tasks.sort((a, b) => {
        const dDiff = a.date.localeCompare(b.date);
        if (dDiff !== 0) return dDiff;
        return (a.time || '23:59').localeCompare(b.time || '23:59');
      });
    }

    res.json(tasks);
  });

  app.post('/api/tasks', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { title, subjectId, description, date, time, priority, estimatedDurationMins } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'عنوان المهمة مطلوب' });
    }

    if (!subjectId || !subjectId.trim()) {
      return res.status(400).json({ error: 'يرجى ربط المهمة بمادة دراسية من قائمة موادك' });
    }

    const db = dbService.db;
    const subject = db.subjects.find((s) => s.id === subjectId && s.userId === userId);

    if (!subject) {
      return res.status(400).json({ error: 'المادة الدراسية المحددة غير موجودة في قاعدة بياناتك' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      subjectId: subject.id,
      subjectName: subject.name,
      subjectColor: subject.color,
      title: title.trim(),
      description: description || '',
      date: date || todayStr,
      time: time || undefined,
      priority: priority || 'متوسطة',
      status: 'لم تبدأ',
      estimatedDurationMins: Number(estimatedDurationMins) || 30,
      createdAt: new Date().toISOString(),
    };

    db.tasks.push(newTask);
    dbService.save();
    res.status(201).json(newTask);
  });

  app.put('/api/tasks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const taskId = req.params.id;
    const db = dbService.db;
    const task = db.tasks.find((t) => t.id === taskId && t.userId === userId);

    if (!task) {
      return res.status(404).json({ error: 'المهمة غير موجودة' });
    }

    const { title, subjectId, description, date, time, priority, status, estimatedDurationMins, postponeDays } = req.body;

    if (title !== undefined) task.title = title.trim();
    if (subjectId !== undefined) {
      const sub = db.subjects.find((s) => s.id === subjectId && s.userId === userId);
      if (!sub) {
        return res.status(400).json({ error: 'المادة الدراسية المحددة غير موجودة في قاعدة بياناتك' });
      }
      task.subjectId = sub.id;
      task.subjectName = sub.name;
      task.subjectColor = sub.color;
    }
    if (description !== undefined) task.description = description;
    if (date !== undefined) task.date = date;
    if (time !== undefined) task.time = time;
    if (priority !== undefined) task.priority = priority;
    if (estimatedDurationMins !== undefined) task.estimatedDurationMins = Number(estimatedDurationMins);

    // Postpone action
    if (postponeDays) {
      const d = new Date(task.date);
      d.setDate(d.getDate() + Number(postponeDays));
      task.date = d.toISOString().split('T')[0];
    }

    // Status change & completion handling
    if (status !== undefined) {
      task.status = status;
      if (status === 'مكتملة') {
        task.completedAt = new Date().toISOString();
        // If task has duration and subject, slightly credit the subject's completed hours
        if (task.subjectId && task.estimatedDurationMins) {
          const subject = db.subjects.find((s) => s.id === task.subjectId && s.userId === userId);
          if (subject) {
            const addedHours = Math.round((task.estimatedDurationMins / 60) * 10) / 10;
            subject.completedHours = Math.round((subject.completedHours + addedHours) * 10) / 10;
          }
        }
      } else {
        task.completedAt = undefined;
      }
    }

    dbService.save();
    res.json(task);
  });

  app.delete('/api/tasks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const taskId = req.params.id;

    dbService.db.tasks = dbService.db.tasks.filter((t) => !(t.id === taskId && t.userId === userId));
    dbService.save();
    res.json({ message: 'تم حذف المهمة بنجاح' });
  });

  // ------------------- WEEKLY STUDY SCHEDULE -------------------

  app.get('/api/schedule', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const db = dbService.db;
    const sessions = db.scheduleSessions.filter((s) => s.userId === userId);
    const subjects = db.subjects.filter((s) => s.userId === userId);
    const subMap = new Map(subjects.map((s) => [s.id, s]));

    const enriched = sessions.map((s) => ({
      ...s,
      subjectName: subMap.get(s.subjectId)?.name || s.subjectName || 'مادة دراسية',
      subjectColor: subMap.get(s.subjectId)?.color || s.subjectColor || '#3B82F6',
    }));

    res.json(enriched);
  });

  app.post('/api/schedule', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { dayOfWeek, day, startTime, endTime, subjectId, goal, notes, priority, completed } = req.body;
    const assignedDay = dayOfWeek || day;

    if (!assignedDay || !startTime || !endTime || !subjectId) {
      return res.status(400).json({ error: 'يرجى تحديد اليوم، وقت البداية والنهاية، والمادة' });
    }

    const db = dbService.db;
    const sub = db.subjects.find((s) => s.id === subjectId && s.userId === userId);

    const newSession: ScheduleSession = {
      id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      dayOfWeek: assignedDay,
      day: assignedDay,
      startTime,
      endTime,
      subjectId,
      subjectName: sub?.name || 'مادة دراسية',
      subjectColor: sub?.color || '#3B82F6',
      goal: goal || 'مراجعة وحل تمارين',
      notes: notes || '',
      priority: priority || 'متوسطة',
      completed: !!completed,
    };

    db.scheduleSessions.push(newSession);
    dbService.save();
    res.status(201).json(newSession);
  });

  app.put('/api/schedule/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const schId = req.params.id;
    const db = dbService.db;
    const session = db.scheduleSessions.find((s) => s.id === schId && s.userId === userId);

    if (!session) {
      return res.status(404).json({ error: 'الجلسة غير موجودة' });
    }

    const { dayOfWeek, day, startTime, endTime, subjectId, goal, notes, priority, completed } = req.body;
    const assignedDay = dayOfWeek || day;
    if (assignedDay) {
      session.dayOfWeek = assignedDay;
      session.day = assignedDay;
    }
    if (startTime) session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    if (priority !== undefined) session.priority = priority;
    if (completed !== undefined) session.completed = completed;
    if (subjectId) {
      session.subjectId = subjectId;
      const sub = db.subjects.find((s) => s.id === subjectId && s.userId === userId);
      if (sub) {
        session.subjectName = sub.name;
        session.subjectColor = sub.color;
      }
    }
    if (goal !== undefined) session.goal = goal;
    if (notes !== undefined) session.notes = notes;

    dbService.save();
    res.json(session);
  });

  app.delete('/api/schedule/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const schId = req.params.id;

    dbService.db.scheduleSessions = dbService.db.scheduleSessions.filter((s) => !(s.id === schId && s.userId === userId));
    dbService.save();
    res.json({ message: 'تم حذف الجلسة من الجدول' });
  });

  // ------------------- FOCUS TIMER & SESSIONS -------------------

  app.get('/api/focus/sessions', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const sessions = dbService.db.studySessions
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    res.json(sessions);
  });

  app.post('/api/focus/sessions', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { subjectId, durationMinutes, sessionType } = req.body;

    const duration = Number(durationMinutes) || 25;
    const db = dbService.db;
    const sub = db.subjects.find((s) => s.id === subjectId && s.userId === userId);
    const todayStr = new Date().toISOString().split('T')[0];

    const session: FocusSession = {
      id: `foc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      subjectId: subjectId || undefined,
      subjectName: sub?.name || 'مذاكرة عامة',
      durationMinutes: duration,
      completedAt: new Date().toISOString(),
      sessionType: sessionType || 'pomodoro',
      date: todayStr,
    };

    db.studySessions.push(session);

    // Update subject completed hours
    if (sub) {
      const addedHours = Math.round((duration / 60) * 10) / 10;
      sub.completedHours = Math.round((sub.completedHours + addedHours) * 10) / 10;
    }

    dbService.save();
    res.status(201).json({
      message: 'أحسنت! أنهيت جلسة تركيز.',
      session,
    });
  });

  // ------------------- PROGRESS STATS -------------------

  app.get('/api/progress', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const db = dbService.db;
    const userSessions = db.studySessions.filter((s) => s.userId === userId);
    const userTasks = db.tasks.filter((t) => t.userId === userId);
    const userSubjects = db.subjects.filter((s) => s.userId === userId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Total focus time (all time, daily, weekly, monthly)
    const totalMinutes = userSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    const dailyMinutes = userSessions
      .filter((s) => s.date === todayStr)
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weeklyMinutes = userSessions
      .filter((s) => s.date >= weekAgo)
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthlyMinutes = userSessions
      .filter((s) => s.date >= monthAgo)
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    // Subject breakdown
    const subjectBreakdown = userSubjects.map((sub) => {
      const subTasks = userTasks.filter((t) => t.subjectId === sub.id);
      const subCompletedTasks = subTasks.filter((t) => t.status === 'مكتملة');
      const subSessions = userSessions.filter((s) => s.subjectId === sub.id);
      const subMinutes = subSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

      const progressPercent = sub.targetHours > 0
        ? Math.min(100, Math.round((sub.completedHours / sub.targetHours) * 100))
        : subTasks.length > 0
        ? Math.round((subCompletedTasks.length / subTasks.length) * 100)
        : 0;

      return {
        id: sub.id,
        name: sub.name,
        color: sub.color,
        coefficient: sub.coefficient,
        targetHours: sub.targetHours,
        completedHours: sub.completedHours,
        focusMinutes: subMinutes,
        tasksCount: subTasks.length,
        completedTasksCount: subCompletedTasks.length,
        progressPercent,
      };
    });

    // Overall progress
    const totalTarget = userSubjects.reduce((acc, s) => acc + (s.targetHours || 0), 0);
    const totalCompleted = userSubjects.reduce((acc, s) => acc + (s.completedHours || 0), 0);
    const overallProgressPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100)) : 0;

    // Weekly activity trend (last 7 days)
    const arabicDaysShort = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = arabicDaysShort[d.getDay()];

      const mins = userSessions.filter((s) => s.date === dStr).reduce((sum, s) => sum + s.durationMinutes, 0);
      const completedTasks = userTasks.filter((t) => t.completedAt && t.completedAt.startsWith(dStr)).length;

      weeklyActivity.push({
        date: dStr,
        day: dayName,
        minutes: mins,
        completedTasks,
      });
    }

    res.json({
      overallProgressPercent,
      totalStudyMinutes: totalMinutes,
      dailyStudyMinutes: dailyMinutes,
      weeklyStudyMinutes: weeklyMinutes,
      monthlyStudyMinutes: monthlyMinutes,
      completedTasksCount: userTasks.filter((t) => t.status === 'مكتملة').length,
      totalTasksCount: userTasks.length,
      currentStreak: calculateStreak(userId),
      completedSessionsCount: userSessions.length,
      subjectBreakdown,
      weeklyActivity,
      recentSessions: userSessions.slice(0, 10),
    });
  });

  // ------------------- NOTES -------------------

  app.get('/api/notes', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { subjectId, search } = req.query;
    const db = dbService.db;
    let notes = db.notes.filter((n) => n.userId === userId);

    if (subjectId && typeof subjectId === 'string' && subjectId !== 'all') {
      notes = notes.filter((n) => n.subjectId === subjectId);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      notes = notes.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    const subjects = db.subjects.filter((s) => s.userId === userId);
    const subMap = new Map(subjects.map((s) => [s.id, s]));

    const enriched = notes.map((n) => ({
      ...n,
      subjectName: n.subjectId ? subMap.get(n.subjectId)?.name : 'عام',
    }));

    enriched.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    res.json(enriched);
  });

  app.post('/api/notes', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { title, content, subjectId, taskId, handwrittenData, pinned, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'عنوان الملاحظة مطلوب' });
    }

    const db = dbService.db;
    const sub = subjectId ? db.subjects.find((s) => s.id === subjectId && s.userId === userId) : null;

    const newNote: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      subjectId: subjectId || undefined,
      subjectName: sub?.name || 'عام',
      taskId: taskId || undefined,
      title: title.trim(),
      content: content || '',
      pinned: !!pinned,
      handwrittenData: handwrittenData || undefined,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.notes.push(newNote);
    dbService.save();
    res.status(201).json(newNote);
  });

  app.put('/api/notes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const db = dbService.db;
    const note = db.notes.find((n) => n.id === noteId && n.userId === userId);

    if (!note) {
      return res.status(404).json({ error: 'الملاحظة غير موجودة' });
    }

    const { title, content, subjectId, handwrittenData, pinned, tags } = req.body;
    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (handwrittenData !== undefined) note.handwrittenData = handwrittenData;
    if (pinned !== undefined) note.pinned = pinned;
    if (tags !== undefined) note.tags = Array.isArray(tags) ? tags : [];
    if (subjectId !== undefined) {
      note.subjectId = subjectId || undefined;
      const sub = subjectId ? db.subjects.find((s) => s.id === subjectId && s.userId === userId) : null;
      note.subjectName = sub?.name || 'عام';
    }
    note.updatedAt = new Date().toISOString();

    dbService.save();
    res.json(note);
  });

  app.delete('/api/notes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const noteId = req.params.id;

    dbService.db.notes = dbService.db.notes.filter((n) => !(n.id === noteId && n.userId === userId));
    dbService.save();
    res.json({ message: 'تم حذف الملاحظة بنجاح' });
  });

  // ------------------- EVENTS -------------------

  app.get('/api/events', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const events = dbService.db.events
      .filter((e) => e.userId === userId)
      .sort((a, b) => a.date.localeCompare(b.date));
    res.json(events);
  });

  app.post('/api/events', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { title, date, time, type, notes } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'عنوان وتاريخ الحدث مطلوبان' });
    }

    const newEvent: StudyEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      title: title.trim(),
      date,
      time: time || undefined,
      type: type || 'امتحان',
      notes: notes || '',
    };

    dbService.db.events.push(newEvent);
    dbService.save();
    res.status(201).json(newEvent);
  });

  app.put('/api/events/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const evtId = req.params.id;
    const event = dbService.db.events.find((e) => e.id === evtId && e.userId === userId);

    if (!event) {
      return res.status(404).json({ error: 'الحدث غير موجود' });
    }

    const { title, date, time, type, notes } = req.body;
    if (title !== undefined) event.title = title.trim();
    if (date !== undefined) event.date = date;
    if (time !== undefined) event.time = time;
    if (type !== undefined) event.type = type;
    if (notes !== undefined) event.notes = notes;

    dbService.save();
    res.json(event);
  });

  app.delete('/api/events/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const evtId = req.params.id;

    dbService.db.events = dbService.db.events.filter((e) => !(e.id === evtId && e.userId === userId));
    dbService.save();
    res.json({ message: 'تم حذف الحدث بنجاح' });
  });

  // ------------------- NOTIFICATIONS -------------------

  app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const notifs = dbService.db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(notifs);
  });

  app.put('/api/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const notifId = req.params.id;
    const notif = dbService.db.notifications.find((n) => n.id === notifId && n.userId === userId);
    if (notif) {
      notif.read = true;
      dbService.save();
    }
    res.json({ success: true });
  });

  app.post('/api/notifications/clear', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    dbService.db.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    dbService.save();
    res.json({ success: true });
  });

  // ------------------- PROFILE & SETTINGS -------------------

  app.put('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const db = dbService.db;
    const user = db.users.find((u) => u.id === userId);
    let profile = db.profiles.find((p) => p.userId === userId);

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const {
      name,
      email,
      bacStream,
      bacYear,
      dailyTargetHours,
      preferredStudyHours,
      bacExamDate,
      theme,
      notifyTasks,
      notifyEvents,
    } = req.body;

    if (name) user.name = name.trim();
    if (email && email.toLowerCase() !== user.email) {
      const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.id !== userId);
      if (existing) {
        return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (!profile) {
      profile = {
        userId,
        bacStream: bacStream || 'علوم تجريبية',
        bacYear: Number(bacYear) || 2027,
        dailyTargetHours: Number(dailyTargetHours) || 3.5,
        preferredStudyHours: preferredStudyHours || 'المساء',
        onboardingCompleted: true,
        bacExamDate: bacExamDate || db.settings.bacExamDate || '2027-06-06',
        theme: theme || 'light',
      };
      db.profiles.push(profile);
    } else {
      if (bacStream && bacStream !== profile.bacStream) {
        profile.bacStream = bacStream;
        // Optionally update default subjects if requested
      }
      if (bacYear) profile.bacYear = Number(bacYear);
      if (dailyTargetHours) profile.dailyTargetHours = Number(dailyTargetHours);
      if (preferredStudyHours !== undefined) profile.preferredStudyHours = preferredStudyHours;
      if (bacExamDate) profile.bacExamDate = bacExamDate;
      if (theme) profile.theme = theme;
      if (notifyTasks !== undefined) profile.notifyTasks = notifyTasks;
      if (notifyEvents !== undefined) profile.notifyEvents = notifyEvents;
    }

    dbService.save();
    res.json({
      message: 'تم حفظ الإعدادات بنجاح',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
      profile,
    });
  });

  app.delete('/api/profile/account', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const db = dbService.db;

    // Completely wipe all user isolated data
    db.users = db.users.filter((u) => u.id !== userId);
    db.profiles = db.profiles.filter((p) => p.userId !== userId);
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
    db.subjects = db.subjects.filter((s) => s.userId !== userId);
    db.tasks = db.tasks.filter((t) => t.userId !== userId);
    db.studySessions = db.studySessions.filter((s) => s.userId !== userId);
    db.scheduleSessions = db.scheduleSessions.filter((s) => s.userId !== userId);
    db.notes = db.notes.filter((n) => n.userId !== userId);
    db.events = db.events.filter((e) => e.userId !== userId);
    db.notifications = db.notifications.filter((n) => n.userId !== userId);

    dbService.save();
    res.json({ message: 'تم حذف الحساب وجميع البيانات نهائياً' });
  });

  // ------------------- PUBLIC STREAMS & ANNOUNCEMENTS -------------------

  app.get('/api/streams', (req, res) => {
    res.json(dbService.db.streams);
  });

  app.get('/api/announcements', (req, res) => {
    res.json(dbService.db.announcements.filter((a) => a.active));
  });

  // ------------------- ADMIN PANEL (Protected) -------------------

  app.get('/api/admin/overview', requireAdmin, (req, res) => {
    const db = dbService.db;
    const students = db.users
      .filter((u) => u.role === 'student')
      .map((u) => {
        const p = db.profiles.find((prof) => prof.userId === u.id);
        const taskCount = db.tasks.filter((t) => t.userId === u.id).length;
        const sessionCount = db.studySessions.filter((s) => s.userId === u.id).length;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
          stream: p?.bacStream || 'غير محدد',
          bacYear: p?.bacYear || 2027,
          taskCount,
          sessionCount,
        };
      });

    // Stream distribution
    const streamCounts: Record<string, number> = {};
    students.forEach((s) => {
      streamCounts[s.stream] = (streamCounts[s.stream] || 0) + 1;
    });

    res.json({
      totalUsers: db.users.length,
      totalStudents: students.length,
      totalTasks: db.tasks.length,
      totalStudySessions: db.studySessions.length,
      students,
      streamCounts,
      streams: db.streams,
      motivationalMessages: db.motivationalMessages,
      announcements: db.announcements,
      settings: db.settings,
    });
  });

  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const { bacExamDate, currentBacYear, platformNotice } = req.body;
    const db = dbService.db;

    if (bacExamDate) db.settings.bacExamDate = bacExamDate;
    if (currentBacYear) db.settings.currentBacYear = Number(currentBacYear);
    if (platformNotice !== undefined) db.settings.platformNotice = platformNotice;

    dbService.save();
    res.json({ message: 'تم تحديث إعدادات المنصة بنجاح', settings: db.settings });
  });

  app.post('/api/admin/announcements', requireAdmin, (req, res) => {
    const { title, content, priority } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'العنوان والمحتوى مطلوبان' });
    }

    const ann = {
      id: `ann_${Date.now()}`,
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      priority: priority || 'عادية',
      active: true,
    };

    dbService.db.announcements.unshift(ann);
    dbService.save();
    res.status(201).json(ann);
  });

  app.delete('/api/admin/announcements/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    dbService.db.announcements = dbService.db.announcements.filter((a) => a.id !== id);
    dbService.save();
    res.json({ message: 'تم حذف الإعلان' });
  });

  app.post('/api/admin/motivational', requireAdmin, (req, res) => {
    const { message, author } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'نص الرسالة مطلوب' });
    }

    const newMot = {
      id: `mot_${Date.now()}`,
      message,
      author: author || 'فريق نجاح',
      active: true,
    };

    dbService.db.motivationalMessages.push(newMot);
    dbService.save();
    res.status(201).json(newMot);
  });

  app.delete('/api/admin/motivational/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    dbService.db.motivationalMessages = dbService.db.motivationalMessages.filter((m) => m.id !== id);
    dbService.save();
    res.json({ message: 'تم حذف الرسالة التحفيزية' });
  });

  // ------------------- VITE & STATIC SERVING -------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NAJAH Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
