import { Request, Response, NextFunction } from 'express';
import { settingsController } from '../../../controllers/settings.controller';
import { settingsService } from '../../../services/settings.service';
import { successResponse } from '../../../utils/response';

jest.mock('../../../services/settings.service');
jest.mock('../../../utils/response');

describe('SettingsController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('upsert', () => {
    it('should upsert settings successfully', async () => {
      const orgId = 'org-123';
      const settingsData = {
        primaryKeywords: ['keyword1'],
        tone: 'professional',
      };
      const mockResult = {
        id: 'settings-1',
        organizationId: orgId,
        ...settingsData,
      };

      mockReq.params = { orgId };
      mockReq.body = settingsData;

      (settingsService.upsert as jest.Mock).mockResolvedValue(mockResult);

      await settingsController.upsert(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(settingsService.upsert).toHaveBeenCalledWith(orgId, settingsData);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockResult,
        'Settings upserted successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123' };
      mockReq.body = {};

      (settingsService.upsert as jest.Mock).mockRejectedValue(error);

      await settingsController.upsert(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('getByOrgId', () => {
    it('should return settings when they exist', async () => {
      const orgId = 'org-123';
      const mockSettings = {
        id: 'settings-1',
        organizationId: orgId,
        primaryKeywords: ['keyword1'],
      };

      mockReq.params = { orgId };

      (settingsService.getByOrgId as jest.Mock).mockResolvedValue(mockSettings);

      await settingsController.getByOrgId(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(settingsService.getByOrgId).toHaveBeenCalledWith(orgId);
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockSettings);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return null message when settings do not exist', async () => {
      const orgId = 'org-123';

      mockReq.params = { orgId };

      (settingsService.getByOrgId as jest.Mock).mockResolvedValue(null);

      await settingsController.getByOrgId(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(settingsService.getByOrgId).toHaveBeenCalledWith(orgId);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        'No settings found for this organization'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123' };

      (settingsService.getByOrgId as jest.Mock).mockRejectedValue(error);

      await settingsController.getByOrgId(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });
});
