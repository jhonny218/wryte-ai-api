import { SettingsController } from '../../../controllers/settings.controller.tsoa';
import { settingsService } from '../../../services/settings.service';
import { getUserId } from '../../../utils/auth';
import { UnauthorizedError } from '../../../utils/errors';
import type { Request as ExpressRequest } from 'express';

jest.mock('../../../services/settings.service');
jest.mock('../../../utils/auth');

describe('SettingsController (TSOA)', () => {
  let controller: SettingsController;
  let mockRequest: Partial<ExpressRequest>;

  const mockSettings = {
    id: 'settings-123',
    organizationId: 'org-123',
    tone: 'professional',
    style: 'informative',
    targetAudience: 'developers',
    keywords: ['tech', 'coding'],
    contentPillars: ['tutorials', 'guides'],
    voicePersonality: 'friendly expert',
    writingGuidelines: 'Be clear and concise',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    controller = new SettingsController();
    mockRequest = {};
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should get settings for organization', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (settingsService.getByOrgId as jest.Mock).mockResolvedValue(mockSettings);

      const result = await controller.getSettings('org-123', mockRequest as ExpressRequest);

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(settingsService.getByOrgId).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockSettings);
    });

    it('should return null when no settings found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (settingsService.getByOrgId as jest.Mock).mockResolvedValue(null);

      const result = await controller.getSettings('org-123', mockRequest as ExpressRequest);

      expect(result).toBeNull();
    });

    it('should throw when getUserId throws (unauthorized)', async () => {
      (getUserId as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError('Not authenticated');
      });

      await expect(
        controller.getSettings('org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(settingsService.getByOrgId).not.toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (settingsService.getByOrgId as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.getSettings('org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow('Database error');
    });
  });

  describe('upsertSettings', () => {
    const requestBody = {
      tone: 'casual' as const,
      style: 'conversational',
      targetAudience: 'beginners',
      keywords: ['learning', 'basics'],
      contentPillars: ['introduction', 'fundamentals'],
      voicePersonality: 'approachable mentor',
      writingGuidelines: 'Use simple language',
    };

    it('should create settings successfully', async () => {
      const createdSettings = { ...mockSettings, ...requestBody };
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (settingsService.upsert as jest.Mock).mockResolvedValue(createdSettings);

      const result = await controller.upsertSettings(
        'org-123',
        requestBody,
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(settingsService.upsert).toHaveBeenCalledWith('org-123', requestBody);
      expect(result).toEqual(createdSettings);
    });

    it('should update settings successfully', async () => {
      const partialUpdate = { tone: 'formal' as const };
      const updatedSettings = { ...mockSettings, tone: 'formal' };
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (settingsService.upsert as jest.Mock).mockResolvedValue(updatedSettings);

      const result = await controller.upsertSettings(
        'org-123',
        partialUpdate,
        mockRequest as ExpressRequest
      );

      expect(settingsService.upsert).toHaveBeenCalledWith('org-123', partialUpdate);
      expect(result.tone).toBe('formal');
    });

    it('should throw when getUserId throws (unauthorized)', async () => {
      (getUserId as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError('Not authenticated');
      });

      await expect(
        controller.upsertSettings('org-123', requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(settingsService.upsert).not.toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to upsert settings');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (settingsService.upsert as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.upsertSettings('org-123', requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow('Failed to upsert settings');
    });

    it('should accept all valid tone values', async () => {
      const tones = ['professional', 'casual', 'friendly', 'formal', 'witty', 'educational'] as const;

      for (const tone of tones) {
        (getUserId as jest.Mock).mockReturnValue('clerk-123');
        (settingsService.upsert as jest.Mock).mockResolvedValue({ ...mockSettings, tone });

        const result = await controller.upsertSettings(
          'org-123',
          { tone },
          mockRequest as ExpressRequest
        );

        expect(result.tone).toBe(tone);
      }
    });

    it('should handle empty keywords array', async () => {
      const emptyKeywords = { keywords: [] };
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (settingsService.upsert as jest.Mock).mockResolvedValue({
        ...mockSettings,
        keywords: [],
      });

      const result = await controller.upsertSettings(
        'org-123',
        emptyKeywords,
        mockRequest as ExpressRequest
      );

      expect(settingsService.upsert).toHaveBeenCalledWith('org-123', emptyKeywords);
      expect(result.keywords).toEqual([]);
    });

    it('should handle empty contentPillars array', async () => {
      const emptyPillars = { contentPillars: [] };
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (settingsService.upsert as jest.Mock).mockResolvedValue({
        ...mockSettings,
        contentPillars: [],
      });

      const result = await controller.upsertSettings(
        'org-123',
        emptyPillars,
        mockRequest as ExpressRequest
      );

      expect(settingsService.upsert).toHaveBeenCalledWith('org-123', emptyPillars);
      expect(result.contentPillars).toEqual([]);
    });
  });
});
