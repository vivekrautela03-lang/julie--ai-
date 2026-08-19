// =============================================================================
// PROJECT JULIE — ROBUST HIGH-FIDELITY VOICE ENGINE (STT & TTS)
// Web Audio API live mic stream analyzer + Resilient Web Speech Recognition + Natural TTS
// Handles transient speech events silently with auto-reconnection and zero false errors.
// =============================================================================

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  audioLevel: number; // 0.0 to 1.0 live mic volume
  hasMicPermission: boolean;
  error?: string;
}

export type VoiceStateListener = (state: VoiceState) => void;

export class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private listeners: Set<VoiceStateListener> = new Set();
  private availableVoices: SpeechSynthesisVoice[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private silenceTimer: any = null;
  private resumeTimer: any = null;
  private isRecognitionRunning: boolean = false;
  private shouldKeepListening: boolean = false;
  
  private state: VoiceState = {
    isListening: false,
    isSpeaking: false,
    transcript: '',
    interimTranscript: '',
    audioLevel: 0,
    hasMicPermission: true,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        this.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
      }

      this.initRecognition();
    }
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isRecognitionRunning = true;
          this.updateState({ isListening: true, error: undefined, hasMicPermission: true });
        };

        this.recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              final += res[0].transcript;
            } else {
              interim += res[0].transcript;
            }
          }

          const combined = (final || interim).trim();
          if (combined) {
            this.updateState({
              transcript: final ? (this.state.transcript ? `${this.state.transcript} ${final}` : final) : this.state.transcript,
              interimTranscript: interim,
              error: undefined,
            });

            // Silence timer: 1.4 seconds of silence triggers completion
            if (this.silenceTimer) clearTimeout(this.silenceTimer);
            this.silenceTimer = setTimeout(() => {
              if (this.state.isListening && (this.state.transcript || this.state.interimTranscript)) {
                this.stopListening();
              }
            }, 1400);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.log('[Julie Voice] STT Event:', event.error);
          
          if (event.error === 'not-allowed') {
            this.updateState({
              isListening: false,
              hasMicPermission: false,
              error: 'Microphone permission blocked. Please allow mic access in your browser.',
            });
          } else {
            // Transient events (no-speech, aborted, network, audio-capture) are handled gracefully without showing error banners
            if (this.shouldKeepListening && !this.state.isSpeaking) {
              setTimeout(() => {
                if (this.shouldKeepListening && !this.isRecognitionRunning && !this.state.isSpeaking) {
                  try {
                    this.recognition?.start();
                  } catch (e) {}
                }
              }, 400);
            }
          }
        };

        this.recognition.onend = () => {
          this.isRecognitionRunning = false;
          // Auto restart if continuous listening is requested and not speaking
          if (this.shouldKeepListening && !this.state.isSpeaking && !this.state.transcript) {
            setTimeout(() => {
              if (this.shouldKeepListening && !this.isRecognitionRunning && !this.state.isSpeaking) {
                try {
                  this.recognition?.start();
                } catch (e) {}
              }
            }, 300);
          } else {
            this.stopAudioAnalysis();
            this.updateState({ isListening: false });
          }
        };
      } catch (e) {
        console.warn('[Julie Voice] Recognition init note:', e);
      }
    }
  }

  private loadVoices() {
    if (this.synthesis) {
      this.availableVoices = this.synthesis.getVoices();
    }
  }

  subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<VoiceState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(l => l(this.state));
  }

  getState(): VoiceState {
    return this.state;
  }

  /**
   * Explicitly requests microphone access and starts recording.
   */
  async startListening(): Promise<void> {
    this.shouldKeepListening = true;

    if (this.synthesis) {
      this.synthesis.cancel();
      this.updateState({ isSpeaking: false });
    }

    // 1. Start live audio frequency analyzer first (prompts mic permission smoothly)
    await this.startAudioAnalysis();

    // 2. Start Speech Recognition
    if (this.recognition && !this.isRecognitionRunning) {
      try {
        this.state.transcript = '';
        this.state.interimTranscript = '';
        this.recognition.start();
        this.isRecognitionRunning = true;
      } catch (e: any) {
        // Recognition already active
      }
    }
  }

  /**
   * Captures live microphone audio frequency data using Web Audio API for visualizer.
   */
  private async startAudioAnalysis(): Promise<void> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        if (!this.micStream) {
          this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        }

        this.updateState({ hasMicPermission: true, error: undefined });

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const source = this.audioContext.createMediaStreamSource(this.micStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!this.analyser || !this.state.isListening) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(1.0, Math.max(0.05, avg / 60.0));
          this.updateState({ audioLevel: level });
          this.animFrameId = requestAnimationFrame(checkVolume);
        };

        this.animFrameId = requestAnimationFrame(checkVolume);
      }
    } catch (e: any) {
      console.warn('[Julie Voice] Mic permission note:', e.message);
      this.updateState({
        hasMicPermission: false,
        error: 'Please allow microphone access in your browser to speak with Julie.',
      });
    }
  }

  private stopAudioAnalysis(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.updateState({ audioLevel: 0 });
  }

  /**
   * Stop recording speech.
   */
  stopListening(): void {
    this.shouldKeepListening = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.recognition && this.isRecognitionRunning) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isRecognitionRunning = false;
    }
    this.stopAudioAnalysis();
  }

  /**
   * Selects the best "Boss Lady" executive female voice.
   */
  private getBossLadyVoice(): SpeechSynthesisVoice | null {
    if (!this.availableVoices || this.availableVoices.length === 0) {
      if (this.synthesis) {
        this.availableVoices = this.synthesis.getVoices();
      }
    }

    const voices = this.availableVoices;
    if (!voices || voices.length === 0) return null;

    const preferredNames = [
      'Aria',
      'Jenny',
      'Sonia',
      'Samantha',
      'Victoria',
      'Karen',
      'Google UK English Female',
      'Google US English Female',
      'Zira',
    ];

    for (const name of preferredNames) {
      const match = voices.find(
        v => v.name.toLowerCase().includes(name.toLowerCase()) && (v.lang.startsWith('en') || v.lang === '')
      );
      if (match) return match;
    }

    const anyFemale = voices.find(
      v => (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')) && v.lang.startsWith('en')
    );
    if (anyFemale) return anyFemale;

    const anyEn = voices.find(v => v.lang.startsWith('en'));
    return anyEn || voices[0] || null;
  }

  /**
   * Speak output text using the Boss Lady executive Text-to-Speech engine.
   */
  speak(text: string, onEnd?: () => void): void {
    if (!this.synthesis) {
      if (onEnd) onEnd();
      return;
    }

    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
    this.synthesis.cancel();

    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/[👋👑✨✦•●]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.04;
    utterance.volume = 1.0;

    const bossLadyVoice = this.getBossLadyVoice();
    if (bossLadyVoice) {
      utterance.voice = bossLadyVoice;
    }

    if (this.resumeTimer) clearInterval(this.resumeTimer);
    this.resumeTimer = setInterval(() => {
      if (this.synthesis?.speaking && this.synthesis?.paused) {
        this.synthesis.resume();
      }
    }, 4000);

    utterance.onstart = () => {
      this.updateState({ isSpeaking: true });
    };

    utterance.onend = () => {
      if (this.resumeTimer) clearInterval(this.resumeTimer);
      this.updateState({ isSpeaking: false });
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('[Julie Voice] TTS Error:', e);
      if (this.resumeTimer) clearInterval(this.resumeTimer);
      this.updateState({ isSpeaking: false });
      if (onEnd) onEnd();
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Stop currently playing speech.
   */
  stopSpeaking(): void {
    if (this.resumeTimer) clearInterval(this.resumeTimer);
    if (this.synthesis) {
      this.synthesis.cancel();
      this.updateState({ isSpeaking: false });
    }
  }
}

export const voiceService = new VoiceService();
