// =============================================================================
// PROJECT JULIE — TOP HEADER
// Ultra-clean brand header with verified badge and interactive Aura Presence Orb
// =============================================================================

import React from 'react';
import { JulieAuraOrb, type OrbState } from './JulieAuraOrb';

interface TopHeaderProps {
  onOpenVoice: () => void;
  orbState?: OrbState;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenVoice,
  orbState = 'idle',
}) => {
  return (
    <header className="px-5 py-3 flex items-center justify-between border-b border-white/5 bg-[#050508]/75 backdrop-blur-2xl sticky top-0 z-30 select-none">
      {/* Brand Identity & Verified Badge */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-julie-600 to-sky-400 p-0.5 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
          <div className="w-full h-full rounded-[14px] bg-[#050508] flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-julie-500 to-sky-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <h1 className="text-sm font-black text-white tracking-tight">Julie</h1>
            <span className="w-3.5 h-3.5 rounded-full bg-julie-600/30 text-sky-400 border border-sky-400/40 flex items-center justify-center text-[8px] font-bold">
              ✓
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Personal AI Assistant</p>
        </div>
      </div>

      {/* Right: Mini Glowing Aura Orb Voice Trigger */}
      <button
        onClick={onOpenVoice}
        className="p-1 rounded-2xl hover:bg-white/5 transition-all active:scale-90"
        title="Tap to speak with Julie"
      >
        <JulieAuraOrb state={orbState} size="sm" />
      </button>
    </header>
  );
};
