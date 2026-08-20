// =============================================================================
// PROJECT JULIE — SETTINGS VIEW (LIQUID GLASS THEME)
// Personality, female voice personas, proactivity, Firebase & Theme Switcher.
// =============================================================================

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
} from 'lucide-react';
import { ConnectedAppsModal } from '@/components/integrations/ConnectedAppsModal';
import { FirebaseAuthModal } from '@/components/auth/FirebaseAuthModal';
import { VoicePersonaModal } from '@/components/settings/VoicePersonaModal';
import { UUERPModal } from '@/components/integrations/UUERPModal';
import { voiceService } from '@/services/voice/VoiceService';

interface SettingsViewProps {
  onBack?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const [isConnectedAppsOpen, setIsConnectedAppsOpen] = useState(false);
  const [isFirebaseAuthOpen, setIsFirebaseAuthOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isUUERPOpen, setIsUUERPOpen] = useState(false);

  const currentTheme = (localStorage.getItem('julie_theme') as 'dark' | 'light') || 'dark';
  const activeVoice = voiceService.getPersona();

  const settingsItems = [
    { id: 'uuerp', label: 'Uttaranchal University Cyborg-ERP', icon: Grid, badge: '● Connected' },
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
    if (id === 'uuerp') {
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
    </div>
  );
};
