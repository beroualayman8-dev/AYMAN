import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  User,
  UserProfile,
  BacStream,
  Subject,
  Task,
  ScheduleSession,
  FocusSession,
  Note,
  StudyEvent,
  AppNotification,
  MotivationalMessage,
  Announcement,
  SystemSettings,
} from '../src/types.js';

export interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  sessions: { token: string; userId: string; createdAt: string; expiresAt: string }[];
  profiles: UserProfile[];
  streams: BacStream[];
  subjects: Subject[];
  tasks: Task[];
  studySessions: FocusSession[];
  scheduleSessions: ScheduleSession[];
  notes: Note[];
  events: StudyEvent[];
  notifications: AppNotification[];
  motivationalMessages: MotivationalMessage[];
  announcements: Announcement[];
  settings: SystemSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'najah_db.json');

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return check === hash;
}

const DEFAULT_STREAMS: BacStream[] = [
  {
    id: 'stream-sciences',
    name: 'علوم تجريبية',
    code: 'experimental_sciences',
    description: 'شعبة العلوم التجريبية: تركيز مكثف على علوم الطبيعة والحياة والرياضيات والفيزياء.',
    defaultSubjects: [
      { name: 'علوم الطبيعة والحياة', code: 'SCI', coefficient: 6, color: '#059669', defaultHoursTarget: 60 },
      { name: 'الرياضيات', code: 'MATH', coefficient: 5, color: '#2563EB', defaultHoursTarget: 50 },
      { name: 'العلوم الفيزيائية', code: 'PHYS', coefficient: 5, color: '#7C3AED', defaultHoursTarget: 50 },
      { name: 'اللغة العربية وآدابها', code: 'AR', coefficient: 2, color: '#D97706', defaultHoursTarget: 25 },
      { name: 'الفلسفة', code: 'PHIL', coefficient: 2, color: '#DC2626', defaultHoursTarget: 25 },
      { name: 'اللغة الفرنسية', code: 'FR', coefficient: 2, color: '#0284C7', defaultHoursTarget: 20 },
      { name: 'اللغة الإنجليزية', code: 'EN', coefficient: 2, color: '#4F46E5', defaultHoursTarget: 20 },
      { name: 'التاريخ والجغرافيا', code: 'HIST', coefficient: 2, color: '#84CC16', defaultHoursTarget: 25 },
      { name: 'العلوم الإسلامية', code: 'ISLAM', coefficient: 2, color: '#10B981', defaultHoursTarget: 20 },
    ],
  },
  {
    id: 'stream-math',
    name: 'رياضيات',
    code: 'mathematics',
    description: 'شعبة الرياضيات: تفوق رياضي وفيزيائي عميق مع معامل مرتفع.',
    defaultSubjects: [
      { name: 'الرياضيات', code: 'MATH', coefficient: 7, color: '#2563EB', defaultHoursTarget: 70 },
      { name: 'العلوم الفيزيائية', code: 'PHYS', coefficient: 6, color: '#7C3AED', defaultHoursTarget: 60 },
      { name: 'علوم الطبيعة والحياة', code: 'SCI', coefficient: 2, color: '#059669', defaultHoursTarget: 25 },
      { name: 'اللغة العربية وآدابها', code: 'AR', coefficient: 2, color: '#D97706', defaultHoursTarget: 25 },
      { name: 'الفلسفة', code: 'PHIL', coefficient: 2, color: '#DC2626', defaultHoursTarget: 25 },
      { name: 'اللغة الفرنسية', code: 'FR', coefficient: 2, color: '#0284C7', defaultHoursTarget: 20 },
      { name: 'اللغة الإنجليزية', code: 'EN', coefficient: 2, color: '#4F46E5', defaultHoursTarget: 20 },
      { name: 'التاريخ والجغرافيا', code: 'HIST', coefficient: 2, color: '#84CC16', defaultHoursTarget: 25 },
      { name: 'العلوم الإسلامية', code: 'ISLAM', coefficient: 2, color: '#10B981', defaultHoursTarget: 20 },
    ],
  },
  {
    id: 'stream-tech',
    name: 'تقني رياضي',
    code: 'math_technical',
    description: 'شعبة تقني رياضي (هندسة ميكانيكية، كهربائية، مدنية، طرائق).',
    defaultSubjects: [
      { name: 'التكنولوجيا (الهندسة)', code: 'TECH', coefficient: 6, color: '#0D9488', defaultHoursTarget: 60 },
      { name: 'الرياضيات', code: 'MATH', coefficient: 6, color: '#2563EB', defaultHoursTarget: 60 },
      { name: 'العلوم الفيزيائية', code: 'PHYS', coefficient: 6, color: '#7C3AED', defaultHoursTarget: 60 },
      { name: 'اللغة العربية وآدابها', code: 'AR', coefficient: 2, color: '#D97706', defaultHoursTarget: 25 },
      { name: 'الفلسفة', code: 'PHIL', coefficient: 2, color: '#DC2626', defaultHoursTarget: 25 },
      { name: 'اللغة الفرنسية', code: 'FR', coefficient: 2, color: '#0284C7', defaultHoursTarget: 20 },
      { name: 'اللغة الإنجليزية', code: 'EN', coefficient: 2, color: '#4F46E5', defaultHoursTarget: 20 },
      { name: 'التاريخ والجغرافيا', code: 'HIST', coefficient: 2, color: '#84CC16', defaultHoursTarget: 25 },
      { name: 'العلوم الإسلامية', code: 'ISLAM', coefficient: 2, color: '#10B981', defaultHoursTarget: 20 },
    ],
  },
  {
    id: 'stream-gestion',
    name: 'تسيير واقتصاد',
    code: 'management_economics',
    description: 'شعبة تسيير واقتصاد: محاسبة، مناجمنت، قانون واقتصاد تحليلي.',
    defaultSubjects: [
      { name: 'التسيير المحاسبي والمالي', code: 'COMPTA', coefficient: 6, color: '#0891B2', defaultHoursTarget: 60 },
      { name: 'الاقتصاد والمناجمنت', code: 'ECO', coefficient: 5, color: '#059669', defaultHoursTarget: 50 },
      { name: 'الرياضيات', code: 'MATH', coefficient: 5, color: '#2563EB', defaultHoursTarget: 50 },
      { name: 'التاريخ والجغرافيا', code: 'HIST', coefficient: 4, color: '#D97706', defaultHoursTarget: 40 },
      { name: 'القانون', code: 'LAW', coefficient: 2, color: '#9333EA', defaultHoursTarget: 25 },
      { name: 'الفلسفة', code: 'PHIL', coefficient: 2, color: '#DC2626', defaultHoursTarget: 25 },
      { name: 'اللغة العربية', code: 'AR', coefficient: 2, color: '#EA580C', defaultHoursTarget: 25 },
      { name: 'اللغات الأجنبية (فرنسية/إنجليزية)', code: 'LANG', coefficient: 4, color: '#4F46E5', defaultHoursTarget: 30 },
      { name: 'العلوم الإسلامية', code: 'ISLAM', coefficient: 2, color: '#10B981', defaultHoursTarget: 20 },
    ],
  },
  {
    id: 'stream-lettres',
    name: 'آداب وفلسفة',
    code: 'literature_philosophy',
    description: 'شعبة آداب وفلسفة: إتقان المقالات الفلسفية، البلاغة الأدبية والتحليل التاريخي.',
    defaultSubjects: [
      { name: 'الفلسفة', code: 'PHIL', coefficient: 6, color: '#DC2626', defaultHoursTarget: 65 },
      { name: 'اللغة العربية وآدابها', code: 'AR', coefficient: 6, color: '#D97706', defaultHoursTarget: 65 },
      { name: 'التاريخ والجغرافيا', code: 'HIST', coefficient: 4, color: '#059669', defaultHoursTarget: 45 },
      { name: 'اللغة الفرنسية', code: 'FR', coefficient: 3, color: '#0284C7', defaultHoursTarget: 30 },
      { name: 'اللغة الإنجليزية', code: 'EN', coefficient: 3, color: '#4F46E5', defaultHoursTarget: 30 },
      { name: 'العلوم الإسلامية', code: 'ISLAM', coefficient: 2, color: '#10B981', defaultHoursTarget: 20 },
      { name: 'الرياضيات', code: 'MATH', coefficient: 2, color: '#64748B', defaultHoursTarget: 20 },
    ],
  },
  {
    id: 'stream-langues',
    name: 'لغات أجنبية',
    code: 'foreign_languages',
    description: 'شعبة لغات أجنبية: لغات حية (عربية، فرنسية، إنجليزية ولغة ثالثة: إسبانية/ألمانية/إيطالية).',
    defaultSubjects: [
      { name: 'اللغة الأجنبية الثالثة (إسبانية/ألمانية/إيطالية)', code: 'L3', coefficient: 5, color: '#EC4899', defaultHoursTarget: 50 },
      { name: 'اللغة الفرنسية', code: 'FR', coefficient: 5, color: '#0284C7', defaultHoursTarget: 50 },
      { name: 'اللغة الإنجليزية', code: 'EN', coefficient: 5, color: '#4F46E5', defaultHoursTarget: 50 },
      { name: 'اللغة العربية وآدابها', code: 'AR', coefficient: 5, color: '#D97706', defaultHoursTarget: 50 },
      { name: 'التاريخ والجغرافيا', code: 'HIST', coefficient: 2, color: '#059669', defaultHoursTarget: 25 },
      { name: 'الفلسفة', code: 'PHIL', coefficient: 2, color: '#DC2626', defaultHoursTarget: 25 },
      { name: 'العلوم الإسلامية', code: 'ISLAM', coefficient: 2, color: '#10B981', defaultHoursTarget: 20 },
      { name: 'الرياضيات', code: 'MATH', coefficient: 2, color: '#64748B', defaultHoursTarget: 20 },
    ],
  },
  {
    id: 'stream-arts',
    name: 'الفنون',
    code: 'arts',
    description: 'شعبة الفنون: خيارات الفنون التشكيلية، المسرح، الموسيقى والسمعي البصري.',
    defaultSubjects: [
      { name: 'المادة الفنية المتخصصة', code: 'ART_SPEC', coefficient: 6, color: '#8B5CF6', defaultHoursTarget: 60 },
      { name: 'الرسم والتقنيات الفنية', code: 'DRAW', coefficient: 3, color: '#F59E0B', defaultHoursTarget: 30 },
      { name: 'اللغة العربية وآدابها', code: 'AR', coefficient: 3, color: '#D97706', defaultHoursTarget: 30 },
      { name: 'الفلسفة', code: 'PHIL', coefficient: 3, color: '#DC2626', defaultHoursTarget: 30 },
      { name: 'التاريخ والجغرافيا', code: 'HIST', coefficient: 2, color: '#059669', defaultHoursTarget: 25 },
      { name: 'اللغة الفرنسية', code: 'FR', coefficient: 2, color: '#0284C7', defaultHoursTarget: 20 },
      { name: 'اللغة الإنجليزية', code: 'EN', coefficient: 2, color: '#4F46E5', defaultHoursTarget: 20 },
      { name: 'العلوم الإسلامية', code: 'ISLAM', coefficient: 2, color: '#10B981', defaultHoursTarget: 20 },
      { name: 'الرياضيات', code: 'MATH', coefficient: 2, color: '#64748B', defaultHoursTarget: 20 },
    ],
  },
];

