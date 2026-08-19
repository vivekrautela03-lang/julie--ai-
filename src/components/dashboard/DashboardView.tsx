// =============================================================================
// PROJECT JULIE — DAY COMMAND CENTER (DASHBOARD)
// Liquid Glass layout with live clock, weather, 60.34% attendance gauge, schedule,
// exams countdown, and quick action launchpad.
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sun,
  MapPin,
  Clock,
  ChevronRight,
  Plus,
  Mic,
  Upload,
  Calendar,
  CheckSquare,
  GraduationCap,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import type { DrawerTab } from '@/components/common/GlassDrawer';
import { OFFICIAL_ATTENDANCE_OVERALL, OFFICIAL_SUBJECT_ATTENDANCE } from '@/core/data/userAttendance';
import { getTimeBasedGreeting } from '@/core/utils/greeting';

interface DashboardViewProps {
  onBack?: () => void;
  onNavigateToTab: (tab: DrawerTab) => void;
  onOpenVoice: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onBack,
  onNavigateToTab,
  onOpenVoice,
}) => {
  const [timeStr, setTimeStr] = useState('09:15');
  const [dateStr, setDateStr] = useState('Wednesday, 19 August');
  const [timeGreeting, setTimeGreeting] = useState(() => getTimeBasedGreeting('boss'));
  const overall = OFFICIAL_ATTENDANCE_OVERALL;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }));
      setTimeGreeting(getTimeBasedGreeting('boss'));
    };
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 pb-24 px-3.5 pt-2 text-white select-none">
      {/* Header & Live Time/Weather Banner */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-2xl liquid-pill text-slate-400 hover:text-white transition-colors shrink-0"
              title="Return to Chat"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-1.5 leading-tight">
              {timeGreeting.greeting} <span className="text-xl">{timeGreeting.emoji}</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">{dateStr}</p>
          </div>
        </div>

        {/* Liquid Glass Weather & Clock Card */}
        <div className="liquid-glass-elevated rounded-3xl p-4 flex items-center justify-between border border-white/10 shadow-2xl">
          <div>
            <div className="text-3xl font-black tracking-tight text-white font-mono flex items-baseline gap-1">
              {timeStr} <span className="text-xs font-semibold text-slate-400 font-sans">IST</span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-sky-400" /> Dehradun, India
            </p>
          </div>

          <div className="text-right flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Sun className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="text-lg font-bold text-white leading-tight">24°C</div>
              <span className="text-[11px] text-slate-400">Sunny</span>
            </div>
          </div>
        </div>
      </div>

      {/* "✦ JULIE SAYS" Executive Briefing Card */}
      <div className="liquid-glass rounded-3xl p-5 space-y-3 border border-amber-400/30 shadow-[0_0_30px_rgba(245,158,11,0.12)] relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Julie Executive Briefing</span>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Attendance Alert
          </span>
        </div>

        <div className="space-y-1.5 text-xs leading-relaxed text-slate-200">
          <p>• Today's first class: <strong className="text-white">Corporate & Business Law at 09:30 AM</strong> (Room 304).</p>
          <p>
            • Overall attendance is <strong className="text-amber-400">{overall.percentage}%</strong> ({overall.totalPresent}/{overall.totalLectures} Lectures).
          </p>
          <p>
            • <strong className="text-rose-400">Action required:</strong> Attend all upcoming lectures in <em>Digital Marketing (30.77%)</em> and <em>MS-Excel (55.56%)</em> to recover to 75%.
          </p>
          <p className="text-slate-300 pt-0.5">• You have <strong className="text-white">1 assignment due tomorrow</strong>.</p>
        </div>

        <button
          onClick={() => onNavigateToTab('attendance')}
          className="w-full liquid-glass-button text-white font-semibold text-xs py-2.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-glass-button transition-all"
        >
          <span>View attendance recovery plan</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid: Schedule & Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Today's Schedule Card */}
        <div className="liquid-glass rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Schedule</h2>
            <button onClick={() => onNavigateToTab('schedule')} className="text-xs text-sky-400 font-semibold hover:text-sky-300">
              See all
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <span className="font-mono text-slate-400 text-[11px] w-16 shrink-0">09:30 AM</span>
              <div>
                <p className="font-semibold text-white">(P1) Business Law</p>
                <p className="text-[10px] text-slate-400">Room 304 • Namita</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="font-mono text-slate-400 text-[11px] w-16 shrink-0">10:30 AM</span>
              <div>
                <p className="font-semibold text-white">(P2) Management Accounting</p>
                <p className="text-[10px] text-slate-400">Room 304 • Anupam Gupta</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="font-mono text-slate-400 text-[11px] w-16 shrink-0">11:30 AM</span>
              <div>
                <p className="font-semibold text-white">(P3) Tour Package Operations</p>
                <p className="text-[10px] text-slate-400">Room 304 • Rishika Aggarwal</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span className="font-mono text-slate-400 text-[11px] w-16 shrink-0">01:30 PM</span>
              <div>
                <p className="font-semibold text-white">(P5) Office Management</p>
                <p className="text-[10px] text-slate-400">Room 304 • Swati Tiwari</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              <span className="font-mono text-slate-400 text-[11px] w-16 shrink-0">02:30 PM</span>
              <div>
                <p className="font-semibold text-white">(P6) Digital Marketing</p>
                <p className="text-[10px] text-slate-400">Room 304 • Mohd Amir</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Card with Circular Ring */}
        <div className="liquid-glass rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance</h2>
            <button onClick={() => onNavigateToTab('attendance')} className="text-xs text-sky-400 font-semibold hover:text-sky-300">
              See all
            </button>
          </div>

          <div className="flex items-center justify-between px-2 py-1">
            <div>
              <p className="text-xs font-semibold text-slate-400">Overall (08/07 - 19/08)</p>
              <p className="text-xs font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Shortage (Min 75% req)
              </p>
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" className="text-white/10" fill="transparent" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-amber-400"
                  fill="transparent"
                  strokeDasharray="163"
                  strokeDashoffset={163 - (163 * overall.percentage) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-black text-white font-mono">{overall.percentage}%</span>
            </div>
          </div>

          <div className="space-y-1 text-xs text-slate-300 pt-1 divide-y divide-white/5">
            {OFFICIAL_SUBJECT_ATTENDANCE.slice(0, 5).map(s => (
              <div key={s.code} className="flex justify-between py-1">
                <span className="truncate pr-2">{s.name}</span>
                <span className={`font-semibold font-mono ${s.percentage < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {s.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Task & Exams */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Upcoming Task */}
        <div
          onClick={() => onNavigateToTab('tasks')}
          className="liquid-glass rounded-3xl p-4 space-y-2 cursor-pointer hover:border-sky-400/40 transition-all"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Task</h3>
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-bold text-white">Digital Marketing Strategy</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Due tomorrow, 11:59 PM</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              High
            </span>
          </div>
        </div>

        {/* Exams Countdown */}
        <div className="liquid-glass rounded-3xl p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Exams</h3>
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-bold text-white">Corporate & Business Law</p>
              <p className="text-[10px] text-slate-400 mt-0.5">30 August 2026</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-white font-mono">11</span>
              <span className="text-[10px] text-slate-400 block -mt-1">Days Left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Quick Action Bar */}
      <div className="pt-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">Quick Actions</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => onNavigateToTab('tasks')}
            className="px-3.5 py-2 rounded-2xl liquid-pill text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" /> New Task
          </button>
          <button
            onClick={onOpenVoice}
            className="px-3.5 py-2 rounded-2xl liquid-glass-button text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap shadow-glass-button active:scale-95"
          >
            <Mic className="w-3.5 h-3.5" /> Talk to Julie
          </button>
          <button
            onClick={() => onNavigateToTab('chat')}
            className="px-3.5 py-2 rounded-2xl liquid-pill text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" /> Upload File
          </button>
          <button
            onClick={() => onNavigateToTab('schedule')}
            className="px-3.5 py-2 rounded-2xl liquid-pill text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" /> Schedule
          </button>
          <button
            onClick={() => onNavigateToTab('tasks')}
            className="px-3.5 py-2 rounded-2xl liquid-pill text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <CheckSquare className="w-3.5 h-3.5 text-sky-400" /> View Tasks
          </button>
        </div>
      </div>
    </div>
  );
};
