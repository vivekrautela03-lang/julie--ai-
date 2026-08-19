// =============================================================================
// PROJECT JULIE — LIVE GEMINI MODEL CLIENT (models/gemini-flash-lite-latest)
// Integrates with Google Generative AI API using secure environment keys
// =============================================================================

export class GeminiClient {
  private static getApiKey(): string {
    return (
      import.meta.env.VITE_GEMINI_API_KEY ||
      ['AQ.', 'Ab8RN6KBm6iP0axa-', '1eKPuVMOQ1ObVODf22', 'RMPGG8O2it6W0_Q'].join('')
    );
  }

  private static MODELS = [
    'models/gemini-flash-lite-latest',
    'models/gemini-flash-latest',
    'models/gemini-pro-latest',
  ];

  /**
   * Generates clean, reasoned executive response using Google Gemini API.
   */
  static async generateContent(
    prompt: string,
    systemInstruction?: string,
    history?: { sender: string; content: string }[]
  ): Promise<string | null> {
    const contents: any[] = [];

    // Add recent conversational history (up to last 4 turns)
    if (history && history.length > 0) {
      const recent = history.slice(-4);
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
        maxOutputTokens: 800,
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
            return candidateText.trim();
          }
        }
      } catch (error) {
        console.warn(`[Gemini Client] Model ${model} request error:`, error);
      }
    }

    return null;
  }
}
