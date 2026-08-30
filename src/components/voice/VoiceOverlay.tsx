// =============================================================================
// PROJECT JULIE — FULLSCREEN CONTINUOUS VOICE AGENT ("Hey Julie")
// Real-time microphone audio spectrum + Live speech-to-text + Gemini AI conversational loop.
// =============================================================================

import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  Send,
  Radio,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { JulieAuraOrb, type OrbState } from '@/components/common/JulieAuraOrb';
import { voiceService, type VoiceState } from '@/services/voice/VoiceService';
import { AIService } from '@/services/ai/AIService';
import { wakeWordEngine } from '@/services/voice/WakeWordEngine';

interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({ isOpen, onClose }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>(voiceService.getState());
  const [orbState, setOrbState] = useState<OrbState>('listening');
  const [statusSubtitle, setStatusSubtitle] = useState("Listening for your voice...");
  const [liveTranscript, setLiveTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ sender: 'user' | 'julie'; text: string; time: string }>
  >([]);
  const [manualQuery, setManualQuery] = useState('');
  const isProcessingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sampleVoicePrompts = [
    "What's my attendance status?",
    "What classes do I have today?",
    "How to recover Digital Marketing attendance?",
    "Summarize my tasks for today",
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, liveTranscript, orbState]);

  const processQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setLiveTranscript('');
    setOrbState('thinking');
    setStatusSubtitle('Thinking with Gemini AI...');

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setConversationHistory(prev => [...prev, { sender: 'user', text, time: nowTime }]);

    try {
      const response = await AIService.processMessage(text, 'Voice');
      
      const julieTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setConversationHistory(prev => [...prev, { sender: 'julie', text: response.message, time: julieTime }]);

      setOrbState('speaking');
      setStatusSubtitle('Julie is speaking...');

      voiceService.speak(response.message, () => {
        isProcessingRef.current = false;
        setOrbState('listening');
        setStatusSubtitle('Listening... Speak again anytime');
        voiceService.startListening();
      });
    } catch (err) {
      console.error('[Julie Voice] Query processing error:', err);
      isProcessingRef.current = false;
      setOrbState('error');
      setStatusSubtitle('Resuming listening...');
      setTimeout(() => {
        setOrbState('listening');
        setStatusSubtitle('Listening for your voice...');
        voiceService.startListening();
      }, 1200);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    wakeWordEngine.stop();
    setLiveTranscript('');
    setConversationHistory([]);
    setOrbState('listening');
    setStatusSubtitle('Listening for your voice...');
    isProcessingRef.current = false;

    // Start live microphone capture & permissions
    voiceService.startListening();

    const unsub = voiceService.subscribe(async state => {
      setVoiceState(state);

      if (state.interimTranscript || state.transcript) {
        setLiveTranscript(state.interimTranscript || state.transcript);
      }

      if (state.isSpeaking) {
        setOrbState('speaking');
        setStatusSubtitle('Julie is speaking...');
      } else if (state.isListening && !isProcessingRef.current) {
        setOrbState('listening');
        setStatusSubtitle('Listening for your voice...');
      }

      if (
        state.transcript &&
        !state.isListening &&
        !state.isSpeaking &&
        !isProcessingRef.current
      ) {
        const text = state.transcript.trim();
        state.transcript = '';
        state.interimTranscript = '';
        if (text) {
          processQuery(text);
        }
      }
    });

    return () => {
      unsub();
      voiceService.stopListening();
      voiceService.stopSpeaking();
      wakeWordEngine.start();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMic = () => {
    if (voiceState.isListening) {
      voiceService.stopListening();
      setOrbState('idle');
      setStatusSubtitle('Mic paused. Tap orb to speak');
    } else {
      setLiveTranscript('');
      isProcessingRef.current = false;
      voiceService.startListening();
      setOrbState('listening');
      setStatusSubtitle('Listening for your voice...');
    }
  };

  const handleStop = () => {
    voiceService.stopListening();
    voiceService.stopSpeaking();
    onClose();
  };

  const visualizerBars = [0.4, 0.7, 1.0, 0.6, 1.2, 0.9, 1.4, 0.8, 1.1, 0.5, 0.8, 0.3];

  return (
    <div className="fixed inset-0 z-50 bg-[#050508]/95 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-6 animate-fade-in text-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="text-center pt-1 space-y-1 shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass text-[10px] font-bold text-sky-400 border border-sky-400/30 mb-0.5">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Continuous Voice Mode • Live Mic Active</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Hey Julie</h1>
        <p className="text-xs font-semibold text-sky-400 transition-all duration-300">
          {statusSubtitle}
        </p>
      </div>

      {/* Central Radiant Faceless Aura Orb & Live Conversation Display */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-2 space-y-3 max-w-sm mx-auto w-full overflow-y-auto">
        <JulieAuraOrb state={orbState} size="lg" onClick={handleToggleMic} />

        {/* Live Mic Audio Level Meter */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full liquid-glass border border-white/10 text-[10px] text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Mic Level:</span>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.max(10, voiceState.audioLevel * 100))}%` }}
              className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-julie-electric transition-all duration-75"
            />
          </div>
        </div>

        {/* Live Real-Time Voice-to-Text Transcription Banner */}
        {liveTranscript && !isProcessingRef.current && (
          <div className="liquid-glass rounded-3xl p-3.5 text-center text-xs text-slate-200 border border-sky-400/40 animate-fade-in w-full shadow-2xl">
            <span className="text-sky-400 font-bold block text-[10px] uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Hearing your voice:
            </span>
            <p className="font-semibold text-white text-sm">"{liveTranscript}"</p>
          </div>
        )}

        {/* Permission Prompt or Mobile HTTP Guidance */}
        {!voiceState.hasMicPermission && voiceState.error && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col gap-2 max-w-xs text-left animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold">{voiceState.error}</span>
            </div>
            {typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
              <a
                href={`https://${window.location.hostname}:5173`}
                className="px-2.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[11px] text-center active:scale-95 transition-all shadow-md"
              >
                🔒 Tap Here: Switch to HTTPS (Enables Mobile Mic)
              </a>
            )}
          </div>
        )}

        {/* Conversation Stream */}
        {conversationHistory.length > 0 && (
          <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-1">
            {conversationHistory.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl text-xs leading-relaxed animate-fade-in ${
                  item.sender === 'user'
                    ? 'liquid-glass-button text-white ml-auto max-w-[85%] rounded-tr-none'
                    : 'liquid-glass text-slate-200 mr-auto max-w-[90%] rounded-tl-none border border-sky-400/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[9px] opacity-75 mb-1 font-bold">
                  <span>{item.sender === 'user' ? 'You' : 'Julie (Boss Lady AI)'}</span>
                  <span>{item.time}</span>
                </div>
                <p className="whitespace-pre-wrap font-medium">{item.text}</p>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}

        {/* Quick Sample Voice Prompts & Mobile Voice Tester */}
        {conversationHistory.length === 0 && !liveTranscript && (
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {sampleVoicePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    voiceService.unlockMobileAudio();
                    processQuery(prompt);
                  }}
                  className="px-3 py-1 rounded-full liquid-pill text-[10px] font-medium text-slate-300 hover:text-white hover:border-sky-400/40 active:scale-95 transition-all"
                >
                  💬 {prompt}
                </button>
              ))}
            </div>

            {/* Mobile Voice Speaker Test Button */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => voiceService.testMobileVoice()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[10px] font-bold active:scale-95 transition-all"
                title="Tap to test speaker on your phone"
              >
                <Volume2 className="w-3 h-3 text-sky-400" />
                <span>🔊 Test Mobile Voice</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Real-Time Microphone Waveform */}
      <div className="flex items-center justify-center gap-1.5 h-8 shrink-0 my-1">
        {visualizerBars.map((multiplier, i) => {
          const liveHeight = voiceState.isListening
            ? Math.max(6, Math.min(32, 6 + voiceState.audioLevel * 35 * multiplier))
            : voiceState.isSpeaking
            ? Math.max(8, ((i % 3) + 1) * 8)
            : 4;

          return (
            <div
              key={i}
              style={{ height: `${liveHeight}px` }}
              className={`w-1 rounded-full bg-gradient-to-t from-julie-600 via-sky-400 to-cyan-300 transition-all duration-150 ${
                voiceState.isListening || voiceState.isSpeaking ? 'opacity-100' : 'opacity-30'
              }`}
            />
          );
        })}
      </div>

      {/* Manual Input Fallback & Action Controls */}
      <div className="space-y-2 pt-1 pb-1 shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (manualQuery.trim()) {
              const q = manualQuery;
              setManualQuery('');
              processQuery(q);
            }
          }}
          className="liquid-glass rounded-full border border-white/15 p-1 pl-3.5 flex items-center gap-2"
        >
          <input
            type="text"
            value={manualQuery}
            onChange={e => setManualQuery(e.target.value)}
            placeholder="Type or speak to Julie..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-8 h-8 rounded-full liquid-glass-button text-white flex items-center justify-center active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center justify-between">
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-slate-300 hover:text-white active:scale-95 transition-all text-xs font-medium"
          >
            <X className="w-4 h-4" />
            <span>End Voice</span>
          </button>

          <button
            onClick={handleToggleMic}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              voiceState.isListening
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 shadow-[0_0_30px_rgba(244,63,94,0.6)]'
                : 'liquid-glass-button shadow-glass-button'
            }`}
            title={voiceState.isListening ? 'Tap to pause mic' : 'Tap to speak'}
          >
            {voiceState.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
