import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Bell,
  Mic,
  Grid,
  Shield,
  Moon,
  Sun,
  Info,
  ChevronRight,
  Sparkles,
  Key,
  GraduationCap,
  RefreshCw,
  ExternalLink,
  Zap,
  Clipboard,
} from 'lucide-react';
import { ConnectedAppsModal } from '@/components/integrations/ConnectedAppsModal';
import { FirebaseAuthModal } from '@/components/auth/FirebaseAuthModal';
import { VoicePersonaModal } from '@/components/settings/VoicePersonaModal';
import { UUERPModal } from '@/components/integrations/UUERPModal';
import { ApiKeyModal } from '@/components/auth/ApiKeyModal';
import { voiceService } from '@/services/voice/VoiceService';
import {
  UEUERPSessionManager,
  UUERPBrowserSession,
  UUERPSyncEngine,
  ERPIncrementalSyncEngine,
} from '@/services/integrations/uu-erp';

interface SettingsViewProps {
  onBack?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const [isConnectedAppsOpen, setIsConnectedAppsOpen] = useState(false);
  const [isFirebaseAuthOpen, setIsFirebaseAuthOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isUUERPOpen, setIsUUERPOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [erpState, setErpState] = useState(() => UEUERPSessionManager.getState());
  const [isDirectSyncing, setIsDirectSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);

  React.useEffect(() => {
    return UEUERPSessionManager.subscribe((s) => setErpState(s));
  }, []);

  const currentTheme = (localStorage.getItem('julie_theme') as 'dark' | 'light') || 'dark';
  const activeVoice = voiceService.getPersona();

  const handleDirectRealERPSync = async () => {
    setIsDirectSyncing(true);
    setSyncStatusText('Opening official UU-ERP portal (https://uuerp.uudoon.in)...');
    try {
      // 1. Open real login window (Electron native window or popup)
      const loginRes = await UUERPBrowserSession.openLoginWindow();
      if (loginRes.success) {
        setSyncStatusText('Authenticated! Collecting all real student records & syncing...');
        
        // 2. Fetch and synchronize all entities (using extracted HTML if available)
        const erpSync = await UUERPSyncEngine.sync(loginRes.html);
        const autoSync = await ERPIncrementalSyncEngine.syncAllEntities('default', true);

        if (erpSync.syncedSubjectsCount > 0) {
          setSyncStatusText(`✅ Synced! ${erpSync.syncedSubjectsCount} subjects & ${autoSync.totalSyncedRecords} ERP records collected.`);
        } else {
          setSyncStatusText(erpSync.message || 'ERP window authenticated. Use Paste Sync if table is not auto-loaded.');
        }
        setTimeout(() => setSyncStatusText(null), 6000);
      } else {
        setSyncStatusText(`Note: ${loginRes.error || 'Authentication canceled'}`);
        setTimeout(() => setSyncStatusText(null), 5000);
      }
    } catch (err: any) {
      setSyncStatusText(`Sync error: ${err.message}`);
    } finally {
      setIsDirectSyncing(false);
    }
  };

  const handleClipboardSync = async () => {
    setIsDirectSyncing(true);
    setSyncStatusText('Reading attendance data from clipboard...');
    try {
      if (!navigator.clipboard?.readText) {
        setIsUUERPOpen(true);
        setSyncStatusText('Clipboard read not supported. Opened sync modal to paste directly.');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || text.trim().length === 0) {
        setSyncStatusText('Clipboard is empty. Copy the table from UU-ERP attendance page first.');
        setTimeout(() => setSyncStatusText(null), 4000);
        return;
      }
      const result = await UUERPSyncEngine.syncFromRawContent(text);
      if (result.success && result.syncedSubjectsCount > 0) {
        setSyncStatusText(`✅ Synced ${result.syncedSubjectsCount} subjects from clipboard!`);
      } else {
        setSyncStatusText(result.message || 'Could not parse attendance table from clipboard.');
      }
      setTimeout(() => setSyncStatusText(null), 6000);
    } catch (err: any) {
      setSyncStatusText(`Clipboard error: ${err.message}. Open Control Center to paste manually.`);
    } finally {
      setIsDirectSyncing(false);
    }
  };

  const erpBadge =
    erpState === 'CONNECTED'
      ? '● Connected'
      : erpState === 'SESSION_EXPIRED'
      ? '⚠️ Expired'
      : erpState === 'SYNCING'
      ? '⟳ Syncing'
      : 'Not Connected';

  const settingsItems = [
    { id: 'api_key', label: 'Google Gemini API Key (Neural Core)', icon: Key, badge: '● Gemini 2.5' },
    { id: 'uuerp', label: 'Uttaranchal University Cyborg-ERP', icon: Grid, badge: erpBadge },
    { id: 'assistant', label: `Assistant Voice (${activeVoice.name.split(' ')[0]})`, icon: Sparkles, badge: activeVoice.accent },
    { id: 'voice', label: 'Voice & Speech Engine Options', icon: Mic, badge: '5 Personas' },
    { id: 'firebase_auth', label: 'Firebase Account & Project (julie-7a188)', icon: Shield, badge: 'Firebase' },
    { id: 'apps', label: 'Connected Third-Party Integrations', icon: Grid, badge: '4 Active' },
    { id: 'appearance', label: `Theme (${currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode'})`, icon: currentTheme === 'dark' ? Moon : Sun, badge: currentTheme === 'dark' ? '🌙 Dark' : '☀️ Light' },
    { id: 'notifications', label: 'Notifications & 5-Min Class Alerts', icon: Bell, badge: 'Active' },
    { id: 'privacy', label: 'Privacy & Supabase Data Vault', icon: Shield },
    { id: 'about', label: 'About Julie AI', icon: Info },
  ];

  const handleItemClick = (id: string) => {
    if (id === 'api_key') {
      setIsApiKeyModalOpen(true);
    } else if (id === 'uuerp') {
      setIsUUERPOpen(true);
    } else if (id === 'assistant' || id === 'voice') {
      setIsVoiceModalOpen(true);
    } else if (id === 'firebase_auth' || id === 'notifications') {
      setIsFirebaseAuthOpen(true);
    } else if (id === 'apps' || id === 'privacy') {
      setIsConnectedAppsOpen(true);
    } else if (id === 'appearance') {
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('julie_theme', newTheme);
      window.location.reload();
    } else if (id === 'about') {
      alert('Julie AI v2.0 - Universal Personal AI Assistant\nConnected to Gemini API (All-Domain Knowledge), Uttaranchal University Cyborg-ERP, Firebase julie-7a188 & Supabase');
    }
  };

  return (
    <div className="space-y-4 pb-24 px-3.5 pt-2 text-white select-none">
      {/* Top Header */}
      <div className="flex items-center gap-3 py-1">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-2xl liquid-pill text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-[11px] text-slate-400">Configure your personal assistant</p>
        </div>
      </div>

      {/* Hero 1-Tap Real UU-ERP Sync Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-900/40 via-blue-950/30 to-indigo-950/40 border border-blue-500/30 shadow-2xl relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white">UU-ERP Live Connection</h2>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  erpState === 'CONNECTED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : erpState === 'SESSION_EXPIRED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-white/10'
                }`}>
                  {erpBadge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Uttaranchal University Cyborg Portal (https://uuerp.uudoon.in)</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Tap below to open the real university login page, solve CAPTCHA, and automatically collect your live attendance, timetable, and subjects into Julie.
        </p>

        {syncStatusText && (
          <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs font-medium flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isDirectSyncing ? 'animate-spin' : ''}`} />
            <span>{syncStatusText}</span>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDirectRealERPSync}
              disabled={isDirectSyncing}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.35)] active:scale-95 transition-all disabled:opacity-50"
            >
              {isDirectSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing Live ERP Data...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Open Real ERP & Auto-Sync</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsUUERPOpen(true)}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white flex items-center justify-center transition-all"
              title="Open Full Control Center"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleClipboardSync}
            disabled={isDirectSyncing}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Clipboard className="w-3.5 h-3.5 text-sky-400" />
            <span>📋 Paste Copied Attendance Table &amp; Instant Sync</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation List */}
      <div className="liquid-glass rounded-3xl divide-y divide-white/5 overflow-hidden shadow-xl">
        {settingsItems.map(item => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-200">{item.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Modals */}
      <UUERPModal
        isOpen={isUUERPOpen}
        onClose={() => setIsUUERPOpen(false)}
      />
      <VoicePersonaModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
      <ConnectedAppsModal
        isOpen={isConnectedAppsOpen}
        onClose={() => setIsConnectedAppsOpen(false)}
      />
      <FirebaseAuthModal
        isOpen={isFirebaseAuthOpen}
        onClose={() => setIsFirebaseAuthOpen(false)}
      />
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
};
