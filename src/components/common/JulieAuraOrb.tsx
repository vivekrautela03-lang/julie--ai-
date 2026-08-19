// =============================================================================
// PROJECT JULIE — FACELESS AURA ORB (SIGNATURE LIQUID PRESENCE)
// Fluid multi-layered plasma energy rings, electric blue & cosmic purple trails.
// STRICTLY NO FACE / NO HUMANOID AVATAR.
// =============================================================================

import React from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing' | 'complete' | 'error';
export type OrbSize = 'sm' | 'md' | 'lg' | 'xl';

interface JulieAuraOrbProps {
  state?: OrbState;
  size?: OrbSize;
  onClick?: () => void;
  className?: string;
}

export const JulieAuraOrb: React.FC<JulieAuraOrbProps> = ({
  state = 'idle',
  size = 'md',
  onClick,
  className = '',
}) => {
  const sizeMap = {
    sm: { container: 'w-9 h-9', inner: 'w-4.5 h-4.5', glow: 'blur-md', stroke: 1.5 },
    md: { container: 'w-14 h-14', inner: 'w-7 h-7', glow: 'blur-lg', stroke: 2 },
    lg: { container: 'w-28 h-28', inner: 'w-14 h-14', glow: 'blur-xl', stroke: 3 },
    xl: { container: 'w-64 h-64 sm:w-76 sm:h-76', inner: 'w-32 h-32 sm:w-38 sm:h-38', glow: 'blur-2xl', stroke: 4 },
  };

  const currentSize = sizeMap[size];

  const getStateDetails = () => {
    switch (state) {
      case 'listening':
        return {
          glowColor: 'from-cyan-400 via-sky-500 to-purple-600',
          pulseSpeed: 'animate-pulse duration-500 scale-105',
          rotateSpeed: 'animate-spin duration-3000',
          shadow: '0 0 60px rgba(56, 189, 248, 0.7), 0 0 100px rgba(139, 92, 246, 0.5)',
          coreRing: 'border-cyan-400/80',
        };
      case 'thinking':
        return {
          glowColor: 'from-purple-600 via-indigo-500 to-cyan-300',
          pulseSpeed: 'animate-pulse duration-700',
          rotateSpeed: 'animate-spin duration-1500',
          shadow: '0 0 50px rgba(124, 58, 237, 0.7), 0 0 80px rgba(56, 189, 248, 0.45)',
          coreRing: 'border-purple-400/80',
        };
      case 'speaking':
        return {
          glowColor: 'from-indigo-500 via-purple-500 to-sky-400',
          pulseSpeed: 'animate-orb-breathe',
          rotateSpeed: 'animate-orb-plasma',
          shadow: '0 0 70px rgba(139, 92, 246, 0.8), 0 0 120px rgba(56, 189, 248, 0.6)',
          coreRing: 'border-sky-300/90',
        };
      case 'executing':
        return {
          glowColor: 'from-emerald-400 via-cyan-500 to-purple-600',
          pulseSpeed: 'scale-110',
          rotateSpeed: 'animate-spin duration-1000',
          shadow: '0 0 60px rgba(16, 185, 129, 0.6), 0 0 90px rgba(56, 189, 248, 0.5)',
          coreRing: 'border-emerald-400/80',
        };
      case 'error':
        return {
          glowColor: 'from-rose-500 via-purple-600 to-amber-500',
          pulseSpeed: 'animate-pulse duration-300',
          rotateSpeed: '',
          shadow: '0 0 50px rgba(244, 63, 94, 0.7)',
          coreRing: 'border-rose-400/80',
        };
      case 'idle':
      default:
        return {
          glowColor: 'from-purple-600 via-julie-500 to-sky-400',
          pulseSpeed: 'animate-orb-breathe',
          rotateSpeed: 'animate-orb-plasma',
          shadow: '0 0 40px rgba(139, 92, 246, 0.45), 0 0 70px rgba(56, 189, 248, 0.25)',
          coreRing: 'border-white/20',
        };
    }
  };

  const details = getStateDetails();

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none ${currentSize.container} ${className}`}
      title={`Julie Presence (${state})`}
    >
      {/* 1. Outermost Volumetric Atmospheric Plasma Cloud */}
      <div
        style={{ boxShadow: details.shadow }}
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${details.glowColor} opacity-70 ${currentSize.glow} ${details.pulseSpeed} transition-all duration-700`}
      />

      {/* 2. Primary Rotating Fluid Plasma Ring */}
      <div
        className={`absolute inset-0.5 rounded-full p-[2px] bg-gradient-to-r from-sky-400 via-purple-500 to-cyan-300 opacity-90 ${details.rotateSpeed}`}
      >
        <div className="w-full h-full rounded-full bg-[#050508]/85 backdrop-blur-md" />
      </div>

      {/* 3. Secondary Counter-Rotating Energy Trail */}
      <div
        className={`absolute inset-2 rounded-full p-[1.5px] bg-gradient-to-bl from-purple-400 via-transparent to-sky-300 opacity-75 animate-spin-reverse`}
      >
        <div className="w-full h-full rounded-full bg-[#050508]/90" />
      </div>

      {/* 4. Central Deep Consciousness Sphere */}
      <div
        className={`relative ${currentSize.inner} rounded-full bg-gradient-to-b from-[#0F1122] to-[#050508] border ${details.coreRing} flex items-center justify-center shadow-inner overflow-hidden backdrop-blur-xl transition-all duration-500`}
      >
        {/* Core Electric Pulsar Light */}
        <div
          className={`w-1/2 h-1/2 rounded-full bg-gradient-to-r from-sky-400 via-purple-400 to-cyan-300 blur-[2px] ${details.pulseSpeed} opacity-90`}
        />
      </div>
    </div>
  );
};