const DEFAULT_MOTIVATIONAL: MotivationalMessage[] = [
  { id: 'mot-1', message: 'خطوة صغيرة اليوم أفضل من ضغط كبير غداً.', author: 'نصيحة نجاح', active: true },
  { id: 'mot-2', message: 'لا تحتاج إلى يوم مثالي، تحتاج فقط إلى أن تبدأ.', author: 'نصيحة نجاح', active: true },
  { id: 'mot-3', message: 'أنجز ما تستطيع، ثم عد غداً.', author: 'نصيحة نجاح', active: true },
  { id: 'mot-4', message: 'العبرة بالاستمرار التراكمي، ونصف ساعة جادة تصنع فارقاً حقيقياً.', author: 'فريق نجاح', active: true },
  { id: 'mot-5', message: 'شهادة البكالوريا ليست مستحيلاً، بل خطة واضحة والتزام يومي هادئ.', author: 'فريق نجاح', active: true },
  { id: 'mot-6', message: 'كل تمرين تفهمه الآن، هو نقطة مضمونة في شهادتك القادمة.', author: 'فريق نجاح', active: true },
];

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Automatic safe backup on startup to maintain data permanence
        try {
          const backupFile = `${DB_FILE}.bak`;
          fs.writeFileSync(backupFile, raw, 'utf-8');
        } catch (backupErr) {
          console.warn('Backup creation warning:', backupErr);
        }

        // Ensure default bacExamDate targets 260 days from now (or aligns with student profile)
        if (parsed.settings) {
          const now = new Date();
          const target260 = new Date(now.getTime() + 260 * 24 * 60 * 60 * 1000);
          parsed.settings.bacExamDate = target260.toISOString().split('T')[0];
        }
        if (parsed.profiles) {
          const now = new Date();
          const target260 = new Date(now.getTime() + 260 * 24 * 60 * 60 * 1000);
          parsed.profiles.forEach((p: any) => {
            p.bacExamDate = target260.toISOString().split('T')[0];
          });
        }

        // Ensure demo student has multi-week focus sessions if only had 2 or fewer
        if (parsed.studySessions && parsed.studySessions.length <= 2) {
          const initial = this.getInitialData();
          parsed.studySessions = initial.studySessions;
        }
        this.saveImmediate(parsed);
        return parsed;
      }
    } catch (err) {
      console.error('Error loading DB file, creating default state:', err);
    }

    const initial = this.getInitialData();
    this.saveImmediate(initial);
    return initial;
  }

  private getInitialData(): DatabaseSchema {
    // Admin credentials
    const adminPass = hashPassword('admin123456');
    const adminUser: User & { passwordHash: string; salt: string } = {
      id: 'usr_admin',
      name: 'مشرف المنصة',
      email: 'admin@najah.dz',
      role: 'admin',
      createdAt: new Date().toISOString(),
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
    };

    // Demo student for testing/preview if needed
    const studentPass = hashPassword('bac2027');
    const studentUser: User & { passwordHash: string; salt: string } = {
      id: 'usr_demo_student',
      name: 'أيمن بروال',
      email: 'ayman@najah.dz',
      role: 'student',
      createdAt: new Date().toISOString(),
      passwordHash: studentPass.hash,
      salt: studentPass.salt,
    };

    const target260Days = new Date(Date.now() + 260 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const studentProfile: UserProfile = {
      userId: 'usr_demo_student',
      bacStream: 'علوم تجريبية',
      bacYear: 2027,
      dailyTargetHours: 3.5,
      preferredStudyHours: 'المساء (17:00 - 21:00)',
      onboardingCompleted: true,
      bacExamDate: target260Days,
      theme: 'light',
      notifyTasks: true,
      notifyEvents: true,
    };

    // Seed subjects for demo student
    const sciStream = DEFAULT_STREAMS[0];
    const demoSubjects: Subject[] = sciStream.defaultSubjects.map((sub, idx) => ({
      id: `subj_${idx + 1}`,
      userId: 'usr_demo_student',
      name: sub.name,
      coefficient: sub.coefficient,
      color: sub.color,
      priority: idx < 3 ? 'عالية' : 'متوسطة',
      targetHours: sub.defaultHoursTarget,
      completedHours: idx === 0 ? 14 : idx === 1 ? 12 : 6,
    }));

    const todayStr = new Date().toISOString().split('T')[0];

    const demoTasks: Task[] = [
      {
        id: 'task_1',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[0].id,
        subjectName: demoSubjects[0].name,
        subjectColor: demoSubjects[0].color,
        title: 'حل تمرين التركيب الضوئي - بكالوريا 2023',
        description: 'التركيز على تحليل المنحنيات واستنتاج مراحل تفاعلات المرحلة الكيموضوئية',
        date: todayStr,
        time: '17:30',
        priority: 'عالية',
        status: 'قيد الإنجاز',
        estimatedDurationMins: 45,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task_2',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[1].id,
        subjectName: demoSubjects[1].name,
        subjectColor: demoSubjects[1].color,
        title: 'مراجعة المتتاليات الحسابية والهندسية',
        description: 'حساب المجاميع والبرهان بالتراجع',
        date: todayStr,
        time: '19:00',
        priority: 'متوسطة',
        status: 'لم تبدأ',
        estimatedDurationMins: 60,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task_3',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[2].id,
        subjectName: demoSubjects[2].name,
        subjectColor: demoSubjects[2].color,
        title: 'تلخيص الوحدة الأولى: المتابعة الزمنية لتحول كيميائي',
        description: 'رسم جدول التقدم وحساب السرعة الحجمية للتفاعل',
        date: todayStr,
        time: '20:30',
        priority: 'منخفضة',
        status: 'مكتملة',
        estimatedDurationMins: 35,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    const demoSchedule: ScheduleSession[] = [
      {
        id: 'sch_1',
        userId: 'usr_demo_student',
        dayOfWeek: 'السبت',
        startTime: '09:00',
        endTime: '11:00',
        subjectId: demoSubjects[0].id,
        subjectName: demoSubjects[0].name,
        subjectColor: demoSubjects[0].color,
        goal: 'دراسة أنزيمات وتركيب البروتين',
        notes: 'حل بكالوريا سابقة',
      },
      {
        id: 'sch_2',
        userId: 'usr_demo_student',
        dayOfWeek: 'الأحد',
        startTime: '18:00',
        endTime: '20:00',
        subjectId: demoSubjects[1].id,
        subjectName: demoSubjects[1].name,
        subjectColor: demoSubjects[1].color,
        goal: 'دراسة الدوال الأسية واللوغاريتمية',
        notes: 'التركيز على دراسة اتجاه التغير ونقاط الانعطاف',
      },
      {
        id: 'sch_3',
        userId: 'usr_demo_student',
        dayOfWeek: 'الإثنين',
        startTime: '17:30',
        endTime: '19:30',
        subjectId: demoSubjects[2].id,
        subjectName: demoSubjects[2].name,
        subjectColor: demoSubjects[2].color,
        goal: 'التحولات النووية وتناقص الإشعاعي',
      },
    ];

    const demoEvents: StudyEvent[] = [
      {
        id: 'evt_1',
        userId: 'usr_demo_student',
        title: 'امتحان البكالوريا التجريبي الأول (العلوم الطبيعية)',
        date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
        time: '08:00',
        type: 'امتحان',
        notes: 'يشمل الوحدات الثلاث الأولى',
      },
      {
        id: 'evt_2',
        userId: 'usr_demo_student',
        title: 'اختبار مادة الفلسفة في الثانوية',
        date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        time: '10:00',
        type: 'اختبار',
        notes: 'موضوع الإشكالية الفلسفية والمشكلة العلمية',
      },
    ];

    const demoNotes: Note[] = [
      {
        id: 'note_1',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[0].id,
        subjectName: demoSubjects[0].name,
        title: 'قواعد منهجية الإجابة في مادة علوم الطبيعة والحياة',
        content: '1. التحليل: تفكيك المعطيات وتحديد العلاقات دون تفسير مسبق.\n2. التفسير: تقديم الأسباب العلمية والآليات الحيوية.\n3. الاستنتاج: خلاصة دقيقة تجيب عن المشكل العلمي المطروح.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'note_2',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[1].id,
        subjectName: demoSubjects[1].name,
        title: 'نهايات شهيرة في الدالة الأسية واللوغاريتمية',
        content: '• lim (e^x / x) = +inf لما x يؤول إلى +inf\n• lim (x * e^x) = 0 لما x يؤول إلى -inf\n• التزايد المقارن يزيل حالة عدم التعيين بسهولة.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const nowMs = Date.now();
    const dayMs = 86400000;
    const demoFocus: FocusSession[] = [
      // Today & this week
      {
        id: 'foc_1',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[0].id,
        subjectName: demoSubjects[0].name,
        durationMinutes: 50,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 2 * 3600000).toISOString(),
        date: todayStr,
      },
      {
        id: 'foc_2',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[1].id,
        subjectName: demoSubjects[1].name,
        durationMinutes: 45,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 5 * 3600000).toISOString(),
        date: todayStr,
      },
      {
        id: 'foc_3',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[2].id,
        subjectName: demoSubjects[2].name,
        durationMinutes: 60,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 1 * dayMs).toISOString(),
        date: new Date(nowMs - 1 * dayMs).toISOString().split('T')[0],
      },
      {
        id: 'foc_4',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[0].id,
        subjectName: demoSubjects[0].name,
        durationMinutes: 75,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 2 * dayMs).toISOString(),
        date: new Date(nowMs - 2 * dayMs).toISOString().split('T')[0],
      },
      {
        id: 'foc_5',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[1].id,
        subjectName: demoSubjects[1].name,
        durationMinutes: 90,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 3 * dayMs).toISOString(),
        date: new Date(nowMs - 3 * dayMs).toISOString().split('T')[0],
      },
      // Last week (week -1)
      {
        id: 'foc_6',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[0].id,
        subjectName: demoSubjects[0].name,
        durationMinutes: 120,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 8 * dayMs).toISOString(),
        date: new Date(nowMs - 8 * dayMs).toISOString().split('T')[0],
      },
      {
        id: 'foc_7',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[1].id,
        subjectName: demoSubjects[1].name,
        durationMinutes: 110,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 9 * dayMs).toISOString(),
        date: new Date(nowMs - 9 * dayMs).toISOString().split('T')[0],
      },
      {
        id: 'foc_8',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[2].id,
        subjectName: demoSubjects[2].name,
        durationMinutes: 80,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 11 * dayMs).toISOString(),
        date: new Date(nowMs - 11 * dayMs).toISOString().split('T')[0],
      },
      // Two weeks ago (week -2)
      {
        id: 'foc_9',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[0].id,
        subjectName: demoSubjects[0].name,
        durationMinutes: 90,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 16 * dayMs).toISOString(),
        date: new Date(nowMs - 16 * dayMs).toISOString().split('T')[0],
      },
      {
        id: 'foc_10',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[1].id,
        subjectName: demoSubjects[1].name,
        durationMinutes: 105,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 17 * dayMs).toISOString(),
        date: new Date(nowMs - 17 * dayMs).toISOString().split('T')[0],
      },
      {
        id: 'foc_11',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[3]?.id || demoSubjects[0].id,
        subjectName: demoSubjects[3]?.name || demoSubjects[0].name,
        durationMinutes: 60,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 19 * dayMs).toISOString(),
        date: new Date(nowMs - 19 * dayMs).toISOString().split('T')[0],
      },
      // Three weeks ago (week -3)
      {
        id: 'foc_12',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[0].id,
        subjectName: demoSubjects[0].name,
        durationMinutes: 75,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 23 * dayMs).toISOString(),
        date: new Date(nowMs - 23 * dayMs).toISOString().split('T')[0],
      },
      {
        id: 'foc_13',
        userId: 'usr_demo_student',
        subjectId: demoSubjects[2].id,
        subjectName: demoSubjects[2].name,
        durationMinutes: 90,
        sessionType: 'pomodoro',
        completedAt: new Date(nowMs - 25 * dayMs).toISOString(),
        date: new Date(nowMs - 25 * dayMs).toISOString().split('T')[0],
      },
    ];

    return {
      users: [adminUser, studentUser],
      sessions: [],
      profiles: [studentProfile],
      streams: DEFAULT_STREAMS,
      subjects: demoSubjects,
      tasks: demoTasks,
      studySessions: demoFocus,
      scheduleSessions: demoSchedule,
      notes: demoNotes,
      events: demoEvents,
      notifications: [
        {
          id: 'notif_1',
          userId: 'usr_demo_student',
          title: 'مرحباً بك في نجاح',
          message: 'تم إعداد خطتك الأكاديمية بنجاح. ابدأ بأول مهمة دراسية لليوم.',
          type: 'system',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      motivationalMessages: DEFAULT_MOTIVATIONAL,
      announcements: [
        {
          id: 'ann_1',
          title: 'انطلاق التحضيرات الرسمية لبكالوريا الجزائر',
          content: 'نذكّر جميع طلبة الأقسام النهائية بأهمية تنظيم ساعات المراجعة اليومية والحفاظ على ساعات نوم كافية.',
          date: todayStr,
          priority: 'مهمة',
          active: true,
        },
      ],
      settings: {
        bacExamDate: target260Days,
        currentBacYear: 2027,
        platformNotice: 'منصة نجاح مكرسة لمرافقة طلبة البكالوريا في مسارهم نحو الامتياز.',
      },
    };
  }

  private saveImmediate(state: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const serialized = JSON.stringify(state, null, 2);
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, serialized, 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);

      // Create rolling backup to guarantee data permanence
      try {
        const backupFile = `${DB_FILE}.bak`;
        fs.writeFileSync(backupFile, serialized, 'utf-8');
      } catch (bErr) {
        // silent fallback for backup file
      }
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public save() {
    this.saveImmediate(this.data);
  }

  public get db(): DatabaseSchema {
    return this.data;
  }

  // --- Auth & User operations ---
  public createUser(name: string, email: string, passwordPlain: string, role: 'student' | 'admin' = 'student') {
    const existing = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('هذا البريد الإلكتروني مسجل بالفعل');
    }

    const { hash, salt } = hashPassword(passwordPlain);
    const id = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const user: User & { passwordHash: string; salt: string } = {
      id,
      name,
      email: email.toLowerCase().trim(),
      role,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt,
    };

    this.data.users.push(user);
    this.save();
    return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
  }

  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    this.data.sessions.push({
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt,
    });
    this.save();
    return token;
  }

  public getUserByToken(token: string): (User & { profile?: UserProfile }) | null {
    if (!token) return null;
    const session = this.data.sessions.find((s) => s.token === token && new Date(s.expiresAt) > new Date());
    if (!session) return null;

    const userRecord = this.data.users.find((u) => u.id === session.userId);
    if (!userRecord) return null;

    const profile = this.data.profiles.find((p) => p.userId === userRecord.id);
    return {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
      profile,
    };
  }

  public deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // Generate default subjects for a user according to their stream
  public setupUserSubjects(userId: string, streamName: string) {
    const stream = this.data.streams.find((s) => s.name === streamName) || this.data.streams[0];
    // Remove any previous subjects for this user if re-initializing
    this.data.subjects = this.data.subjects.filter((s) => s.userId !== userId);

    const newSubjects: Subject[] = stream.defaultSubjects.map((sub, idx) => ({
      id: `subj_${userId}_${idx + 1}`,
      userId,
      name: sub.name,
      coefficient: sub.coefficient,
      color: sub.color,
      priority: idx < 3 ? 'عالية' : 'متوسطة',
      targetHours: sub.defaultHoursTarget,
      completedHours: 0,
    }));

    this.data.subjects.push(...newSubjects);
    this.save();
    return newSubjects;
  }
}

export const dbService = new DatabaseService();
