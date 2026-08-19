import React from 'react';
import { Home, Sparkles, CheckSquare, FolderKanban, User, Calendar } from 'lucide-react';

export type TabType = 'home' | 'assistant' | 'tasks' | 'schedule' | 'projects' | 'memory' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'assistant', label: 'Julie', icon: Sparkles },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'settings', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-3 py-2 pb-safe max-w-[420px] mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as TabType)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-150 ${
                isActive
                  ? 'text-julie-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-julie-50' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-julie-600' : 'stroke-2'}`} />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold text-julie-600' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
