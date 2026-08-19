// =============================================================================
// PROJECT JULIE — ATTENDANCE SCREEN
// Official Attendance Record: From 08/07/2026 To 19/08/2026 is 60.34%
// Directly synchronized from Uttaranchal University Cyborg-ERP
// =============================================================================

import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  OFFICIAL_ATTENDANCE_OVERALL,
  OFFICIAL_SUBJECT_ATTENDANCE,
} from '@/core/data/userAttendance';
import { AttendanceEngine } from '@/services/attendance/AttendanceEngine';

interface AttendanceViewProps {
  onBack?: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ onBack }) => {
  const overall = OFFICIAL_ATTENDANCE_OVERALL;
  const subjects = OFFICIAL_SUBJECT_ATTENDANCE;

  return (
    <div className="space-y-4 pb-24 px-3.5 pt-2 text-white select-none">
      {/* Top Header */}
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
            <h1 className="text-xl font-bold text-white tracking-tight">Attendance</h1>
            <p className="text-[11px] text-slate-400">Uttaranchal University Cyborg-ERP</p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
          <GraduationCap className="w-4 h-4" />
        </div>
      </div>

      {/* Official Date Range & Overall Attendance Alert Banner */}
      <div className="liquid-glass rounded-2xl p-3 border border-amber-500/30 bg-amber-500/10 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-300">
            Attendance % From {overall.startDate} To {overall.endDate} is{' '}
            <span className="text-amber-400 font-extrabold">{overall.percentage}%</span>
          </p>
          <p className="text-[10px] text-slate-300 mt-0.5">
            Total Conducted: {overall.totalLectures} Lectures • Total Present: {overall.totalPresent} Lectures
          </p>
        </div>
      </div>

      {/* Overall Attendance Card */}
      <div className="liquid-glass-elevated rounded-3xl p-5 flex items-center justify-between border border-amber-500/30 shadow-2xl">
        <div>
          <p className="text-xs font-semibold text-slate-400">Current Standing</p>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">
            {overall.percentage}%
          </div>
          <p className="text-xs font-semibold text-amber-400 mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Below 75% Requirement (Shortage Alert)
          </p>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="currentColor"
              strokeWidth="6"
              className="text-white/10"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="currentColor"
              strokeWidth="6"
              className="text-amber-400"
              fill="transparent"
              strokeDasharray="201"
              strokeDashoffset={201 - (201 * overall.percentage) / 100}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-sm font-black text-white font-mono">{overall.percentage}%</span>
        </div>
      </div>

      {/* Subject-Wise Cards */}
      <div className="space-y-3 pt-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Registered Subjects ({subjects.length})
        </h2>

        <div className="space-y-2.5">
          {subjects.map(s => {
            const safeOrNeeded = AttendanceEngine.calculateSafeMisses(s.totalPresent, s.totalConducted, 75);
            const isShortage = s.percentage < 75.0;
            const classesNeeded = Math.abs(safeOrNeeded);
            const safeMisses = Math.max(0, safeOrNeeded);

            return (
              <div
                key={s.code}
                className={`liquid-glass rounded-3xl p-4 space-y-2.5 transition-all shadow-md ${
                  isShortage ? 'border-amber-500/30' : 'hover:border-sky-400/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-white">{s.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {s.code} • Prof. {s.faculty}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Lectures: <strong className="text-white">{s.totalPresent} Present</strong> / {s.totalConducted} Conducted
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-base font-extrabold font-mono ${
                        isShortage ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {s.percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Status Pill */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                  {isShortage ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Need to attend next{' '}
                      <strong className="text-white underline font-mono">{classesNeeded}</strong> consecutive class(es)
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      Can safely miss{' '}
                      <strong className="text-white font-mono">{safeMisses}</strong> class(es)
                    </span>
                  )}

                  <span className="text-[10px] text-slate-500 font-mono">Min 75% req</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
