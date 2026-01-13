import { GoogleGenAI } from "@google/genai";
import { env } from '../../config/env';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  async generateCompletion(prompt: string): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt }
            ]
          }
        ],
        config: {
          temperature: 0.7,
        }
      });

      const candidates = response.candidates;
      const text = candidates?.[0]?.content?.parts?.[0]?.text;
      return text || null;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
