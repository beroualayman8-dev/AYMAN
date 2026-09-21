import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { PushNotificationProvider, usePushNotification } from './context/PushNotificationContext.js';
import { PushNotificationContainer } from './components/notifications/PushNotificationContainer.js';
import { Sidebar, NavTab } from './components/common/Sidebar.js';
import { Header } from './components/common/Header.js';
import { MobileNav } from './components/common/MobileNav.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { OnboardingModal } from './components/onboarding/OnboardingModal.js';

// Feature Views
import { DashboardView } from './components/dashboard/DashboardView.js';
import { SubjectsView } from './components/subjects/SubjectsView.js';
import { TasksView } from './components/tasks/TasksView.js';
import { ScheduleView } from './components/schedule/ScheduleView.js';
import { FocusTimerView } from './components/focus/FocusTimerView.js';
import { ProgressView } from './components/progress/ProgressView.js';
import { NotesView } from './components/notes/NotesView.js';
import { EventsView } from './components/events/EventsView.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { AdminView } from './components/admin/AdminView.js';

function MainApp() {
  const { user, profile, loading, refreshUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth modal state for visitors
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Passing context into views
  const [focusSubjectId, setFocusSubjectId] = useState<string | undefined>(undefined);
  const [tasksSubjectId, setTasksSubjectId] = useState<string | undefined>(undefined);
  const [notesSubjectId, setNotesSubjectId] = useState<string | undefined>(undefined);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white font-bold flex items-center justify-center font-['Cairo'] text-xl animate-pulse">
            ن
          </div>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium font-['Cairo']">تحميل منصة نجاح...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Landing page
  if (!user) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setShowAuthModal(true);
          }}
          onExploreDemo={() => {
            setAuthMode('login');
            setShowAuthModal(true);
          }}
        />
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            refreshUser();
          }}
        />
      </>
    );
  }

  // Logged in but onboarding not finished
  const needsOnboarding = profile && !profile.onboardingCompleted && user.role !== 'admin';

  // Navigation handlers
  const handleStartFocus = (subjectId?: string) => {
    setFocusSubjectId(subjectId);
    setCurrentTab('focus');
  };

  const handleOpenNewTask = (subjectId?: string) => {
    setTasksSubjectId(subjectId);
    setCurrentTab('tasks');
  };

  const handleOpenNewNote = (subjectId?: string) => {
    setNotesSubjectId(subjectId);
    setCurrentTab('notes');
  };

  const tabTitles: Record<NavTab, string> = {
    dashboard: 'لوحة المتابعة الرئيسية',
    subjects: 'المواد الدراسية والمعاملات',
    tasks: 'إدارة المهام والتمارين',
    schedule: 'جدول المراجعة الأسبوعي',
    focus: 'مؤقت التركيز (بومودورو)',
    progress: 'مؤشرات التقدم والجاهزية',
    notes: 'الملاحظات والملخصات',
    events: 'روزنامة الأحداث والامتحانات',
    settings: 'الإعدادات والملف الشخصي',
    admin: 'لوحة إدارة المنصة (Admin)',
  };

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col font-['IBM_Plex_Sans_Arabic',sans-serif] selection:bg-blue-600 selection:text-white">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:mr-72 flex flex-col min-w-0 transition-all">
        {/* Sticky Header */}
        <Header
          title={tabTitles[currentTab]}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onStartFocus={() => handleStartFocus()}
          streak={profile?.streak || 0}
        />

        {/* View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onOpenNewTask={handleOpenNewTask}
              onOpenNewNote={handleOpenNewNote}
              onStartFocus={handleStartFocus}
            />
          )}

          {currentTab === 'subjects' && (
            <SubjectsView
              onStartFocus={handleStartFocus}
              onOpenNewTask={handleOpenNewTask}
              onOpenNewNote={handleOpenNewNote}
            />
          )}

          {currentTab === 'tasks' && <TasksView initialSubjectId={tasksSubjectId} />}

          {currentTab === 'schedule' && <ScheduleView />}

          {currentTab === 'focus' && (
            <FocusTimerView
              initialSubjectId={focusSubjectId}
              onSessionComplete={() => {
                refreshUser();
              }}
            />
          )}

          {currentTab === 'progress' && <ProgressView />}

          {currentTab === 'notes' && <NotesView initialSubjectId={notesSubjectId} />}

          {currentTab === 'events' && <EventsView />}

          {currentTab === 'settings' && <SettingsView />}

          {currentTab === 'admin' && user.role === 'admin' && <AdminView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* In-App Push Notification Toast System in Top Corner */}
      <PushNotificationContainer
        onNavigateToTasks={(taskId) => {
          setTasksSubjectId(undefined);
          setCurrentTab('tasks');
        }}
      />

      {/* Onboarding modal if user just registered */}
      {needsOnboarding && (
        <OnboardingModal
          isOpen={true}
          onFinished={() => {
            refreshUser();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PushNotificationProvider>
        <MainApp />
      </PushNotificationProvider>
    </AuthProvider>
  );
}
