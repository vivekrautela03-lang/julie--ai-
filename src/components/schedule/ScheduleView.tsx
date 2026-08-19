// =============================================================================
// PROJECT JULIE — OFFICIAL SCHEDULE VIEW
// Directly connected to Uttaranchal University (UU-ERP / Cyborg-ERP) Timetable
// =============================================================================

import React, { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, User, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { OFFICIAL_WEEKLY_TIMETABLE } from '@/core/data/userTimetable';

interface ScheduleViewProps {
  onBack?: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onBack }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(1); // 1 = Mon, 2 = Tue, etc.

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

      {/* Weekday Selector Bar */}
      <div className="flex items-center justify-between gap-1 liquid-glass p-1.5 rounded-2xl">
        {days.map(d => {
          const isSelected = selectedDayIndex === d.dayIndex;

          return (
            <button
              key={d.dayIndex}
              onClick={() => setSelectedDayIndex(d.dayIndex)}
              className={`flex-1 py-2.5 rounded-xl text-center transition-all ${
                isSelected
                  ? 'liquid-glass-button text-white shadow-glass-button font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="block text-[11px] uppercase font-semibold">{d.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Classes Stream */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {days.find(d => d.dayIndex === selectedDayIndex)?.full} Lectures
          </h2>
          <span className="text-[11px] text-sky-400 font-semibold font-mono">
            {currentClasses.length} Scheduled
          </span>
        </div>

        {currentClasses.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-6 text-center space-y-2 border border-white/5">
            <Sparkles className="w-8 h-8 text-sky-400 mx-auto" />
            <p className="text-xs font-bold text-white">No classes scheduled today</p>
            <p className="text-[11px] text-slate-400">Time for revision, project work, or rest.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentClasses.map((cls, idx) => {
              const period = getPeriodLabel(cls.start_time);
              const dot = getDotColor(cls.subject_code);
              const formattedTime = `${cls.start_time.slice(0, 5)} - ${cls.end_time.slice(0, 5)}`;

              return (
                <div
                  key={cls.id || idx}
                  className="liquid-glass rounded-3xl p-4 space-y-2 hover:border-sky-400/30 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white/10 text-sky-300 font-mono">
                            {period} {cls.subject_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{formattedTime}</span>
                        </div>
                        <h3 className="text-xs font-bold text-white mt-1 leading-snug">
                          {cls.subject_name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{cls.faculty_name || 'Faculty'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3 h-3 text-sky-400" />
                      <span>{cls.room_number || 'Room 304'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
