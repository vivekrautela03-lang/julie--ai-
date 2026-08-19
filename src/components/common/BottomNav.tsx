// =============================================================================
// PROJECT JULIE — INSTAGRAM-STYLE TRANSPARENT GLASSMORPHISM BOTTOM NAVBAR
// Bottom navigation featuring Chat, Dashboard, Notifications, and Hamburger Menu
// =============================================================================

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  MessageSquare,
  LayoutDashboard,
  Bell,
  Menu,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { db } from '@/core/storage/db';
import type { DrawerTab } from './GlassDrawer';

interface BottomNavProps {
  activeTab: DrawerTab;
  onSelectTab: (tab: DrawerTab) => void;
  onOpenMenu: () => void;
  onOpenVoice: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMenu,
  onOpenVoice,
}) => {
  // Query unread notifications count
  const unreadCount = useLiveQuery(
    () => db.notifications.where('is_read').equals(0).count(),
    []
  );

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 max-w-[430px] mx-auto px-4 pb-4 pt-1 pointer-events-none select-none">
      <nav className="pointer-events-auto liquid-glass-elevated rounded-[32px] px-3 py-2 border border-white/15 bg-[#070810]/85 backdrop-blur-3xl shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(124,58,237,0.2)] flex items-center justify-around transition-all">
        
        {/* 1. Chat Tab */}
        <button
          onClick={() => onSelectTab('chat')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
            activeTab === 'chat'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Chat with Julie"
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-tr from-julie-600 to-sky-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.7)]'
                : 'hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              activeTab === 'chat' ? 'font-bold text-white' : 'font-medium'
            }`}
          >
            Chat
          </span>
        </button>

        {/* 2. Dashboard Tab */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
            activeTab === 'dashboard'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Day Command Center"
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-tr from-julie-600 to-sky-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.7)]'
                : 'hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              activeTab === 'dashboard' ? 'font-bold text-white' : 'font-medium'
            }`}
          >
            Dashboard
          </span>
        </button>

        {/* 3. Center Glowing Aura Voice Trigger */}
        <button
          onClick={onOpenVoice}
          className="relative -top-2 flex flex-col items-center justify-center transition-all duration-200 active:scale-90"
          title="Instant Voice Conversation"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-julie-600 via-indigo-500 to-sky-400 p-0.5 shadow-[0_0_25px_rgba(124,58,237,0.8)] flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#070810] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
            </div>
          </div>
          <span className="text-[9px] font-bold text-sky-400 tracking-tight mt-0.5">
            Voice
          </span>
        </button>

        {/* 4. Notifications Tab */}
        <button
          onClick={() => onSelectTab('notifications')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 relative ${
            activeTab === 'notifications'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Notifications & Class Alerts"
        >
          <div
            className={`p-1.5 rounded-xl transition-all relative ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-tr from-julie-600 to-sky-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.7)]'
                : 'hover:bg-white/5'
            }`}
          >
            <Bell className="w-5 h-5 stroke-[2.2]" />
            {unreadCount !== undefined && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-lg border border-black animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              activeTab === 'notifications' ? 'font-bold text-white' : 'font-medium'
            }`}
          >
            Alerts
          </span>
        </button>

        {/* 5. Hamburger Menu */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-400 hover:text-slate-200 transition-all duration-200 active:scale-90"
          title="All Features & Settings"
        >
          <div className="p-1.5 rounded-xl hover:bg-white/5 transition-all">
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">
            Menu
          </span>
        </button>
      </nav>
    </div>
  );
};
