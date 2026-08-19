import React from 'react';
import { Search, Bell, History, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenActionLogs: () => void;
  unreadNotificationsCount?: number;
  onNavigateToNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenActionLogs,
  unreadNotificationsCount = 0,
  onNavigateToNotifications,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-white/5 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-400 to-cyan-200 flex items-center justify-center shadow-brand-subtle">
            <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
              JULIE <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-brand-500/10 text-brand-300 rounded border border-brand-500/20">AI</span>
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl bg-surface-800/40 text-surface-300 hover:text-white hover:bg-surface-800 transition-all border border-white/5"
            title="Global Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenActionLogs}
            className="p-2 rounded-xl bg-surface-800/40 text-surface-300 hover:text-brand-300 hover:bg-surface-800 transition-all border border-white/5"
            title="AI Action Transparency Log"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={onNavigateToNotifications}
            className="relative p-2 rounded-xl bg-surface-800/40 text-surface-300 hover:text-white hover:bg-surface-800 transition-all border border-white/5"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-400 animate-ping" />
            )}
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
