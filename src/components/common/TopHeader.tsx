import React from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { JulieAuraOrb, type OrbState } from './JulieAuraOrb';

interface TopHeaderProps {
  onOpenMenu: () => void;
  onOpenVoice: () => void;
  orbState?: OrbState;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMenu,
  onOpenVoice,
  orbState = 'idle',
}) => {
  return (
    <header className="px-4 py-2.5 flex items-center justify-between border-b border-white/5 bg-[#050508]/80 backdrop-blur-2xl sticky top-0 z-30 select-none">
      {/* Left: Hamburger Button with Glass Rim */}
      <button
        onClick={onOpenMenu}
        className="w-9 h-9 rounded-2xl liquid-pill flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all shadow-sm"
        aria-label="Open Navigation Menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Center: Brand Identity & Subtitle */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5">
          <h1 className="text-sm font-extrabold text-white tracking-tight">Julie</h1>
          <span className="w-3.5 h-3.5 rounded-full bg-julie-600/30 text-sky-400 border border-sky-400/40 flex items-center justify-center text-[9px] font-bold">
            ✓
          </span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">Your personal AI assistant</p>
      </div>

      {/* Right: Mini Glowing Aura Orb Button */}
      <button
        onClick={onOpenVoice}
        className="p-1 rounded-2xl hover:bg-white/5 transition-all active:scale-90"
        title="Tap to activate voice assistant"
      >
        <JulieAuraOrb state={orbState} size="sm" />
      </button>
    </header>
  );
};
