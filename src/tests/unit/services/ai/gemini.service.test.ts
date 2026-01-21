import { GeminiService } from '../../../../services/ai/gemini.service';
import { GoogleGenAI } from '@google/genai';
import { env } from '../../../../config/env';
import { logger } from '../../../../utils/logger';

jest.mock('@google/genai');
jest.mock('../../../../config/env', () => ({
  env: {
    GEMINI_API_KEY: 'test-api-key',
    GEMINI_MODEL: 'gemini-1.5-flash',
  },
}));
jest.mock('../../../../utils/logger');

describe('GeminiService', () => {
  let geminiService: GeminiService;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGenerateContent = jest.fn();

    (GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>).mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    } as any));

    geminiService = new GeminiService();
  });

  describe('constructor', () => {
    it('should initialize GoogleGenAI with API key from env', () => {
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });
  });

  describe('generateCompletion', () => {
    it('should generate completion successfully', async () => {
      const prompt = 'Test prompt';
      const expectedResponse = 'Generated response';

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: expectedResponse,
                },
              ],
            },
          },
        ],
      });

      const result = await geminiService.generateCompletion(prompt);

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: env.GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        config: {
          temperature: 0.7,
        },
      });
      expect(result).toBe(expectedResponse);
    });

    it('should return null when response text is empty', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '',
                },
              ],
            },
          },
        ],
      });

      const result = await geminiService.generateCompletion('Test prompt');

      expect(result).toBeNull();
    });

    it('should return null when candidates array is empty', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [],
      });

      const result = await geminiService.generateCompletion('Test prompt');

      expect(result).toBeNull();
    });

    it('should return null when candidates is undefined', async () => {
      mockGenerateContent.mockResolvedValue({});

      const result = await geminiService.generateCompletion('Test prompt');

      expect(result).toBeNull();
    });

    it('should return null when content is missing', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{}],
      });

      const result = await geminiService.generateCompletion('Test prompt');

      expect(result).toBeNull();
    });

    it('should return null when parts array is missing', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {},
          },
        ],
      });

      const result = await geminiService.generateCompletion('Test prompt');

      expect(result).toBeNull();
    });

    it('should throw error when API call fails', async () => {
      const apiError = new Error('API Error');
      mockGenerateContent.mockRejectedValue(apiError);

      await expect(geminiService.generateCompletion('Test prompt')).rejects.toThrow(
        'API Error'
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Gemini API request failed',
        expect.objectContaining({
          event: 'gemini_request_error',
          error: 'API Error',
        })
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      mockGenerateContent.mockRejectedValue(networkError);

      await expect(geminiService.generateCompletion('Test prompt')).rejects.toThrow(
        'Network timeout'
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Gemini API request failed',
        expect.objectContaining({
          event: 'gemini_request_error',
          error: 'Network timeout',
        })
      );
    });
  });
});
