// =============================================================================
// PROJECT JULIE — DAY COMMAND CENTER (DASHBOARD)
// Live weather + Today/Tomorrow schedule + Interactive Tasks (Add & Delete) + PWA Install & Voices.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Sparkles,
  Sun,
  MapPin,
  Calendar,
  CheckSquare,
  Square,
  CheckCircle2,
  Trash2,
  Plus,
  GraduationCap,
  ArrowLeft,
  Wind,
  Droplets,
  ChevronRight,
  Download,
  Volume2,
  RefreshCw,
  Key,
} from 'lucide-react';
import type { DrawerTab } from '@/components/common/GlassDrawer';
import { OFFICIAL_ATTENDANCE_OVERALL } from '@/core/data/userAttendance';
import { OFFICIAL_WEEKLY_TIMETABLE } from '@/core/data/userTimetable';
import { getTimeBasedGreeting } from '@/core/utils/greeting';
import { WeatherService, type LiveWeatherData } from '@/services/integrations/WeatherService';
import { db, CURRENT_USER_ID } from '@/core/storage/db';
import { VoicePersonaModal } from '@/components/settings/VoicePersonaModal';
import { InstallAppModal } from '@/components/common/InstallAppModal';
import { UUERPModal } from '@/components/integrations/UUERPModal';
import { ApiKeyModal } from '@/components/auth/ApiKeyModal';
import { uuerpAdapter } from '@/services/integrations/UttaranchalUniversityERPAdapter';
import type { Task } from '@/core/types';
import { DailyERPSyncService } from '@/services/integrations/DailyERPSyncService';
import { voiceService } from '@/services/voice/VoiceService';
import { UEUERPSessionManager, UUERPSyncEngine } from '@/services/integrations/uu-erp';

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
  const [scheduleTab, setScheduleTab] = useState<'today' | 'tomorrow'>('today');
  const [weather, setWeather] = useState<LiveWeatherData | null>(null);

  // Modals
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isUUERPModalOpen, setIsUUERPModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Immediate Sync State
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [erpState, setErpState] = useState(() => UEUERPSessionManager.getState());

  useEffect(() => {
    return UEUERPSessionManager.subscribe((state) => setErpState(state));
  }, []);

  // New task input state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Live query tasks
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const erpConfig = uuerpAdapter.getSavedConfig();

  const handleImmediateSync = async () => {
    setIsManualSyncing(true);
    setSyncNotice('Connecting to UU-ERP & refreshing data...');
    try {
      const res = await UUERPSyncEngine.sync();
      setSyncNotice(res.message);
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (e: any) {
      setSyncNotice(`Sync note: ${e.message}`);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Fetch real-time live weather
  useEffect(() => {
    WeatherService.getLiveWeather().then(data => setWeather(data));
    const weatherTimer = setInterval(() => {
      WeatherService.getLiveWeather().then(data => setWeather(data));
    }, 180000); // 3 minutes
    return () => clearInterval(weatherTimer);
  }, []);

  // Real-time live clock
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

  // Compute Today and Tomorrow
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const todayDayIndex = currentDayOfWeek === 0 ? 1 : Math.min(6, currentDayOfWeek);
  const tomorrowDayIndex = todayDayIndex >= 6 ? 1 : todayDayIndex + 1;

  const activeDayIndex = scheduleTab === 'today' ? todayDayIndex : tomorrowDayIndex;
  const activeDayName = scheduleTab === 'today' ? 'Today' : 'Tomorrow';

  const displayedClasses = OFFICIAL_WEEKLY_TIMETABLE.filter(
    c => c.day_of_week === activeDayIndex
  ).sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Add Task Handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      user_id: CURRENT_USER_ID,
      title: newTaskTitle.trim(),
      status: 'Planned',
      priority: 'Medium',
      category: 'General',
      estimated_duration_minutes: 30,
      recurrence: 'none',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.tasks.add(task);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  // Toggle Task Completion
  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'Completed' ? 'Planned' : 'Completed';
    await db.tasks.update(task.id, {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  };

  // Delete Task Handler
  const handleDeleteTask = async (taskId: string) => {
    await db.tasks.delete(taskId);
  };

  return (
    <div className="space-y-4 pb-24 px-3.5 pt-2 text-white select-none">
      {/* Header & Live Time/Weather Banner */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
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

          <div className="flex items-center gap-2">
            {/* 1-Tap Manual Sync Now Trigger */}
            <button
              onClick={handleImmediateSync}
              disabled={isManualSyncing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full liquid-glass border border-sky-500/30 hover:border-sky-400 text-xs font-bold text-sky-300 hover:text-white active:scale-95 transition-all shadow-sm"
              title="Manually trigger immediate UU-ERP sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{isManualSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            {/* Quick Install App Button */}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full liquid-pill text-xs font-bold text-sky-400 hover:text-white hover:bg-sky-500/20 active:scale-95 transition-all shadow-sm"
              title="Download Julie App on Desktop & Mobile"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px]">Install</span>
            </button>
          </div>
        </div>

        {/* Sync Toast Notification */}
        {syncNotice && (
          <div className="p-3 rounded-2xl liquid-glass border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Real-time Live Weather & Clock Card */}
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
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 text-xl shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <span>{weather?.icon || '☀️'}</span>
            </div>
            <div>
              <div className="text-lg font-bold text-white leading-tight">
                {weather?.temperature ? `${weather.temperature}°C` : '28°C'}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {weather?.condition || 'Clear Sky'}
              </span>
              <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                <span className="flex items-center gap-0.5"><Droplets className="w-2.5 h-2.5 text-sky-400" /> {weather?.humidity || 62}%</span>
                <span className="flex items-center gap-0.5"><Wind className="w-2.5 h-2.5 text-slate-400" /> {weather?.windSpeed || 8} km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI ASSISTANT NEURAL CORE & MOBILE VOICE STATUS BAR */}
      <div className="p-2.5 rounded-2xl liquid-glass border border-sky-500/30 flex items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="truncate">
            <span className="text-[10px] font-extrabold text-sky-300 block uppercase tracking-wider">
              Gemini 2.5 Flash Neural Core
            </span>
            <p className="text-[10px] text-slate-400 truncate">
              Live AI Assistant Active • Mobile Voice Ready
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="px-2 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
            title="Setup or change Gemini API Key"
          >
            <Key className="w-3 h-3 text-purple-400" />
            <span>API Key</span>
          </button>

          <button
            onClick={() => {
              voiceService.unlockMobileAudio();
              voiceService.testMobileVoice();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
            title="Test speaker on your mobile phone"
          >
            <Volume2 className="w-3 h-3 text-sky-400" />
            <span>Test Voice</span>
          </button>
        </div>
      </div>

      {/* QUICK LAUNCH BAR: UU-ERP, VOICES & INSTALL */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setIsUUERPModalOpen(true)}
          className="p-2.5 rounded-2xl liquid-glass border border-blue-500/30 hover:border-blue-400 flex flex-col items-center justify-center text-center transition-all active:scale-95"
          title="Direct Uttaranchal University ERP Portal"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-sky-400 flex items-center justify-center mb-1">
            <GraduationCap className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-bold text-white leading-tight">UU-ERP</p>
          <p className={`text-[9px] mt-0.5 font-medium ${
            erpState === 'CONNECTED'
              ? 'text-emerald-400'
              : erpState === 'SESSION_EXPIRED'
              ? 'text-amber-400'
              : erpState === 'SYNCING'
              ? 'text-sky-400'
              : 'text-slate-400'
          }`}>
            {erpState === 'CONNECTED'
              ? '● Connected'
              : erpState === 'SESSION_EXPIRED'
              ? '⚠ Expired'
              : erpState === 'SYNCING'
              ? '⟳ Syncing'
              : 'Not Connected'}
          </p>
        </button>

        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="p-2.5 rounded-2xl liquid-glass border border-purple-500/30 hover:border-purple-400 flex flex-col items-center justify-center text-center transition-all active:scale-95"
          title="Female Assistant Voices"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-1">
            <Volume2 className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-bold text-white leading-tight">Voices</p>
          <p className="text-[9px] text-slate-400 mt-0.5">5 Options</p>
        </button>

        <button
          onClick={() => setIsInstallModalOpen(true)}
          className="p-2.5 rounded-2xl liquid-glass border border-sky-500/30 hover:border-sky-400 flex flex-col items-center justify-center text-center transition-all active:scale-95"
          title="Install Julie App on PC and Phone"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center mb-1">
            <Download className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-bold text-white leading-tight">Download</p>
          <p className="text-[9px] text-slate-400 mt-0.5">PC / Phone</p>
        </button>
      </div>

      {/* INTERACTIVE TASKS SECTION (ADD & DELETE ON DASHBOARD) */}
      <div className="liquid-glass rounded-3xl p-4 space-y-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Tasks & To-Dos ({tasks.filter(t => t.status !== 'Completed').length} Pending)
            </h2>
          </div>

          <button
            onClick={() => setIsAddingTask(prev => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-sky-400 hover:text-white text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Inline Add Task Form */}
        {isAddingTask && (
          <form onSubmit={handleCreateTask} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-julie-600 to-sky-500 text-white font-bold text-xs shadow-sm hover:brightness-110 active:scale-95"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Live Tasks List with Delete & Complete */}
        <div className="space-y-2 pt-1">
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">No tasks recorded yet. Tap + Add Task to create one.</p>
          ) : (
            tasks.map(task => {
              const isCompleted = task.status === 'Completed';

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-white/[0.01] border-white/5 opacity-60'
                      : 'bg-white/[0.03] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="text-slate-400 hover:text-sky-400 transition-colors shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    <span
                      onClick={() => handleToggleTask(task)}
                      className={`text-xs text-white truncate cursor-pointer ${
                        isCompleted ? 'line-through text-slate-400' : 'font-medium'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  {/* Priority badge & Delete/Remove Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'High'
                          ? 'bg-rose-500/20 text-rose-300'
                          : task.priority === 'Medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {task.priority || 'Normal'}
                    </span>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
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
          <p>
            • Overall attendance stands at <strong className="text-amber-400">{OFFICIAL_ATTENDANCE_OVERALL.percentage}%</strong> ({OFFICIAL_ATTENDANCE_OVERALL.totalPresent}/{OFFICIAL_ATTENDANCE_OVERALL.totalLectures} Lectures).
          </p>
          <p>
            • <strong className="text-sky-300">5-Min Class Alerts:</strong> Julie notifies you 5 minutes before each lecture with room & faculty details.
          </p>
          <p>
            • <strong className="text-rose-400">Recovery focus:</strong> Attend all lectures in <em>Digital Marketing (30.77%)</em> and <em>MS-Excel (55.56%)</em> to reach 75%.
          </p>
        </div>

        <button
          onClick={() => onNavigateToTab('attendance')}
          className="w-full liquid-glass-button text-white font-semibold text-xs py-2.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-glass-button transition-all"
        >
          <span>View attendance recovery plan</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* TODAY / TOMORROW SCHEDULE CARD */}
      <div className="liquid-glass rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Schedule ({activeDayName})
            </h2>
          </div>

          {/* Today / Tomorrow Toggle Pills */}
          <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/10">
            <button
              onClick={() => setScheduleTab('today')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                scheduleTab === 'today'
                  ? 'bg-gradient-to-r from-julie-600 to-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setScheduleTab('tomorrow')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                scheduleTab === 'tomorrow'
                  ? 'bg-gradient-to-r from-julie-600 to-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tomorrow
            </button>
          </div>
        </div>

        {/* Classes List */}
        <div className="space-y-2 pt-1">
          {displayedClasses.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No scheduled lectures for this day.</p>
          ) : (
            displayedClasses.map(cls => (
              <div
                key={cls.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center font-mono font-bold text-xs">
                    {cls.start_time.slice(0, 5)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{cls.subject_name}</h3>
                    <p className="text-[10px] text-slate-400">
                      {cls.faculty_name} • Room {cls.room_number || '304'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-sky-400 border border-white/10">
                  {cls.subject_code}
                </span>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => onNavigateToTab('schedule')}
          className="w-full py-2 rounded-xl text-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
        >
          View Full Weekly Timetable &rarr;
        </button>
      </div>

      {/* Modals */}
      <UUERPModal
        isOpen={isUUERPModalOpen}
        onClose={() => setIsUUERPModalOpen(false)}
      />

      <VoicePersonaModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
};
