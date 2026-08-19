// =============================================================================
// PROJECT JULIE — BACKGROUND WAKE WORD ENGINE ("Hey Julie")
// Continuously monitors microphone in background for "Hey Julie" wake phrase.
// =============================================================================

export type WakeWordCallback = (phrase: string) => void;

export class WakeWordEngine {
  private recognition: any = null;
  private isListeningForWakeWord: boolean = false;
  private callbacks: Set<WakeWordCallback> = new Set();
  private restartTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            console.log('[Wake Word Listener]:', transcript);

            if (
              transcript.includes('hey julie') ||
              transcript.includes('hey jule') ||
              transcript.includes('hey july') ||
              transcript.includes('hello julie') ||
              transcript.includes('ok julie') ||
              (transcript.startsWith('julie') && transcript.length > 5)
            ) {
              console.log('[Wake Word Triggered!]:', transcript);
              this.notifyCallbacks(transcript);
              break;
            }
          }
        };

        this.recognition.onerror = (e: any) => {
          if (e.error !== 'no-speech') {
            console.warn('[Wake Word Engine] Note:', e.error);
          }
        };

        this.recognition.onend = () => {
          if (this.isListeningForWakeWord) {
            // Auto restart background listener
            if (this.restartTimeout) clearTimeout(this.restartTimeout);
            this.restartTimeout = setTimeout(() => {
              try {
                if (this.isListeningForWakeWord && this.recognition) {
                  this.recognition.start();
                }
              } catch (err) {}
            }, 500);
          }
        };
      }
    }
  }

  onWakeWord(cb: WakeWordCallback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  private notifyCallbacks(phrase: string) {
    this.callbacks.forEach(cb => cb(phrase));
  }

  start(): void {
    if (!this.recognition || this.isListeningForWakeWord) return;
    try {
      this.isListeningForWakeWord = true;
      this.recognition.start();
      console.log('[Wake Word Engine] Active and listening for "Hey Julie"...');
    } catch (e) {
      console.warn('[Wake Word Engine] Start note:', e);
    }
  }

  stop(): void {
    this.isListeningForWakeWord = false;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }
}

export const wakeWordEngine = new WakeWordEngine();
