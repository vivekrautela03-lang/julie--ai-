// =============================================================================
// PROJECT JULIE — REAL UTTARANCHAL UNIVERSITY UU-ERP DIRECT CONNECT MODAL
// Human-in-the-Loop Real Login + Session Detection + Zero Mock Data
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  User,
  LogOut,
  AlertTriangle,
  Clock,
  BookOpen,
  ArrowRight,
  Clipboard,
  FileText,
} from 'lucide-react';
import {
  UUERPBrowserSession,
  UUERPSyncEngine,
  UEUERPSessionManager,
  type ERPConnectionState,
  type UUERPSubjectAttendance,
  type UERPOverallAttendance,
  type UUERPStudentProfile,
} from '@/services/integrations/uu-erp';
import { UUERPAdminDashboard } from './UUERPAdminDashboard';

interface UUERPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UUERPModal: React.FC<UUERPModalProps> = ({ isOpen, onClose }) => {
  const [viewMode, setViewMode] = useState<'student' | 'admin'>('student');
  const [connectionState, setConnectionState] = useState<ERPConnectionState>(() =>
    UEUERPSessionManager.getState()
  );
  const [profile, setProfile] = useState<Partial<UUERPStudentProfile> | null>(() =>
    UEUERPSessionManager.getProfile()
  );
  const [overallAttendance, setOverallAttendance] = useState<UERPOverallAttendance | null>(null);
  const [subjects, setSubjects] = useState<UUERPSubjectAttendance[]>([]);
  const [freshness, setFreshness] = useState<string>(() =>
    UEUERPSessionManager.getFreshnessDescription()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isPasteExpanded, setIsPasteExpanded] = useState(false);

  const isElectron = UEUERPSessionManager.isElectronEnvironment();

