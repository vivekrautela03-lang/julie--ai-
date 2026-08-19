import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Calendar,
  BookOpen,
  Sparkles,
  Lock,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { uuerpAdapter, type UUERPCredentials } from '@/services/integrations/UttaranchalUniversityERPAdapter';

interface UUERPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UUERPModal: React.FC<UUERPModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<UUERPCredentials>(uuerpAdapter.getSavedConfig());
  const [studentId, setStudentId] = useState(config.studentId || 'UU21BBA1042');
  const [password, setPassword] = useState('');
  const [portalUrl, setPortalUrl] = useState(config.portalUrl || 'https://uuerp.uudoon.in/Account/Cyborg_StudentMenu');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    setIsSyncing(true);
    setSyncMsg(null);

    try {
      const result = await uuerpAdapter.login(studentId, password);
      setConfig(uuerpAdapter.getSavedConfig());
      setSyncMsg(
        `Connected & Logged In! Julie AI is now managing ${result.syncedClassesCount} timetable lectures, 7 subject attendance records, and assignments.`
      );
    } catch (err: any) {
      setSyncMsg(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    uuerpAdapter.logout();
    setConfig(uuerpAdapter.getSavedConfig());
    setSyncMsg('Logged out from UU-ERP.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fade-in text-white select-none">
      <div className="bg-[#0A0B14] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 p-0.5 shadow-md flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-extrabold text-white leading-tight">UU-ERP | Cyborg-ERP</h2>
                {config.isLoggedIn && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <p className="text-[10px] text-slate-400">Uttaranchal University Student Portal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-2xl liquid-pill text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Connected Portal Link Banner */}
        <div className="liquid-glass rounded-2xl p-3.5 flex items-center justify-between gap-2 border border-blue-500/20 bg-blue-500/5">
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold text-sky-400 block uppercase tracking-wider">
              Connected Portal
            </span>
            <p className="text-xs font-mono text-slate-300 truncate mt-0.5">{portalUrl}</p>
          </div>

          <a
            href="https://uuerp.uudoon.in/Account/Cyborg_StudentMenu"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl liquid-glass text-sky-400 hover:text-white shrink-0 transition-colors"
            title="Open official portal"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Direct Login Form */}
        <form onSubmit={handleLoginAndSync} className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Student Roll / Registration No.
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="text"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="e.g. UU21BBA1042"
                className="w-full liquid-glass rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Portal Password / Session Auth Token
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full liquid-glass rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
              />
            </div>
          </div>

          {/* Julie AI Autonomous Management Feature List */}
          <div className="liquid-glass rounded-2xl p-3.5 space-y-2 border border-sky-400/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Julie AI Autonomous Data Management
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] text-slate-300">21 Weekly Lectures</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] text-slate-300">7 Subject Attendance</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] text-slate-300">Exam Datesheets</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] text-slate-300">Safe Miss Calculator</span>
              </div>
            </div>

            {config.lastSyncedAt && (
              <p className="text-[10px] text-slate-400 pt-1 font-mono">
                Last synced: {config.lastSyncedAt}
              </p>
            )}
          </div>

          {/* Sync Status Banner */}
          {syncMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-start gap-2 animate-fade-in">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{syncMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={isSyncing}
              className="w-full liquid-glass-button text-white font-semibold text-xs py-3 rounded-full flex items-center justify-center gap-2 shadow-glass-button transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Logging in & Synchronizing...' : 'Sync UU-ERP Data Now'}</span>
            </button>

            {config.isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect / Switch ERP Account</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
