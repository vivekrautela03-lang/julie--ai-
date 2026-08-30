// =============================================================================
// PROJECT JULIE — PYTHON AI ASSISTANT BRIDGE (ASTRA NEURAL CORE)
// Bridges Julie AI with the local/LAN Python AI Assistant backend on port 8000.
// Works seamlessly across PC and mobile phones over LAN.
// =============================================================================

export interface BackendStatus {
  isOnline: boolean;
  serverUrl: string;
  wsUrl: string;
  assistantName: string;
  activeModel: string;
  lastPing: number;
}

export type BackendEventListener = (event: { type: string; data: any }) => void;

export class AstraAssistantBridge {
  private static instance: AstraAssistantBridge | null = null;
  private ws: WebSocket | null = null;
  private listeners: Set<BackendEventListener> = new Set();
  private isConnected: boolean = false;
  private reconnectTimer: any = null;
  private pingTimer: any = null;

  public static getServerHost(): string {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
    return 'localhost';
  }

  public static getBaseUrl(): string {
    const host = this.getServerHost();
    return `http://${host}:8000`;
  }

  public static getWsUrl(): string {
    const host = this.getServerHost();
    return `ws://${host}:8000/ws?token=local`;
  }

  static getInstance(): AstraAssistantBridge {
    if (!this.instance) {
      this.instance = new AstraAssistantBridge();
    }
    return this.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init(): void {
    this.checkStatus();
    this.connectWs();

    // Periodic health check
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      this.checkStatus();
    }, 15000);
  }

  public async checkStatus(): Promise<BackendStatus> {
    const baseUrl = AstraAssistantBridge.getBaseUrl();
    const wsUrl = AstraAssistantBridge.getWsUrl();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${baseUrl}/`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.status < 500) {
        this.isConnected = true;
        return {
          isOnline: true,
          serverUrl: baseUrl,
          wsUrl,
          assistantName: 'Julie (Astra Core)',
          activeModel: 'Gemini 2.5 Flash Native',
          lastPing: Date.now(),
        };
      }
    } catch {
      // Backend offline or unreachable from this network interface
    }

    this.isConnected = false;
    return {
      isOnline: false,
      serverUrl: baseUrl,
      wsUrl,
      assistantName: 'Julie Cloud AI',
      activeModel: 'Gemini 2.5 Flash (Direct Cloud)',
      lastPing: Date.now(),
    };
  }

  public connectWs(): void {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const wsUrl = AstraAssistantBridge.getWsUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[Astra Assistant Bridge] Connected to Python backend at:', wsUrl);
        this.notifyListeners({ type: 'connected', data: { url: wsUrl } });
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.notifyListeners({ type: 'message', data: parsed });
        } catch {
          this.notifyListeners({ type: 'raw', data: event.data });
        }
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connectWs();
        }, 10000);
      };
    } catch (e) {
      this.isConnected = false;
    }
  }

  public isOnline(): boolean {
    return this.isConnected;
  }

  public sendCommand(commandText: string): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'command',
        text: commandText,
        timestamp: Date.now(),
      }));
      return true;
    }
    return false;
  }

  public sendInterrupt(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'interrupt' }));
    }
  }

  public subscribe(cb: BackendEventListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners(event: { type: string; data: any }): void {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.warn('[AstraBridge] Listener error:', err);
      }
    });
  }
}

export const astraBridge = AstraAssistantBridge.getInstance();
