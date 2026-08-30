// =============================================================================
// PROJECT JULIE — LIVE GEMINI 2.5 FLASH NEURAL CORE
// Powered by Google Gemini 2.5 Flash with fallback resilience & mobile optimization
// =============================================================================

export class GeminiClient {
  public static getApiKey(): string {
    if (typeof window !== 'undefined') {
      const customKey = localStorage.getItem('julie_gemini_api_key');
      if (customKey && customKey.trim()) return customKey.trim();
    }

    return (
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) ||
      ''
    );
  }

  public static setApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('julie_gemini_api_key', key.trim());
    }
  }

  private static MODELS = [
    'models/gemini-2.5-flash',
    'models/gemini-2.5-flash-lite',
    'models/gemini-flash-latest',
    'models/gemini-pro-latest',
  ];

  private static activeModelUsed = 'models/gemini-2.5-flash';

  public static getActiveModel(): string {
    return this.activeModelUsed;
  }

  /**
   * Generates clean, reasoned executive response using Google Gemini API.
   * Optimized for instant mobile response and voice synthesis.
   */
  static async generateContent(
    prompt: string,
    systemInstruction?: string,
    history?: { sender: string; content: string }[]
  ): Promise<string | null> {
    const contents: any[] = [];

    // Add recent conversational history (up to last 6 turns)
    if (history && history.length > 0) {
      const recent = history.slice(-6);
      for (const h of recent) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        });
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const body: any = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200,
        topP: 0.95,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const apiKey = this.getApiKey();

    // Try candidate models in priority order
    for (const model of this.MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim()) {
            this.activeModelUsed = model;
            return candidateText.trim();
          }
        } else {
          const errJson = await response.json().catch(() => null);
          console.warn(`[Gemini Client] Model ${model} response ${response.status}:`, errJson?.error?.message || response.statusText);
        }
      } catch (error) {
        console.warn(`[Gemini Client] Model ${model} request error:`, error);
      }
    }

    return null;
  }

  /**
   * Validates API connectivity with Google Gemini.
   */
  static async validateApiKey(): Promise<{ success: boolean; model?: string; error?: string }> {
    const apiKey = this.getApiKey();
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${apiKey}`;
      const res = await fetch(testUrl);
      if (res.ok) {
        return { success: true, model: 'gemini-2.5-flash' };
      }
      const err = await res.json().catch(() => null);
      return { success: false, error: err?.error?.message || `HTTP ${res.status}` };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
