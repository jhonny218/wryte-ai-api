import { Request, Response, NextFunction } from 'express';
import { outlineController } from '../../../controllers/outline.controller';
import { outlineService } from '../../../services/outline.service';
import { userService } from '../../../services/user.service';
import { successResponse } from '../../../utils/response';
import { getAuth } from '@clerk/express';
import { UnauthorizedError } from '../../../utils/errors';

jest.mock('../../../services/outline.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/response');
jest.mock('@clerk/express');

describe('OutlineController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();

    // Mock getAuth to return clerk user ID
    (getAuth as jest.Mock).mockReturnValue({ userId: 'clerk-123' });
  });

  describe('getOutlines', () => {
    it('should get outlines successfully', async () => {
      const orgId = 'org-123';
      const mockOutlines = [
        {
          id: 'outline-1',
          structure: { sections: ['Intro', 'Body', 'Conclusion'] },
          organizationId: orgId,
          status: 'PENDING',
        },
        {
          id: 'outline-2',
          structure: { sections: ['Overview', 'Details'] },
          organizationId: orgId,
          status: 'APPROVED',
        },
      ];

      mockReq.params = { orgId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.getOutlines as jest.Mock).mockResolvedValue(mockOutlines);

      await outlineController.getOutlines(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(outlineService.getOutlines).toHaveBeenCalledWith(orgId);
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockOutlines);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const orgId = 'org-123';
      mockReq.params = { orgId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await outlineController.getOutlines(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(outlineService.getOutlines).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.getOutlines as jest.Mock).mockRejectedValue(error);

      await outlineController.getOutlines(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('updateOutline', () => {
    it('should update outline successfully', async () => {
      const orgId = 'org-123';
      const outlineId = 'outline-123';
      const updateData = {
        structure: { sections: ['Updated Intro', 'Updated Body'] },
        seoKeywords: ['keyword1', 'keyword2'],
        metaDescription: 'Updated meta description',
        suggestedImages: ['image1.jpg', 'image2.jpg'],
        status: 'APPROVED',
      };
      const mockUpdatedOutline = {
        id: outlineId,
        ...updateData,
        organizationId: orgId,
      };

      mockReq.params = { orgId, outlineId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue(mockUpdatedOutline);

      await outlineController.updateOutline(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(outlineService.updateOutline).toHaveBeenCalledWith(orgId, outlineId, updateData);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedOutline,
        'Outline updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update outline with partial data', async () => {
      const orgId = 'org-123';
      const outlineId = 'outline-123';
      const updateData = {
        metaDescription: 'Updated meta only',
      };
      const mockUpdatedOutline = {
        id: outlineId,
        metaDescription: 'Updated meta only',
        organizationId: orgId,
        status: 'PENDING',
      };

      mockReq.params = { orgId, outlineId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue(mockUpdatedOutline);

      await outlineController.updateOutline(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(outlineService.updateOutline).toHaveBeenCalledWith(
        orgId,
        outlineId,
        { metaDescription: 'Updated meta only' }
      );
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedOutline,
        'Outline updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update outline structure only', async () => {
      const orgId = 'org-123';
      const outlineId = 'outline-123';
      const updateData = {
        structure: {
          sections: [
            { title: 'Introduction', content: 'Intro content' },
            { title: 'Main Body', content: 'Main content' },
          ],
        },
      };
      const mockUpdatedOutline = {
        id: outlineId,
        ...updateData,
        organizationId: orgId,
      };

      mockReq.params = { orgId, outlineId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue(mockUpdatedOutline);

      await outlineController.updateOutline(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(outlineService.updateOutline).toHaveBeenCalledWith(
        orgId,
        outlineId,
        updateData
      );
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedOutline,
        'Outline updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update outline with seoKeywords and suggestedImages', async () => {
      const orgId = 'org-123';
      const outlineId = 'outline-123';
      const updateData = {
        seoKeywords: ['seo1', 'seo2', 'seo3'],
        suggestedImages: ['img1.png', 'img2.png'],
      };
      const mockUpdatedOutline = {
        id: outlineId,
        ...updateData,
        organizationId: orgId,
      };

      mockReq.params = { orgId, outlineId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue(mockUpdatedOutline);

      await outlineController.updateOutline(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(outlineService.updateOutline).toHaveBeenCalledWith(
        orgId,
        outlineId,
        updateData
      );
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedOutline,
        'Outline updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for invalid status', async () => {
      const orgId = 'org-123';
      const outlineId = 'outline-123';
      const updateData = {
        structure: { sections: ['Intro'] },
        status: 'INVALID_STATUS',
      };

      mockReq.params = { orgId, outlineId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await outlineController.updateOutline(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(outlineService.updateOutline).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const orgId = 'org-123';
      const outlineId = 'outline-123';
      mockReq.params = { orgId, outlineId };
      mockReq.body = { structure: { sections: ['Intro'] } };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await outlineController.updateOutline(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(outlineService.updateOutline).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123', outlineId: 'outline-123' };
      mockReq.body = { structure: { sections: ['Intro'] } };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockRejectedValue(error);

      await outlineController.updateOutline(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('deleteOutline', () => {
    it('should delete outline successfully', async () => {
      const orgId = 'org-123';
      const outlineId = 'outline-123';

      mockReq.params = { orgId, outlineId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.deleteOutline as jest.Mock).mockResolvedValue(undefined);

      await outlineController.deleteOutline(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(outlineService.deleteOutline).toHaveBeenCalledWith(orgId, outlineId);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        'Outline deleted successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const orgId = 'org-123';
      const outlineId = 'outline-123';
      mockReq.params = { orgId, outlineId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await outlineController.deleteOutline(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(outlineService.deleteOutline).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123', outlineId: 'outline-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.deleteOutline as jest.Mock).mockRejectedValue(error);

      await outlineController.deleteOutline(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });
});
