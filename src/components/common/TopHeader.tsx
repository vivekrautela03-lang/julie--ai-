// =============================================================================
// PROJECT JULIE — TOP HEADER WITH CONTEXTUAL BACK ARROW & MENU
// Shows Back Arrow on all subpages and Hamburger Menu when in Chat
// =============================================================================

import React from 'react';
import { ArrowLeft, Menu, Key } from 'lucide-react';
import { JulieAuraOrb, type OrbState } from './JulieAuraOrb';

interface TopHeaderProps {
  activeTab: string;
  onBackToChat: () => void;
  onOpenMenu: () => void;
  onOpenVoice: () => void;
  onOpenApiKey?: () => void;
  orbState?: OrbState;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onBackToChat,
  onOpenMenu,
  onOpenVoice,
  onOpenApiKey,
  orbState = 'idle',
}) => {
  const isChat = activeTab === 'chat';

  return (
    <header className="px-4 py-2.5 flex items-center justify-between border-b border-white/5 bg-[#050508]/80 backdrop-blur-2xl sticky top-0 z-30 select-none">
      {/* Left: Contextual Back Arrow or Menu Pill */}
      <div className="flex items-center gap-2">
        {!isChat ? (
          <button
            onClick={onBackToChat}
            className="p-2 rounded-2xl liquid-pill text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold"
            title="Return to Chat"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Back</span>
          </button>
        ) : (
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-2xl liquid-pill text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Open Menu"
          >
            <Menu className="w-4 h-4 text-slate-300" />
          </button>
        )}

        {/* Brand Identity & Verified Badge */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-julie-600 to-sky-400 p-0.5 shadow-[0_0_12px_rgba(124,58,237,0.5)] overflow-hidden">
            <img
              src="/julie-icon.jpg"
              alt="Julie AI"
              className="w-full h-full rounded-[10px] object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <h1 className="text-xs font-black text-white tracking-tight">Julie</h1>
              <span className="w-3 h-3 rounded-full bg-julie-600/30 text-sky-400 border border-sky-400/40 flex items-center justify-center text-[7px] font-bold">
                ✓
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium">
              {isChat ? 'AI Operating Layer' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Right: API Key Setup & Mini Glowing Aura Orb Voice Trigger */}
      <div className="flex items-center gap-1.5">
        {onOpenApiKey && (
          <button
            onClick={onOpenApiKey}
            className="p-1.5 px-2 rounded-xl liquid-glass border border-sky-400/30 hover:border-sky-400 text-sky-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
            title="Setup Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xs:inline">API Key</span>
          </button>
        )}

        <button
          onClick={onOpenVoice}
          className="p-1 rounded-2xl hover:bg-white/5 transition-all active:scale-90"
          title="Tap to speak with Julie"
        >
          <JulieAuraOrb state={orbState} size="sm" />
        </button>
      </div>
    </header>
  );
};
