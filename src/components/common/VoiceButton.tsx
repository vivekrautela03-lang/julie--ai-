import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { voiceService, type VoiceState } from '@/services/voice/VoiceService';

interface VoiceButtonProps {
  onTranscriptReady?: (transcript: string) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ onTranscriptReady }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>(voiceService.getState());

  useEffect(() => {
    const unsub = voiceService.subscribe(state => {
      setVoiceState(state);
      if (state.transcript && !state.isListening && onTranscriptReady) {
        onTranscriptReady(state.transcript);
      }
    });
    return unsub;
  }, [onTranscriptReady]);

  const handleToggle = () => {
    if (voiceState.isListening) {
      voiceService.stopListening();
    } else {
      voiceService.startListening();
    }
  };

  return (
    <button
      onClick={handleToggle}
      type="button"
      className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
        voiceState.isListening
          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse scale-105'
          : voiceState.isSpeaking
          ? 'bg-brand-500 text-slate-950 shadow-lg shadow-brand-500/40 animate-bounce'
          : 'bg-gradient-to-tr from-brand-600 to-brand-400 text-slate-950 hover:shadow-brand-subtle hover:scale-105 active:scale-95'
      }`}
      title={voiceState.isListening ? 'Listening... Tap to stop' : 'Tap to speak to Julie'}
    >
      {voiceState.isListening ? (
        <Mic className="w-5 h-5 animate-pulse" />
      ) : voiceState.isSpeaking ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
};
