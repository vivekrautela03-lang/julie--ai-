// =============================================================================
// PROJECT JULIE — OBSIDIAN GLASS HAMBURGER NAVIGATION DRAWER
// Matches ChatGPT/Apple Glass navigation with Dark/Light theme switch,
// direct Female Voices Selector and Desktop/Mobile App Download.
// =============================================================================

import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  LayoutDashboard,
  Brain,
  CheckSquare,
  Calendar,
  GraduationCap,
  Bell,
  Link2,
  Settings,
  User,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Volume2,
  Download,
  Sparkles,
} from 'lucide-react';
import { VoicePersonaModal } from '@/components/settings/VoicePersonaModal';
import { InstallAppModal } from '@/components/common/InstallAppModal';
import { voiceService } from '@/services/voice/VoiceService';

export type DrawerTab =
  | 'chat'
  | 'dashboard'
  | 'memory'
  | 'tasks'
  | 'schedule'
  | 'attendance'
  | 'notifications'
  | 'connections'
  | 'settings'
  | 'profile';

interface GlassDrawerProps {
  isOpen: boolean;
  activeTab: DrawerTab;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSelectTab: (tab: DrawerTab) => void;
  onClose: () => void;
}

export const GlassDrawer: React.FC<GlassDrawerProps> = ({
  isOpen,
  activeTab,
  theme = 'dark',
  onToggleTheme,
  onSelectTab,
  onClose,
}) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const currentVoice = voiceService.getPersona();

  const menuItems = [
    { id: 'chat' as DrawerTab, label: 'Chat', subtitle: 'Universal AI Assistant', badge: 'Primary', icon: MessageSquare },
    { id: 'dashboard' as DrawerTab, label: 'Dashboard', subtitle: 'Tasks, Weather & Day Overview', icon: LayoutDashboard },
    { id: 'memory' as DrawerTab, label: 'Memory', subtitle: 'Archived project chats', icon: Brain },
    { id: 'tasks' as DrawerTab, label: 'Tasks', subtitle: 'Manage your to-dos', icon: CheckSquare },
    { id: 'schedule' as DrawerTab, label: 'Schedule', subtitle: 'Today & Tomorrow classes', icon: Calendar },
    { id: 'attendance' as DrawerTab, label: 'Attendance', subtitle: 'Subject-wise 60.34%', badge: '60.34%', icon: GraduationCap },
    { id: 'notifications' as DrawerTab, label: 'Notifications', subtitle: '5-min class alerts', icon: Bell },
    { id: 'connections' as DrawerTab, label: 'Connections', subtitle: 'UU-ERP & Google', badge: 'Live', icon: Link2 },
    { id: 'settings' as DrawerTab, label: 'Settings', subtitle: 'Account & Preferences', icon: Settings },
    { id: 'profile' as DrawerTab, label: 'Profile', subtitle: 'Uttaranchal University', icon: User },
  ];

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
      />

      {/* Drawer Container */}
      <div
        className={`relative w-80 max-w-[85vw] h-full p-5 flex flex-col justify-between border-r shadow-2xl z-10 transition-colors ${
          isDark
            ? 'bg-[#080910]/95 border-white/10 text-white'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300'
        }`}
      >
        {/* Drawer Header */}
        <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 pr-1">
          <div className="flex items-center justify-between border-b pb-3 border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-julie-600 to-sky-400 p-0.5 shadow-[0_0_15px_rgba(124,58,237,0.5)] overflow-hidden">
                <img
                  src="/julie-icon.jpg"
                  alt="Julie AI"
                  className="w-full h-full rounded-[14px] object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black tracking-tight">Julie</h2>
                  <span className="w-3.5 h-3.5 rounded-full bg-julie-600/30 text-sky-400 border border-sky-400/40 flex items-center justify-center text-[8px] font-bold">
                    ✓
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Personal AI Assistant</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl liquid-pill text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Pills: Voices & Install App */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-2.5 rounded-xl liquid-glass border border-purple-500/30 hover:border-purple-400 text-left transition-all active:scale-95"
            >
              <div className="flex items-center gap-1.5 text-purple-300">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Voices</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate mt-0.5">{currentVoice.name.split(' ')[0]}</p>
            </button>

            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="p-2.5 rounded-xl liquid-glass border border-sky-500/30 hover:border-sky-400 text-left transition-all active:scale-95"
            >
              <div className="flex items-center gap-1.5 text-sky-300">
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Download</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">PC & Phone</p>
            </button>
          </div>

          {/* Navigation Items List */}
          <div className="space-y-1 pt-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                    isActive
                      ? 'liquid-glass-button text-white font-bold shadow-glass-button'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 border border-white/5 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold leading-tight">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && !isActive && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/5 text-sky-400 border border-white/10">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer: Dark/Light Mode Switch */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Theme</span>
          </div>

          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-pill text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm"
          >
            {isDark ? (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Embedded Modals for Immediate Access */}
      <VoicePersonaModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
