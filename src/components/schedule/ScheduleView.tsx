// =============================================================================
// PROJECT JULIE — OFFICIAL SCHEDULE VIEW
// Today / Tomorrow / Full Week Uttaranchal University (UU-ERP) Timetable
// =============================================================================

import React, { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, User, Clock, CheckCircle2, Sparkles, Check, X } from 'lucide-react';
import { OFFICIAL_WEEKLY_TIMETABLE } from '@/core/data/userTimetable';
import { AttendanceEngine } from '@/services/attendance/AttendanceEngine';

interface ScheduleViewProps {
  onBack?: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onBack }) => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 3 = Wed, 4 = Thu
  const todayDayIndex = currentDay === 0 ? 1 : Math.min(6, currentDay);
  const tomorrowDayIndex = todayDayIndex >= 6 ? 1 : todayDayIndex + 1;

  const [selectedDayIndex, setSelectedDayIndex] = useState(todayDayIndex);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const days = [
    { name: 'Mon', dayIndex: 1, full: 'Monday' },
    { name: 'Tue', dayIndex: 2, full: 'Tuesday' },
    { name: 'Wed', dayIndex: 3, full: 'Wednesday' },
    { name: 'Thu', dayIndex: 4, full: 'Thursday' },
    { name: 'Fri', dayIndex: 5, full: 'Friday' },
    { name: 'Sat', dayIndex: 6, full: 'Saturday' },
  ];

  const currentClasses = OFFICIAL_WEEKLY_TIMETABLE.filter(
    c => c.day_of_week === selectedDayIndex
  ).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const handleMarkAttendance = async (subjectCode: string, status: 'attended' | 'missed') => {
    const res = await AttendanceEngine.markClassAttendance(subjectCode, status, 'User Command');
    if (res.success) {
      setActionNotice(res.message);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const getPeriodLabel = (startTime: string) => {
    if (startTime.startsWith('09:30')) return '(P1)';
    if (startTime.startsWith('10:30')) return '(P2)';
    if (startTime.startsWith('11:30')) return '(P3)';
    if (startTime.startsWith('13:30')) return '(P5)';
    if (startTime.startsWith('14:30')) return '(P6)';
    return '';
  };

  const getDotColor = (code?: string) => {
    switch (code) {
      case 'BBA-201':
        return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]';
      case 'BBA-202':
        return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]';
      case 'BBA-203-DM1':
        return 'bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.8)]';
      case 'BBA-204':
        return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]';
      case 'BBA-205':
        return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]';
      case 'BBA-206':
        return 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]';
      case 'EXC-199':
        return 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]';
      default:
        return 'bg-white/50';
    }
  };

  return (
    <div className="space-y-4 pb-24 px-3.5 pt-2 text-white select-none">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-2xl liquid-pill text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Class Timetable</h1>
            <p className="text-[11px] text-slate-400">Uttaranchal University Cyborg-ERP</p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
          <Calendar className="w-4 h-4" />
        </div>
      </div>

      {/* Dynamic Toast Notice */}
      {actionNotice && (
        <div className="p-3 rounded-2xl liquid-glass border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Quick Today / Tomorrow Preset Pills */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedDayIndex(todayDayIndex)}
          className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all ${
            selectedDayIndex === todayDayIndex
              ? 'bg-gradient-to-r from-julie-600 to-sky-500 text-white shadow-md'
              : 'liquid-pill text-slate-400 hover:text-white'
          }`}
        >
          📍 Today ({days.find(d => d.dayIndex === todayDayIndex)?.name})
        </button>

        <button
          onClick={() => setSelectedDayIndex(tomorrowDayIndex)}
          className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all ${
            selectedDayIndex === tomorrowDayIndex
              ? 'bg-gradient-to-r from-julie-600 to-sky-500 text-white shadow-md'
              : 'liquid-pill text-slate-400 hover:text-white'
          }`}
        >
          ⚡ Tomorrow ({days.find(d => d.dayIndex === tomorrowDayIndex)?.name})
        </button>
      </div>

      {/* Weekday Selector Bar */}
      <div className="flex items-center justify-between gap-1 liquid-glass p-1.5 rounded-2xl">
        {days.map(d => {
          const isSelected = selectedDayIndex === d.dayIndex;
          const isToday = d.dayIndex === todayDayIndex;

          return (
            <button
              key={d.dayIndex}
              onClick={() => setSelectedDayIndex(d.dayIndex)}
              className={`flex-1 py-2 rounded-xl text-center transition-all ${
                isSelected
                  ? 'liquid-glass-button text-white shadow-glass-button font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="block text-[11px] uppercase font-semibold">{d.name}</span>
              {isToday && <span className="block text-[8px] text-sky-400 font-bold">•</span>}
            </button>
          );
        })}
      </div>

      {/* Classes List */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-400">
            {days.find(d => d.dayIndex === selectedDayIndex)?.full}'s Lectures ({currentClasses.length})
          </p>
          <span className="text-[10px] text-sky-400 font-mono">5-Min Pre-Class Alert</span>
        </div>

        {currentClasses.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-8 text-center text-slate-400 text-xs">
            No lectures scheduled on this day.
          </div>
        ) : (
          currentClasses.map((cls, idx) => (
            <div
              key={cls.id || idx}
              className="liquid-glass rounded-3xl p-4 space-y-2.5 shadow-md hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getDotColor(cls.subject_code)}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-sky-400 font-mono">
                        {getPeriodLabel(cls.start_time)} {cls.start_time} – {cls.end_time}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white mt-0.5">{cls.subject_name}</h3>
                  </div>
                </div>

                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  {cls.subject_code}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    {cls.faculty_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    Room {cls.room_number || '304'}
                  </span>
                </div>

                {/* Quick 1-Tap Attendance */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMarkAttendance(cls.subject_code || '', 'attended')}
                    className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                  >
                    + Present
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(cls.subject_code || '', 'missed')}
                    className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 text-[9px] font-bold border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                  >
                    Missed
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
