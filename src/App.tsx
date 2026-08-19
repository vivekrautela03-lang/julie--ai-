// =============================================================================
// PROJECT JULIE — PREMIUM IOS-GLASS PERSONAL AI ASSISTANT (SHELL & ROUTER)
// Primary experience: CHAT + JULIE AURA ORB.
// All other sections accessed via the Hamburger Navigation Drawer.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { initializeDatabase, CURRENT_USER_ID } from '@/core/storage/db';
import { subscribeToWakeWordTriggers } from '@/core/storage/firebase';

import { TopHeader } from '@/components/common/TopHeader';
import { GlassDrawer, type DrawerTab } from '@/components/common/GlassDrawer';
import { VoiceOverlay } from '@/components/voice/VoiceOverlay';
import { type OrbState } from '@/components/common/JulieAuraOrb';

// Screens
import { ChatView } from '@/components/chat/ChatView';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { MemoryView } from '@/components/memory/MemoryView';
import { TasksView } from '@/components/tasks/TasksView';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { AttendanceView } from '@/components/attendance/AttendanceView';
import { NotificationsView } from '@/components/notifications/NotificationsView';
import { ConnectionsView } from '@/components/connections/ConnectionsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { ProfileView } from '@/components/profile/ProfileView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DrawerTab>('chat');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('julie_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('julie_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    initializeDatabase()
      .then(() => {
        import('@/core/storage/db')
          .then(({ syncOfficialTimetableNow }) => {
            syncOfficialTimetableNow().catch(e => console.warn('[App] Sync note:', e));
          })
          .catch(e => console.warn('[App] DB import note:', e));
      })
      .catch(e => console.warn('[App] DB init note:', e));

    // Start 10-minute class reminder and timetable notification engine
    import('@/services/notifications/ClassReminderService')
      .then(({ ClassReminderService }) => {
        ClassReminderService.start();
      })
      .catch(e => console.warn('[App] Class reminder service note:', e));

    // Local continuous mic background Wake-Word ("Hey Julie") listener
    let unsubLocalWakeWord: (() => void) | null = null;
    import('@/services/voice/WakeWordEngine')
      .then(({ wakeWordEngine }) => {
        wakeWordEngine.start();
        unsubLocalWakeWord = wakeWordEngine.onWakeWord(phrase => {
          console.log('[Local Wake Word Triggered]:', phrase);
          setIsVoiceOverlayOpen(true);
        });
      })
      .catch(e => console.warn('[App] Wake word engine note:', e));

    // Firebase real-time Wake Word trigger ("Hey Julie") listener
    let unsubWakeWord: (() => void) | null = null;
    try {
      unsubWakeWord = subscribeToWakeWordTriggers(CURRENT_USER_ID, phrase => {
        console.log('[Firebase Wake Word Triggered]:', phrase);
        setIsVoiceOverlayOpen(true);
      });
    } catch (e) {
      console.warn('[App] Firebase trigger note:', e);
    }

    return () => {
      if (unsubLocalWakeWord) unsubLocalWakeWord();
      if (unsubWakeWord) unsubWakeWord();
    };
  }, []);

  const handleReturnToChat = () => {
    setActiveTab('chat');
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-0 sm:py-6 selection:bg-julie-600/30 transition-colors duration-300 ${
        theme === 'light' ? 'bg-[#F0F2F6] text-slate-900 selection:text-slate-900' : 'bg-[#050508] text-white selection:text-white'
      }`}
    >
      {/* Mobile / iOS Frame Container */}
      <div
        className={`w-full max-w-[430px] min-h-screen sm:min-h-[880px] sm:max-h-[920px] sm:rounded-[48px] sm:shadow-2xl sm:border-[8px] flex flex-col relative overflow-hidden transition-colors duration-300 ${
          theme === 'light'
            ? 'bg-[#F8FAFC] border-slate-300/80 shadow-[0_0_60px_rgba(0,0,0,0.08)] text-slate-900'
            : 'bg-[#07070A] border-white/10 shadow-[0_0_60px_rgba(124,58,237,0.15)] text-white'
        }`}
      >
        {/* Global Top Header (☰ Hamburger, Julie, Mini Aura Orb) */}
        <TopHeader
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenVoice={() => setIsVoiceOverlayOpen(true)}
          orbState={orbState}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-1">
          {activeTab === 'chat' && (
            <ChatView
              onOpenVoice={() => setIsVoiceOverlayOpen(true)}
              onNavigateToTab={setActiveTab}
            />
          )}
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToTab={setActiveTab}
              onOpenVoice={() => setIsVoiceOverlayOpen(true)}
            />
          )}
          {activeTab === 'memory' && (
            <MemoryView onBack={handleReturnToChat} />
          )}
          {activeTab === 'tasks' && (
            <TasksView onBack={handleReturnToChat} />
          )}
          {activeTab === 'schedule' && (
            <ScheduleView onBack={handleReturnToChat} />
          )}
          {activeTab === 'attendance' && (
            <AttendanceView onBack={handleReturnToChat} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsView onBack={handleReturnToChat} />
          )}
          {activeTab === 'connections' && (
            <ConnectionsView onBack={handleReturnToChat} />
          )}
          {activeTab === 'settings' && (
            <SettingsView onBack={handleReturnToChat} />
          )}
          {activeTab === 'profile' && (
            <ProfileView onBack={handleReturnToChat} />
          )}
        </main>

        {/* iOS Home Indicator Bar */}
        <div className="py-1 flex justify-center pointer-events-none z-40">
          <div className={`w-32 h-1 rounded-full ${theme === 'light' ? 'bg-slate-400/40' : 'bg-white/30'}`} />
        </div>

        {/* Hamburger Drawer Menu */}
        <GlassDrawer
          isOpen={isMenuOpen}
          activeTab={activeTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectTab={setActiveTab}
          onClose={() => setIsMenuOpen(false)}
        />

        {/* Fullscreen Voice Overlay ("Hey Julie" Voice Experience) */}
        <VoiceOverlay
          isOpen={isVoiceOverlayOpen}
          onClose={() => setIsVoiceOverlayOpen(false)}
        />
      </div>
    </div>
  );
};
