import { settingsService } from '../../../services/settings.service';
import { prisma } from '../../../utils/prisma';

jest.mock('../../../utils/prisma', () => ({
  prisma: {
    contentSettings: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('SettingsService', () => {
  const mockOrgId = 'org-123';
  const mockSettings = {
    primaryKeywords: ['keyword1', 'keyword2'],
    secondaryKeywords: ['secondary1'],
    tone: 'professional',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsert', () => {
    it('should create settings when they do not exist', async () => {
      const expectedResult = {
        id: 'settings-1',
        organizationId: mockOrgId,
        ...mockSettings,
      };

      (prisma.contentSettings.upsert as jest.Mock).mockResolvedValue(expectedResult);

      const result = await settingsService.upsert(mockOrgId, mockSettings);

      expect(prisma.contentSettings.upsert).toHaveBeenCalledWith({
        where: { organizationId: mockOrgId },
        create: {
          organizationId: mockOrgId,
          ...mockSettings,
        },
        update: {
          ...mockSettings,
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should update settings when they already exist', async () => {
      const updatedSettings = {
        ...mockSettings,
        tone: 'casual',
      };
      const expectedResult = {
        id: 'settings-1',
        organizationId: mockOrgId,
        ...updatedSettings,
      };

      (prisma.contentSettings.upsert as jest.Mock).mockResolvedValue(expectedResult);

      const result = await settingsService.upsert(mockOrgId, updatedSettings);

      expect(prisma.contentSettings.upsert).toHaveBeenCalledWith({
        where: { organizationId: mockOrgId },
        create: {
          organizationId: mockOrgId,
          ...updatedSettings,
        },
        update: {
          ...updatedSettings,
        },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getByOrgId', () => {
    it('should return settings for a valid organization ID', async () => {
      const expectedSettings = {
        id: 'settings-1',
        organizationId: mockOrgId,
        ...mockSettings,
      };

      (prisma.contentSettings.findUnique as jest.Mock).mockResolvedValue(expectedSettings);

      const result = await settingsService.getByOrgId(mockOrgId);

      expect(prisma.contentSettings.findUnique).toHaveBeenCalledWith({
        where: { organizationId: mockOrgId },
      });
      expect(result).toEqual(expectedSettings);
    });

    it('should return null when settings do not exist', async () => {
      (prisma.contentSettings.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await settingsService.getByOrgId('non-existent-org');

      expect(prisma.contentSettings.findUnique).toHaveBeenCalledWith({
        where: { organizationId: 'non-existent-org' },
      });
      expect(result).toBeNull();
    });
  });
});
