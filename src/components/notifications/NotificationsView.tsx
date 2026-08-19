// =============================================================================
// PROJECT JULIE — NOTIFICATIONS VIEW
// Real-time glass notifications feed with filters and college updates.
// =============================================================================

import React, { useState } from 'react';
import { ArrowLeft, RotateCw, Calendar, Bookmark, Clock, FolderKanban, Bell } from 'lucide-react';

interface NotificationsViewProps {
  onBack?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack }) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'College' | 'Classes' | 'Tasks'>('All');
  const filterTabs: Array<'All' | 'College' | 'Classes' | 'Tasks'> = ['All', 'College', 'Classes', 'Tasks'];

  const notifications = [
    {
      id: '1',
      icon: Calendar,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      title: 'Your class has been rescheduled to 3:00 PM.',
      time: '1h ago',
    },
    {
      id: '2',
      icon: Bookmark,
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      title: 'Marketing assignment due tomorrow.',
      time: '30m ago',
    },
    {
      id: '3',
      icon: Clock,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      title: 'You have 40 minutes free before your next class.',
      time: '1h ago',
    },
    {
      id: '4',
      icon: FolderKanban,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      title: 'Project deadline approaching in 2 days.',
      time: '2h ago',
    },
    {
      id: '5',
      icon: Bell,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      title: 'New notice uploaded in college portal.',
      time: '3h ago',
    },
  ];

  return (
    <div className="space-y-4 pb-24 px-4 pt-2 text-white">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-2xl ios-glass text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-xl font-bold text-white tracking-tight">Notifications</h1>
        </div>

        <button className="p-2 rounded-2xl ios-glass text-slate-400 hover:text-white transition-colors">
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filterTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === tab ? 'ios-glass-pill-active text-white' : 'ios-glass-pill text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5 pt-1">
        {notifications.map(item => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="ios-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-julie-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${item.color} border flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white leading-snug">{item.title}</h3>
              </div>

              <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
