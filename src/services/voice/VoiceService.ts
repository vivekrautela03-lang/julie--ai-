// =============================================================================
// PROJECT JULIE — HIGH-FIDELITY MOBILE & DESKTOP VOICE ENGINE
// Multiple female voice personas, Web Audio live spectrum, mobile touch unlock,
// resilient mobile STT, and natural zero-lag TTS across Android, iOS & Desktop.
// =============================================================================

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  audioLevel: number; // 0.0 to 1.0 live mic volume
  hasMicPermission: boolean;
  isMobileUnlocked: boolean;
  error?: string;
}

export type VoicePersonaId = 'julie_boss' | 'serena_calm' | 'aria_natural' | 'natasha_crisp' | 'maya_warm';

export interface VoicePersona {
  id: VoicePersonaId;
  name: string;
  subtitle: string;
  accent: string;
  description: string;
  samplePhrase: string;
  pitch: number;
  rate: number;
  keywords: string[];
}

export const FEMALE_VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'julie_boss',
    name: 'Julie (Executive Boss Lady)',
    subtitle: 'Confident, sharp, and authoritative',
    accent: 'US / UK Executive',
    description: 'Polished chief-of-staff tone designed for executive decision making.',
    samplePhrase: "Good morning, boss. Your schedule and attendance recovery plan are locked and ready.",
    pitch: 1.05,
    rate: 1.05,
    keywords: ['Google UK English Female', 'Google US English Female', 'Aria', 'Sonia', 'Victoria', 'Zira', 'Samantha', 'en-US-language', 'en_US'],
  },
  {
    id: 'serena_calm',
    name: 'Serena (Calm & Intellectual)',
    subtitle: 'Poised, elegant, and academic',
    accent: 'British RP',
    description: 'Serene and articulate voice ideal for deep focus and lecture study sessions.',
    samplePhrase: "Hello. I've analyzed your timetable and academic deadlines for the week.",
    pitch: 0.98,
    rate: 0.98,
    keywords: ['Google UK English Female', 'Hazel', 'Susan', 'Serena', 'British', 'en-GB', 'en_GB'],
  },
  {
    id: 'aria_natural',
    name: 'Aria (Warm & Conversational)',
    subtitle: 'Natural, friendly, and engaging',
    accent: 'American Neutral',
    description: 'Bright and conversational assistant voice similar to ChatGPT Advanced Voice.',
    samplePhrase: "Hey there! Ready to crush your goals and get through today's classes?",
    pitch: 1.10,
    rate: 1.02,
    keywords: ['Aria', 'Jenny', 'Samantha', 'Google US English Female', 'en-US', 'en_US', 'default'],
  },
  {
    id: 'natasha_crisp',
    name: 'Natasha (Crisp & Direct)',
    subtitle: 'Concise, rapid, and mission-focused',
    accent: 'International English',
    description: 'Fast-paced, efficient delivery that gets straight to the point.',
    samplePhrase: "Understood. Class reminder active. Attendance recalculated at 60.34%.",
    pitch: 1.02,
    rate: 1.14,
    keywords: ['Karen', 'Victoria', 'Moira', 'en-AU', 'en-CA', 'en_AU'],
  },
  {
    id: 'maya_warm',
    name: 'Maya (Empathetic & Global)',
    subtitle: 'Encouraging, smooth, and supportive',
    accent: 'Indian / Global English',
    description: 'Warm and supportive tone for daily planning and wellness balance.',
    samplePhrase: "Namaste, boss! Don't worry about the attendance shortage, we have a clear path to 75%.",
    pitch: 1.06,
    rate: 1.0,
    keywords: ['Google Hindi Female', 'Heera', 'Veena', 'en-IN', 'en_IN', 'English India'],
  },
];

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
  private currentPersonaId: VoicePersonaId = 'julie_boss';
  private isAudioUnlocked: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speechSafetyTimer: any = null;
  
  private state: VoiceState = {
    isListening: false,
    isSpeaking: false,
    transcript: '',
    interimTranscript: '',
    audioLevel: 0,
    hasMicPermission: true,
    isMobileUnlocked: false,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const savedPersona = localStorage.getItem('julie_voice_persona') as VoicePersonaId;
      if (savedPersona && FEMALE_VOICE_PERSONAS.some(p => p.id === savedPersona)) {
        this.currentPersonaId = savedPersona;
      }

      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        this.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
      }

      this.initRecognition();
      this.attachMobileTouchUnlock();
    }
  }

  /**
   * Automatically unlocks audio contexts on first user interaction on mobile devices.
   */
  private attachMobileTouchUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlockMobileAudio();
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('click', unlockHandler);
    };

    window.addEventListener('touchstart', unlockHandler, { passive: true });
    window.addEventListener('click', unlockHandler, { passive: true });
  }

  /**
   * Primes and unlocks the mobile audio pipeline (AudioContext + SpeechSynthesis).
   */
  public unlockMobileAudio(): void {
    if (this.isAudioUnlocked) return;
    this.isAudioUnlocked = true;

    try {
      // 1. Prime Web Audio Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
      }

      // 2. Prime SpeechSynthesis for mobile Safari / Chrome
      if (this.synthesis) {
        const dummy = new SpeechSynthesisUtterance(' ');
        dummy.volume = 0.01;
        this.synthesis.speak(dummy);
        this.loadVoices();
      }

      this.updateState({ isMobileUnlocked: true });
      console.log('[Julie Voice] Mobile audio pipeline unlocked successfully.');
    } catch (e) {
      console.warn('[Julie Voice] Mobile unlock note:', e);
    }
  }

  getPersona(): VoicePersona {
    return FEMALE_VOICE_PERSONAS.find(p => p.id === this.currentPersonaId) || FEMALE_VOICE_PERSONAS[0];
  }

  setPersona(personaId: VoicePersonaId): void {
    if (FEMALE_VOICE_PERSONAS.some(p => p.id === personaId)) {
      this.currentPersonaId = personaId;
      localStorage.setItem('julie_voice_persona', personaId);
    }
  }

  getAvailablePersonas(): VoicePersona[] {
    return FEMALE_VOICE_PERSONAS;
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
          if (event.error === 'no-speech' || event.error === 'aborted') {
            if (this.shouldKeepListening && !this.state.isSpeaking) {
              setTimeout(() => {
                if (this.shouldKeepListening && !this.isRecognitionRunning) {
                  try {
                    this.recognition.start();
                  } catch (e) {}
                }
              }, 250);
            }
            return;
          }

          if (event.error === 'not-allowed') {
            this.updateState({
              isListening: false,
              hasMicPermission: false,
              error: 'Microphone permission denied. Please allow microphone access in your mobile browser settings.',
            });
            this.isRecognitionRunning = false;
            return;
          }

          if (event.error === 'network') {
            if (this.shouldKeepListening) {
              setTimeout(() => {
                if (this.shouldKeepListening && !this.isRecognitionRunning) {
                  try { this.recognition.start(); } catch (e) {}
                }
              }, 600);
            }
            return;
          }

          this.isRecognitionRunning = false;
        };

        this.recognition.onend = () => {
          this.isRecognitionRunning = false;
          if (this.shouldKeepListening && !this.state.isSpeaking) {
            try {
              this.recognition.start();
            } catch (e) {}
          } else {
            this.updateState({ isListening: false });
          }
        };
      } catch (err: any) {
        console.warn('[Julie Voice] SpeechRecognition init note:', err.message);
      }
    }
  }

  private loadVoices(): void {
    if (!this.synthesis) return;
    const voices = this.synthesis.getVoices();
    if (voices && voices.length > 0) {
      this.availableVoices = voices;
    }
  }

  private async startAudioAnalysis(): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (this.audioContext && this.micStream) {
        const source = this.audioContext.createMediaStreamSource(this.micStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!this.analyser || !this.state.isListening) {
            this.updateState({ audioLevel: 0 });
            return;
          }

          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(1.0, Math.max(0.0, avg / 128));

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

  startListening(): void {
    this.unlockMobileAudio();

    if (!this.recognition) {
      this.updateState({
        error: 'Speech recognition requires Chrome, Edge or Safari. You can also type below!',
      });
      return;
    }

    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    this.shouldKeepListening = true;
    this.updateState({
      transcript: '',
      interimTranscript: '',
      error: undefined,
      isSpeaking: false,
    });

    if (!this.isRecognitionRunning) {
      try {
        this.recognition.start();
      } catch (err: any) {
        if (!err.message?.includes('already started')) {
          console.warn('[Julie Voice] Recognition start note:', err.message);
        }
      }
    }

    this.startAudioAnalysis();
  }

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

  private getPersonaVoice(persona: VoicePersona): SpeechSynthesisVoice | null {
    if (!this.availableVoices || this.availableVoices.length === 0) {
      if (this.synthesis) {
        this.availableVoices = this.synthesis.getVoices();
      }
    }

    const voices = this.availableVoices;
    if (!voices || voices.length === 0) return null;

    // 1. Try keyword match
    for (const keyword of persona.keywords) {
      const match = voices.find(
        v => v.name.toLowerCase().includes(keyword.toLowerCase()) || v.lang.toLowerCase().includes(keyword.toLowerCase())
      );
      if (match) return match;
    }

    // 2. Try any female voice
    const anyFemale = voices.find(
      v => (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')) && v.lang.startsWith('en')
    );
    if (anyFemale) return anyFemale;

    // 3. Try any English voice
    const anyEn = voices.find(v => v.lang.startsWith('en'));
    return anyEn || voices[0] || null;
  }

  speak(text: string, onEnd?: () => void): void {
    this.unlockMobileAudio();

    if (!this.synthesis) {
      if (onEnd) onEnd();
      return;
    }

    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
    this.synthesis.cancel();

    // Clean text for speech: strip markdown, code blocks, emojis, bullets
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code snippet provided in chat.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~[\]]/g, '')
      .replace(/[👋👑✨✦•●☀️⛅🌧️⏰📍⚡🎓✅⚠️❌]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const persona = this.getPersona();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = persona.rate;
    utterance.pitch = persona.pitch;
    utterance.volume = 1.0;

    const matchedVoice = this.getPersonaVoice(persona);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    this.currentUtterance = utterance;
    this.stopListening();
    this.updateState({ isSpeaking: true });

    if (this.speechSafetyTimer) clearTimeout(this.speechSafetyTimer);
    const estimatedDurationMs = Math.max(3500, cleanText.split(' ').length * 500 + 2000);
    this.speechSafetyTimer = setTimeout(() => {
      if (this.state.isSpeaking) {
        console.log('[Julie Voice] Safety speech timeout completed.');
        this.updateState({ isSpeaking: false });
        this.currentUtterance = null;
        if (onEnd) onEnd();
      }
    }, estimatedDurationMs);

    utterance.onend = () => {
      if (this.speechSafetyTimer) clearTimeout(this.speechSafetyTimer);
      this.currentUtterance = null;
      this.updateState({ isSpeaking: false });
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('[Julie Voice] Speech utterance error:', e);
      if (this.speechSafetyTimer) clearTimeout(this.speechSafetyTimer);
      this.currentUtterance = null;
      this.updateState({ isSpeaking: false });
      if (onEnd) onEnd();
    };

    try {
      this.synthesis.speak(utterance);
    } catch (err) {
      console.warn('[Julie Voice] Speech speak error:', err);
      if (this.speechSafetyTimer) clearTimeout(this.speechSafetyTimer);
      this.currentUtterance = null;
      this.updateState({ isSpeaking: false });
      if (onEnd) onEnd();
    }
  }

  /**
   * Tests mobile audio playback immediately with a confirmation phrase.
   */
  testMobileVoice(onComplete?: () => void): void {
    this.unlockMobileAudio();
    const persona = this.getPersona();
    this.speak(
      `Hello boss! Voice engine is active and ready on your mobile phone. Persona set to ${persona.name}.`,
      onComplete
    );
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.updateState({ isSpeaking: false });
  }

  getState(): VoiceState {
    return { ...this.state };
  }

  subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<VoiceState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(currentState);
      } catch (err) {
        console.warn('[Julie Voice] Listener error:', err);
      }
    });
  }
}

export const voiceService = new VoiceService();
