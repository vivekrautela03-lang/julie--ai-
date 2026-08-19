// =============================================================================
// PROJECT JULIE — PROFILE VIEW
// User account, college details, and assistant customization.
// =============================================================================

import React from 'react';
import { ArrowLeft, Shield, Mail, GraduationCap, Sparkles, UserCheck } from 'lucide-react';

interface ProfileViewProps {
  onBack?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  return (
    <div className="space-y-4 pb-24 px-4 pt-2 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 py-1">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-2xl ios-glass text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h1 className="text-xl font-bold text-white tracking-tight">Profile</h1>
      </div>

      {/* User Card */}
      <div className="ios-glass-card rounded-3xl p-5 flex items-center gap-4 border border-julie-500/30">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-julie-600 to-julie-electric p-0.5 shadow-[0_0_25px_rgba(124,58,237,0.5)]">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="Vivek"
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-1.5">
            Vivek <span className="text-xs text-julie-electric font-semibold">● Boss Mode</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> Uttaranchal University
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Roll: 21BCE1042</p>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="space-y-2.5">
        <div className="ios-glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Email Address</p>
              <p className="text-[10px] text-slate-400">boss@example.com</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
            Verified
          </span>
        </div>

        <div className="ios-glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
              <Sparkles className="w-4 h-4 text-julie-electric" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Julie AI Presence</p>
              <p className="text-[10px] text-slate-400">Boss Lady Persona • Active</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-julie-500/20 text-julie-electric">
            Active
          </span>
        </div>
      </div>
    </div>
  );
};