  // Load cached or live state on modal open
  const reloadState = async () => {
    const currentState = UEUERPSessionManager.getState();
    setConnectionState(currentState);
    setProfile(UEUERPSessionManager.getProfile());
    setFreshness(UEUERPSessionManager.getFreshnessDescription());

    const cached = await UUERPSyncEngine.getCachedResults();
    setSubjects(cached.subjects);
    if (cached.overall && cached.overall.totalLectures > 0) {
      setOverallAttendance(cached.overall);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadState();
    }
  }, [isOpen]);

  // Subscribe to session state changes
  useEffect(() => {
    const unsubscribe = UEUERPSessionManager.subscribe((newState) => {
      setConnectionState(newState);
      setFreshness(UEUERPSessionManager.getFreshnessDescription());
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  // 1. Trigger Real UU-ERP Login Window (Human-in-the-Loop)
  const handleConnect = async () => {
    setIsProcessing(true);
    setStatusMessage({
      type: 'info',
      text: 'Opening real UU-ERP login window. Please enter your User ID, Password, and solve the CAPTCHA.',
    });

    try {
      const loginRes = await UUERPBrowserSession.openLoginWindow();
      if (loginRes.success) {
        setStatusMessage({
          type: 'info',
          text: 'Authentication detected! Synchronizing student academic data...',
        });

        // Trigger synchronization immediately after login (pass HTML if available)
        const syncRes = await UUERPSyncEngine.sync(loginRes.html);
        await reloadState();

        if (syncRes.success && syncRes.syncedSubjectsCount > 0) {
          setStatusMessage({
            type: 'success',
            text: `✅ Connected! Synchronized ${syncRes.syncedSubjectsCount} subjects from official UU-ERP portal.`,
          });
        } else {
          setStatusMessage({
            type: 'info',
            text: syncRes.message || 'Authenticated! You can also paste your attendance table below to sync instantly.',
          });
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: loginRes.error || 'Authentication was not completed.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Connection error: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
      reloadState();
    }
  };

  // 2. Direct Sync from Clipboard
  const handleClipboardSync = async () => {
    setIsProcessing(true);
    setStatusMessage({
      type: 'info',
      text: 'Reading copied attendance table from clipboard...',
    });

    try {
      if (!navigator.clipboard?.readText) {
        setIsPasteExpanded(true);
        setStatusMessage({
          type: 'info',
          text: 'Please paste your copied table into the box below and click Sync.',
        });
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text || text.trim().length === 0) {
        setIsPasteExpanded(true);
        setStatusMessage({
          type: 'error',
          text: 'Clipboard is empty. Copy the attendance table from UU-ERP first, or paste manually below.',
        });
        return;
      }

      const syncRes = await UUERPSyncEngine.syncFromRawContent(text);
      await reloadState();

      if (syncRes.success && syncRes.syncedSubjectsCount > 0) {
        setStatusMessage({
          type: 'success',
          text: `✅ Synced ${syncRes.syncedSubjectsCount} subjects successfully!`,
        });
        setPastedText('');
        setIsPasteExpanded(false);
      } else {
        setStatusMessage({
          type: 'error',
          text: syncRes.message || 'Could not recognize attendance table in clipboard.',
        });
        setIsPasteExpanded(true);
      }
    } catch (err: any) {
      setIsPasteExpanded(true);
      setStatusMessage({
        type: 'error',
        text: `Clipboard access error: ${err.message}. Please paste below.`,
      });
    } finally {
      setIsProcessing(false);
      reloadState();
    }
  };

  // 3. Direct Sync from Manual Paste
  const handleManualPasteSync = async () => {
    if (!pastedText || pastedText.trim().length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Please paste the attendance table HTML or text into the box first.',
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({
      type: 'info',
      text: 'Parsing and synchronizing attendance records...',
    });

    try {
      const syncRes = await UUERPSyncEngine.syncFromRawContent(pastedText);
      await reloadState();

      if (syncRes.success && syncRes.syncedSubjectsCount > 0) {
        setStatusMessage({
          type: 'success',
          text: `✅ Synced ${syncRes.syncedSubjectsCount} subjects successfully!`,
        });
        setPastedText('');
        setIsPasteExpanded(false);
      } else {
        setStatusMessage({
          type: 'error',
          text: syncRes.message || 'Could not parse attendance records. Please check the pasted text.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Parse error: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
      reloadState();
    }
  };

  // 2. Manual "Sync Now"
  const handleSyncNow = async () => {
    setIsProcessing(true);
    setStatusMessage({
      type: 'info',
      text: 'Fetching latest attendance and student data from uuerp.uudoon.in...',
    });

    try {
      const result = await UUERPSyncEngine.sync();
      await reloadState();

      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: result.message,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Sync error: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
      reloadState();
    }
  };

  // 3. Disconnect
  const handleDisconnect = async () => {
    setIsProcessing(true);
    try {
      await UUERPBrowserSession.disconnect();
      await reloadState();
      setStatusMessage({
        type: 'info',
        text: 'UU-ERP session disconnected. Active cookies cleared.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Disconnect error: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isConnected = connectionState === 'CONNECTED';
  const isSessionExpired = connectionState === 'SESSION_EXPIRED';
  const isSyncing = connectionState === 'SYNCING' || isProcessing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in text-white select-none">
      <div className={`bg-[#080912] rounded-3xl w-full ${viewMode === 'admin' ? 'max-w-3xl' : 'max-w-md'} p-6 space-y-4 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto transition-all`}>
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-md flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white leading-tight">UU-ERP | Cyborg-ERP</h2>
                {isConnected ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                  </span>
                ) : isSessionExpired ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <AlertTriangle className="w-2.5 h-2.5" /> Session expired
                  </span>
                ) : isSyncing ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Synchronizing...
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                    Not connected
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Uttaranchal University Official Student Portal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('student')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${
              viewMode === 'student' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Portal
          </button>
          <button
            type="button"
            onClick={() => setViewMode('admin')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${
              viewMode === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Autonomous Sync Control (Admin)
          </button>
        </div>

        {viewMode === 'admin' ? (
          <UUERPAdminDashboard />
        ) : (
          <>

        {/* Status Message Banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs font-medium flex items-start gap-2 animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                : 'bg-sky-500/10 border border-sky-500/30 text-sky-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <RefreshCw className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 animate-spin" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Quick Paste & Instant Sync Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-blue-950/40 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
              <Clipboard className="w-3.5 h-3.5 text-sky-400" />
              📋 Instant Table Sync (Web &amp; Desktop)
            </span>
            <button
              type="button"
              onClick={() => setIsPasteExpanded(!isPasteExpanded)}
              className="text-[10px] font-semibold text-slate-400 hover:text-white transition-colors"
            >
              {isPasteExpanded ? 'Collapse ▲' : 'Manual Paste Box ▼'}
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Copy the attendance table from{' '}
            <a
              href="https://uuerp.uudoon.in/Web_StudentAcademic/Cyborg_StudentAttendanceAcademic"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>UU-ERP Attendance Page</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            {' '}and tap below to sync instantly.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClipboardSync}
              disabled={isSyncing}
              className="flex-1 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>📋 Paste from Clipboard &amp; Sync</span>
            </button>

            <a
              href="https://uuerp.uudoon.in/Web_StudentAcademic/Cyborg_StudentAttendanceAcademic"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
              title="Open Attendance Page in New Tab"
            >
              <span>Open ERP</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {isPasteExpanded && (
            <div className="space-y-2 pt-1 animate-fade-in">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste copied UU-ERP attendance table rows or full page HTML here..."
                className="w-full h-24 p-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-sky-400 resize-none"
              />
              <button
                type="button"
                onClick={handleManualPasteSync}
                disabled={isSyncing || !pastedText.trim()}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>⚡ Parse &amp; Synchronize Pasted Data</span>
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: CONNECTED STATE                                        */}
        {/* ------------------------------------------------------------- */}
        {isConnected && (
          <div className="space-y-3">
            {/* Student Profile Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/30 to-sky-900/20 border border-sky-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-sky-400" /> Authenticated Student
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">● Connected</span>
              </div>
              <h3 className="text-sm font-bold text-white">
                {profile?.studentName || 'Authenticated Student'}
              </h3>
              <p className="text-xs text-slate-300">
                {profile?.studentId ? `ID: ${profile.studentId} • ` : ''}
                {profile?.program || 'Uttaranchal University'}
                {profile?.semester ? ` (Sem ${profile.semester})` : ''}
              </p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                <Clock className="w-3 h-3 text-slate-500" /> {freshness}
              </p>
            </div>

            {/* Overall Attendance Metric */}
            {overallAttendance && (
              <div className="p-3.5 rounded-2xl liquid-glass border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Overall Attendance
                  </span>
                  <p className="text-2xl font-black text-sky-400 mt-0.5">
                    {overallAttendance.percentage}%
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {overallAttendance.totalPresent} of {overallAttendance.totalLectures} lectures attended
                  </p>
                </div>
                <div
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    overallAttendance.percentage >= 75
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {overallAttendance.percentage >= 75 ? 'Above 75% Target' : 'Below 75% Requirement'}
                </div>
              </div>
            )}

            {/* Subject Breakdown List */}
            {subjects.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Synchronized Subjects ({subjects.length})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {subjects.map((sub) => (
                    <div
                      key={sub.subjectId}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="overflow-hidden pr-2">
                        <p className="font-semibold text-white truncate">{sub.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {sub.code} • {sub.totalPresent}/{sub.totalConducted} classes
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold text-xs ${
                            sub.percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {sub.percentage}%
                        </span>
                        <p className="text-[9px] text-slate-500">
                          {sub.safeMisses > 0
                            ? `Can miss ${sub.safeMisses}`
                            : sub.recoveryNeeded > 0
                            ? `Need ${sub.recoveryNeeded}`
                            : 'On track'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: [ Sync Now ] [ Reconnect ] [ Disconnect ] */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>

              <button
                type="button"
                onClick={handleConnect}
                disabled={isSyncing}
                className="py-2.5 rounded-xl liquid-glass text-xs font-semibold text-sky-300 hover:text-white flex items-center justify-center gap-1 transition-colors border border-sky-400/20"
              >
                <span>Reconnect</span>
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isSyncing}
                className="py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-xs font-semibold text-slate-400 hover:text-rose-300 transition-colors flex items-center justify-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: SESSION EXPIRED STATE                                 */}
        {/* ------------------------------------------------------------- */}
        {isSessionExpired && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>UU-ERP Session Expired</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Your university authentication session has timed out on the ERP server.
                Julie is preserving your last synchronized attendance data. Reconnect to resume live synchronization.
              </p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> {freshness}
              </p>
            </div>

            {/* Preserved Cached Attendance Snapshot */}
            {subjects.length > 0 && (
              <div className="p-3 rounded-2xl liquid-glass border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Preserved Cache ({subjects.length} Subjects)
                  </span>
                  {overallAttendance && (
                    <span className="font-mono font-bold text-sky-400">
                      {overallAttendance.percentage}% Overall
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action: [ Reconnect UU-ERP ] */}
            <button
              type="button"
              onClick={handleConnect}
              disabled={isSyncing}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Reconnect UU-ERP (Solve CAPTCHA)</span>
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: DISCONNECTED STATE                                     */}
        {/* ------------------------------------------------------------- */}
        {!isConnected && !isSessionExpired && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl liquid-glass border border-white/10 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Official University Connection
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect Julie directly to your Uttaranchal University Cyborg-ERP account to synchronize your real-time attendance, safe misses, and academic roster.
              </p>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px] text-slate-400">
                <p className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Real Human Authentication Flow:
                </p>
                <ol className="list-decimal list-inside pl-1 space-y-1 text-[10px]">
                  <li>Julie opens the official login page (<code className="text-sky-300">uuerp.uudoon.in</code>).</li>
                  <li>You personally enter your User ID &amp; Password.</li>
                  <li>You solve the official visual CAPTCHA and click Login.</li>
                  <li>Julie detects authentication and synchronizes your records.</li>
                </ol>
              </div>
            </div>

            {/* Direct Official Link */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>Portal URL: https://uuerp.uudoon.in/Account/Login_UU</span>
              <a
                href="https://uuerp.uudoon.in/Account/Login_UU"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
              >
                <span>View</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {/* Action: [ Connect UU-ERP ] */}
            <button
              type="button"
              onClick={handleConnect}
              disabled={isSyncing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95 transition-all disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting with UU-ERP...</span>
                </>
              ) : (
                <>
                  <span>Connect UU-ERP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
