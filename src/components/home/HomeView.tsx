import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sparkles, ChevronRight, Mic, BookOpen, Clock, Edit3, Dumbbell, Star, Calendar } from 'lucide-react';
import { db, CURRENT_USER_ID } from '@/core/storage/db';
import { ScheduleEngine } from '@/services/schedule/ScheduleEngine';
import { getTimeBasedGreeting } from '@/core/utils/greeting';

interface HomeViewProps {
  onNavigateToTab: (tab: any) => void;
  onOpenVoice: () => void;
  onSelectTask?: (taskId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateToTab, onOpenVoice, onSelectTask }) => {
  const [mindInput, setMindInput] = useState('');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');

  // Live real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateStr(
        now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
      );
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const classes = useLiveQuery(() => db.classes.where('user_id').equals(CURRENT_USER_ID).toArray(), []);
  const events = useLiveQuery(() => db.events.where('user_id').equals(CURRENT_USER_ID).toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.where('user_id').equals(CURRENT_USER_ID).toArray(), []);
  const intentions = useLiveQuery(() => db.intentions.where('user_id').equals(CURRENT_USER_ID).toArray(), []);

  // Compute live timeline
  const liveTimeline = ScheduleEngine.buildDailyTimeline({
    classes: classes || [],
    events: events || [],
    tasks: tasks || [],
    intentions: intentions || [],
  });

  const handleMindSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mindInput.trim()) return;

    await db.intentions.add({
      id: `int-${Date.now()}`,
      user_id: CURRENT_USER_ID,
      content: mindInput.trim(),
      category: 'Creative',
      priority: 'High',
      time_window: 'Tonight',
      suggested_start_time: '19:30',
      suggested_end_time: '21:30',
      status: 'active',
      created_at: new Date().toISOString(),
    });

    setMindInput('');
    onNavigateToTab('assistant');
  };

  const getRowIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('market') || t.includes('lecture') || t.includes('class')) return { icon: BookOpen, color: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' };
    if (t.includes('free')) return { icon: Clock, color: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500' };
    if (t.includes('assign') || t.includes('paper')) return { icon: Edit3, color: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500' };
    if (t.includes('gym') || t.includes('workout')) return { icon: Dumbbell, color: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500' };
    return { icon: Star, color: 'bg-purple-50 text-purple-600', bar: 'bg-purple-500' };
  };

  return (
    <div className="space-y-5 pb-28 px-4 pt-2">
      {/* Top Header: Greeting & Profile Avatar */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
            {getTimeBasedGreeting('Boss').greeting} <span className="text-2xl">{getTimeBasedGreeting('Boss').emoji}</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{currentDateStr || 'Wednesday, 19 August'}</p>
        </div>

        {/* Profile Avatar with click to settings */}
        <button
          onClick={() => onNavigateToTab('settings')}
          className="relative group transition-transform active:scale-95"
          title="Account Settings"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="Profile Avatar"
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md shadow-slate-200"
          />
        </button>
      </div>

      {/* "✦ Julie says" Card (Exact Replica) */}
      <div className="julie-card-gradient rounded-3xl p-5 space-y-3.5 relative overflow-hidden">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-julie-600 fill-julie-600" />
          <span>Julie says</span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-slate-800 leading-snug">
            Your Marketing assignment is due tomorrow.
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You have 1h 40m available today. I'd suggest finishing the research now.
          </p>
        </div>

        {/* "Start now >" Vibrant Action Button */}
        <button
          onClick={() => {
            if (onSelectTask) onSelectTask('d0000000-0000-0000-0000-000000000001');
            onNavigateToTab('tasks');
          }}
          className="w-full julie-button-gradient text-white font-semibold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-2 shadow-julie-button transition-all"
        >
          <span>Start now</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* "Today" Schedule Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-900">Today</h2>
          <button
            onClick={() => onNavigateToTab('schedule')}
            className="text-xs font-semibold text-julie-600 hover:text-julie-700"
          >
            View all
          </button>
        </div>

        <div className="space-y-2.5">
          {liveTimeline.slice(0, 5).map((row, index) => {
            const meta = getRowIcon(row.title);
            const Icon = meta.icon;

            return (
              <div
                key={row.id || index}
                onClick={() => onNavigateToTab('schedule')}
                className="bg-white rounded-2xl border border-slate-100/80 shadow-card-soft p-3.5 flex items-center justify-between hover:border-julie-200 transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Left accent color pill indicator */}
                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${meta.bar}`} />

                <div className="flex items-center gap-3.5 pl-2">
                  <span className="text-xs font-semibold text-slate-700 font-mono w-16">
                    {row.startTime}
                  </span>

                  <div className={`w-8 h-8 rounded-xl ${meta.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {row.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "What's on your mind?" Input Bar */}
      <div className="pt-1">
        <form
          onSubmit={handleMindSubmit}
          className="bg-white rounded-full border border-slate-200/80 shadow-card-soft p-1.5 pl-4 flex items-center justify-between gap-2"
        >
          <input
            type="text"
            value={mindInput}
            onChange={e => setMindInput(e.target.value)}
            placeholder="What's on your mind?"
            className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />

          <button
            type="button"
            onClick={onOpenVoice}
            className="w-9 h-9 rounded-full bg-julie-50 text-julie-600 hover:bg-julie-500 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
            title="Tap to speak to Julie"
          >
            <Mic className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
