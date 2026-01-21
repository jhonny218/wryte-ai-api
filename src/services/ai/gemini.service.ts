import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  async generateCompletion(prompt: string): Promise<string | null> {
    const startTime = Date.now();
    const promptLength = prompt.length;

    logger.debug("Gemini API request started", {
      event: "gemini_request_start",
      model: env.GEMINI_MODEL,
      promptLength,
    });

    try {
      const response = await this.ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        config: {
          temperature: 0.7,
        },
      });

      const duration = Date.now() - startTime;
      const candidates = response.candidates;
      const text = candidates?.[0]?.content?.parts?.[0]?.text;
      const responseLength = text?.length || 0;

      logger.info("Gemini API request completed", {
        event: "gemini_request_success",
        model: env.GEMINI_MODEL,
        duration,
        promptLength,
        responseLength,
        hasResponse: !!text,
      });

      return text || null;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error as Error & { status?: number; code?: string };

      logger.error("Gemini API request failed", {
        event: "gemini_request_error",
        model: env.GEMINI_MODEL,
        duration,
        promptLength,
        error: err.message,
        status: err.status,
        code: err.code,
      });

      throw error;
    }
  }
}

export const geminiService = new GeminiService();
