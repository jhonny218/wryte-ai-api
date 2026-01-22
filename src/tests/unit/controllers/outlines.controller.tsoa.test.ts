import { OutlinesController } from '../../../controllers/outlines.controller.tsoa';
import { outlineService } from '../../../services/outline.service';
import { userService } from '../../../services/user.service';
import { getUserId } from '../../../utils/auth';
import { UnauthorizedError, BadRequestError } from '../../../utils/errors';
import type { Request as ExpressRequest } from 'express';

jest.mock('../../../services/outline.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/auth');

describe('OutlinesController (TSOA)', () => {
  let controller: OutlinesController;
  let mockRequest: Partial<ExpressRequest>;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
  };

  const mockOutline = {
    id: 'outline-123',
    blogTitleId: 'title-123',
    structure: { sections: [] },
    seoKeywords: ['keyword1', 'keyword2'],
    metaDescription: 'Test description',
    suggestedImages: ['image1.jpg'],
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    controller = new OutlinesController();
    mockRequest = {};
    jest.clearAllMocks();
  });

  describe('getOutlines', () => {
    it('should get all outlines for organization', async () => {
      const mockOutlines = [mockOutline];
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.getOutlines as jest.Mock).mockResolvedValue(mockOutlines);

      const result = await controller.getOutlines('org-123', mockRequest as ExpressRequest);

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(outlineService.getOutlines).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockOutlines);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.getOutlines('org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(outlineService.getOutlines).not.toHaveBeenCalled();
    });

    it('should return empty array when no outlines found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.getOutlines as jest.Mock).mockResolvedValue([]);

      const result = await controller.getOutlines('org-123', mockRequest as ExpressRequest);

      expect(result).toEqual([]);
    });
  });

  describe('updateOutline', () => {
    it('should update outline successfully', async () => {
      const updateBody = {
        structure: { sections: ['intro', 'body', 'conclusion'] },
        status: 'APPROVED' as const,
      };
      const updatedOutline = { ...mockOutline, ...updateBody };

      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue(updatedOutline);

      const result = await controller.updateOutline(
        'org-123',
        'outline-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(outlineService.updateOutline).toHaveBeenCalledWith('org-123', 'outline-123', {
        structure: updateBody.structure,
        status: updateBody.status,
      });
      expect(result).toEqual(updatedOutline);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.updateOutline(
          'org-123',
          'outline-123',
          { status: 'APPROVED' },
          mockRequest as ExpressRequest
        )
      ).rejects.toThrow(UnauthorizedError);

      expect(outlineService.updateOutline).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError for invalid status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        controller.updateOutline(
          'org-123',
          'outline-123',
          { status: 'INVALID_STATUS' as any },
          mockRequest as ExpressRequest
        )
      ).rejects.toThrow(BadRequestError);

      expect(outlineService.updateOutline).not.toHaveBeenCalled();
    });

    it('should update with seoKeywords', async () => {
      const updateBody = {
        seoKeywords: ['new-keyword1', 'new-keyword2'],
      };

      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue({
        ...mockOutline,
        ...updateBody,
      });

      await controller.updateOutline(
        'org-123',
        'outline-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(outlineService.updateOutline).toHaveBeenCalledWith('org-123', 'outline-123', {
        seoKeywords: updateBody.seoKeywords,
      });
    });

    it('should update with metaDescription', async () => {
      const updateBody = {
        metaDescription: 'New meta description',
      };

      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue({
        ...mockOutline,
        ...updateBody,
      });

      await controller.updateOutline(
        'org-123',
        'outline-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(outlineService.updateOutline).toHaveBeenCalledWith('org-123', 'outline-123', {
        metaDescription: 'New meta description',
      });
    });

    it('should update with suggestedImages', async () => {
      const updateBody = {
        suggestedImages: ['new-image1.jpg', 'new-image2.jpg'],
      };

      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue({
        ...mockOutline,
        ...updateBody,
      });

      await controller.updateOutline(
        'org-123',
        'outline-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(outlineService.updateOutline).toHaveBeenCalledWith('org-123', 'outline-123', {
        suggestedImages: updateBody.suggestedImages,
      });
    });

    it('should allow PENDING status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue(mockOutline);

      await controller.updateOutline(
        'org-123',
        'outline-123',
        { status: 'PENDING' },
        mockRequest as ExpressRequest
      );

      expect(outlineService.updateOutline).toHaveBeenCalledWith('org-123', 'outline-123', {
        status: 'PENDING',
      });
    });

    it('should allow REJECTED status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue({
        ...mockOutline,
        status: 'REJECTED',
      });

      await controller.updateOutline(
        'org-123',
        'outline-123',
        { status: 'REJECTED' },
        mockRequest as ExpressRequest
      );

      expect(outlineService.updateOutline).toHaveBeenCalledWith('org-123', 'outline-123', {
        status: 'REJECTED',
      });
    });

    it('should allow REGENERATING status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.updateOutline as jest.Mock).mockResolvedValue({
        ...mockOutline,
        status: 'REGENERATING',
      });

      await controller.updateOutline(
        'org-123',
        'outline-123',
        { status: 'REGENERATING' },
        mockRequest as ExpressRequest
      );

      expect(outlineService.updateOutline).toHaveBeenCalledWith('org-123', 'outline-123', {
        status: 'REGENERATING',
      });
    });
  });

  describe('deleteOutline', () => {
    it('should delete outline successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.deleteOutline as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deleteOutline(
        'org-123',
        'outline-123',
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(outlineService.deleteOutline).toHaveBeenCalledWith('org-123', 'outline-123');
      expect(result).toEqual({ message: 'Outline deleted successfully' });
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.deleteOutline('org-123', 'outline-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(outlineService.deleteOutline).not.toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to delete outline');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (outlineService.deleteOutline as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.deleteOutline('org-123', 'outline-123', mockRequest as ExpressRequest)
      ).rejects.toThrow('Failed to delete outline');
    });
  });
});
