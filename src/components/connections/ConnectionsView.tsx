// =============================================================================
// PROJECT JULIE — CONNECTIONS SCREEN
// Matches Screen 7 from user reference image with Uttaranchal University Cyborg-ERP,
// Google Calendar, Google Drive, Weather Service, and connected OAuth services.
// =============================================================================

import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Calendar,
  HardDrive,
  CloudSun,
  Music,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { UUERPModal } from '@/components/integrations/UUERPModal';
import { UEUERPSessionManager } from '@/services/integrations/uu-erp';

interface ConnectionsViewProps {
  onBack?: () => void;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({ onBack }) => {
  const [isUUERPModalOpen, setIsUUERPModalOpen] = useState(false);
  const [erpState, setErpState] = useState(() => UEUERPSessionManager.getState());

  React.useEffect(() => {
    return UEUERPSessionManager.subscribe((s) => setErpState(s));
  }, []);

  const isUUConnected = erpState === 'CONNECTED';
  const uuerpBadge =
    erpState === 'CONNECTED'
      ? '● Connected'
      : erpState === 'SESSION_EXPIRED'
      ? '⚠️ Expired'
      : erpState === 'SYNCING'
      ? '⟳ Syncing'
      : 'Action Required';

  const [connections, setConnections] = useState([
    {
      id: 'uu_erp',
      name: 'Uttaranchal University Cyborg-ERP',
      subtitle: 'https://uuerp.uudoon.in/Account/Cyborg_StudentMenu',
      icon: GraduationCap,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      connected: isUUConnected,
      badge: uuerpBadge,
      isUUERP: true,
    },
    {
      id: 'gcal',
      name: 'Google Calendar',
      subtitle: 'Events & timetable sync',
      icon: Calendar,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      connected: true,
    },
    {
      id: 'gdrive',
      name: 'Google Drive',
      subtitle: 'Lecture slides & assignments',
      icon: HardDrive,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      connected: true,
    },
    {
      id: 'weather',
      name: 'Weather Service',
      subtitle: 'Local forecasts (Dehradun)',
      icon: CloudSun,
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      connected: true,
    },
    {
      id: 'notion',
      name: 'Notion',
      subtitle: 'Notes & project roadmaps',
      icon: FileCode,
      color: 'bg-white/10 text-white border-white/20',
      connected: false,
    },
    {
      id: 'spotify',
      name: 'Spotify',
      subtitle: 'Focus music & lo-fi beats',
      icon: Music,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      connected: false,
    },
  ]);

  const handleCardClick = (item: any) => {
    if (item.isUUERP) {
      setIsUUERPModalOpen(true);
    } else {
      setConnections(prev =>
        prev.map(c => (c.id === item.id ? { ...c, connected: !c.connected } : c))
      );
    }
  };

  return (
    <div className="space-y-4 pb-24 px-4 pt-2 text-white">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-2xl ios-glass text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Connections</h1>
            <p className="text-[11px] text-slate-400">Give Julie access to the services you use</p>
          </div>
        </div>

        <button
          onClick={() => setIsUUERPModalOpen(true)}
          className="p-2 rounded-2xl ios-glass text-slate-400 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Connections List */}
      <div className="space-y-2.5 pt-1">
        {connections.map(item => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className={`ios-glass-card rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-julie-500/40 transition-all cursor-pointer ${
                item.isUUERP ? 'border-blue-500/30 bg-gradient-to-r from-blue-900/10 to-transparent' : ''
              }`}
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className={`w-10 h-10 rounded-xl ${item.color} border flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-white leading-tight truncate">{item.name}</h3>
                    {(item.isUUERP ? uuerpBadge : item.badge) && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                        {item.isUUERP ? uuerpBadge : item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">{item.subtitle}</p>
                </div>
              </div>

              <div className="shrink-0">
                {(item.isUUERP ? isUUConnected : item.connected) ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Connected</span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(item);
                    }}
                    className="px-3.5 py-1.5 rounded-full ios-glass text-xs font-semibold text-white hover:bg-white/10 active:scale-95 transition-all border border-white/10"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Assurance Footer Note */}
      <div className="pt-4 flex items-start gap-2.5 px-2 text-slate-400 text-xs leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-[11px]">
          Julie syncs directly with Uttaranchal University Cyborg-ERP and connected services to give you proactive schedule and attendance management.
        </p>
      </div>

      {/* UU-ERP Connection Modal */}
      <UUERPModal
        isOpen={isUUERPModalOpen}
        onClose={() => setIsUUERPModalOpen(false)}
      />
    </div>
  );
};
