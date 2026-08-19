// =============================================================================
// PROJECT JULIE — FEMALE VOICE PERSONA SELECTOR MODAL
// Choose between 5 female executive voice styles with 1-tap live audio preview
// =============================================================================

import React, { useState } from 'react';
import { X, Volume2, Check, Sparkles, Mic, Play, Square } from 'lucide-react';
import {
  voiceService,
  FEMALE_VOICE_PERSONAS,
  type VoicePersona,
  type VoicePersonaId,
} from '@/services/voice/VoiceService';

interface VoicePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoicePersonaModal: React.FC<VoicePersonaModalProps> = ({ isOpen, onClose }) => {
  const [selectedId, setSelectedId] = useState<VoicePersonaId>(() => voiceService.getPersona().id);
  const [playingId, setPlayingId] = useState<VoicePersonaId | null>(null);

  if (!isOpen) return null;

  const handleSelect = (id: VoicePersonaId) => {
    setSelectedId(id);
    voiceService.setPersona(id);
  };

  const handlePlaySample = (persona: VoicePersona, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingId === persona.id) {
      voiceService.stopSpeaking();
      setPlayingId(null);
      return;
    }

    voiceService.setPersona(persona.id);
    setSelectedId(persona.id);
    setPlayingId(persona.id);

    voiceService.speak(persona.samplePhrase, () => {
      setPlayingId(null);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="liquid-glass-elevated rounded-[36px] w-full max-w-[400px] p-5 space-y-4 border border-white/15 bg-[#0a0b14]/95 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(124,58,237,0.3)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-julie-600 to-sky-400 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-[14px] bg-[#0a0b14] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Female Assistant Voices</h2>
              <p className="text-[10px] text-slate-400">Select your preferred voice persona</p>
            </div>
          </div>

          <button
            onClick={() => {
              voiceService.stopSpeaking();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Personas List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {FEMALE_VOICE_PERSONAS.map(persona => {
            const isSelected = selectedId === persona.id;
            const isPlaying = playingId === persona.id;

            return (
              <div
                key={persona.id}
                onClick={() => handleSelect(persona.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'liquid-glass border-julie-500/80 bg-julie-600/15 shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white">{persona.name}</h3>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-sky-300">
                        {persona.accent}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-medium">{persona.subtitle}</p>
                    <p className="text-[9px] text-slate-400 pt-0.5">{persona.description}</p>
                  </div>

                  {/* Play Voice Sample Button */}
                  <button
                    onClick={(e) => handlePlaySample(persona, e)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ml-2 ${
                      isPlaying
                        ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.7)]'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                    title={isPlaying ? "Stop audio preview" : "Listen to voice sample"}
                  >
                    {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-sky-400 mt-2 pt-1.5 border-t border-white/10">
                    <Check className="w-3 h-3" />
                    <span>Active Voice Persona</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save & Confirm Button */}
        <button
          onClick={() => {
            voiceService.stopSpeaking();
            onClose();
          }}
          className="w-full py-2.5 rounded-full liquid-glass-button text-white font-bold text-xs shadow-glass-button transition-all"
        >
          Done & Apply Voice
        </button>
      </div>
    </div>
  );
};
