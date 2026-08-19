// =============================================================================
// PROJECT JULIE — OBSIDIAN GLASS HAMBURGER NAVIGATION DRAWER
// Matches ChatGPT/Apple Glass navigation with Dark/Light theme switch.
// =============================================================================

import React from 'react';
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
} from 'lucide-react';

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
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const menuItems = [
    { id: 'chat' as DrawerTab, label: 'Chat', subtitle: 'Talk with Julie', badge: 'Primary', icon: MessageSquare },
    { id: 'dashboard' as DrawerTab, label: 'Dashboard', subtitle: 'Overview of your day', icon: LayoutDashboard },
    { id: 'memory' as DrawerTab, label: 'Memory', subtitle: 'Archived project chats', icon: Brain },
    { id: 'tasks' as DrawerTab, label: 'Tasks', subtitle: 'Manage your tasks', badge: '1 Due', icon: CheckSquare },
    { id: 'schedule' as DrawerTab, label: 'Schedule', subtitle: 'Timetable & classes', icon: Calendar },
    { id: 'attendance' as DrawerTab, label: 'Attendance', subtitle: 'Subject-wise 60.34%', badge: '60.34%', icon: GraduationCap },
    { id: 'notifications' as DrawerTab, label: 'Notifications', subtitle: 'Alerts & reminders', icon: Bell },
    { id: 'connections' as DrawerTab, label: 'Connections', subtitle: 'UU-ERP & Google', badge: 'Live', icon: Link2 },
    { id: 'settings' as DrawerTab, label: 'Settings', subtitle: 'Customize Julie', icon: Settings },
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
        <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 pr-1">
          <div className="flex items-center justify-between border-b pb-3 border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-julie-600 to-sky-400 p-0.5 shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                <div className="w-full h-full rounded-[14px] bg-[#050508] flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-julie-500 to-sky-400 animate-pulse" />
                </div>
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

        {/* Footer Actions with ChatGPT Theme Switcher */}
        <div className="pt-3 border-t border-white/5 space-y-2 shrink-0">
          <div className="flex items-center justify-between px-2 py-1 text-xs">
            <span className="flex items-center gap-2 font-medium">
              {isDark ? (
                <Moon className="w-4 h-4 text-purple-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </span>

            {/* ChatGPT/iOS Style Toggle Pill */}
            <div
              onClick={onToggleTheme}
              className={`w-12 h-6 rounded-full p-0.5 flex items-center cursor-pointer transition-all duration-300 shadow-inner ${
                isDark ? 'bg-julie-600 justify-end' : 'bg-amber-400 justify-start'
              }`}
              title="Switch Dark / Light theme like ChatGPT"
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-[10px]">
                {isDark ? '🌙' : '☀️'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to sign out?')) {
                window.location.reload();
              }
            }}
            className="w-full flex items-center gap-2 px-2 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
