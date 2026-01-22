import { TitlesController } from '../../../controllers/titles.controller.tsoa';
import { titleService } from '../../../services/title.service';
import { userService } from '../../../services/user.service';
import { getUserId } from '../../../utils/auth';
import { UnauthorizedError, BadRequestError } from '../../../utils/errors';
import type { Request as ExpressRequest } from 'express';

jest.mock('../../../services/title.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/auth');

describe('TitlesController (TSOA)', () => {
  let controller: TitlesController;
  let mockRequest: Partial<ExpressRequest>;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
  };

  const mockTitle = {
    id: 'title-123',
    organizationId: 'org-123',
    title: 'Test Blog Title',
    status: 'PENDING',
    scheduledDate: new Date('2025-02-15'),
    aiGenerationContext: { prompt: 'test' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    controller = new TitlesController();
    mockRequest = {};
    jest.clearAllMocks();
  });

  describe('getTitles', () => {
    it('should get all titles for organization', async () => {
      const mockTitles = [mockTitle];
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getTitles as jest.Mock).mockResolvedValue(mockTitles);

      const result = await controller.getTitles('org-123', mockRequest as ExpressRequest);

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.getTitles).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockTitles);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.getTitles('org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(titleService.getTitles).not.toHaveBeenCalled();
    });

    it('should return empty array when no titles found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getTitles as jest.Mock).mockResolvedValue([]);

      const result = await controller.getTitles('org-123', mockRequest as ExpressRequest);

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getTitles as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.getTitles('org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateTitle', () => {
    it('should update title successfully', async () => {
      const updateBody = {
        title: 'Updated Title',
        status: 'APPROVED' as const,
      };
      const updatedTitle = { ...mockTitle, ...updateBody };

      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue(updatedTitle);

      const result = await controller.updateTitle(
        'org-123',
        'title-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.updateTitle).toHaveBeenCalledWith('org-123', 'title-123', {
        title: 'Updated Title',
        status: 'APPROVED',
      });
      expect(result).toEqual(updatedTitle);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.updateTitle(
          'org-123',
          'title-123',
          { title: 'New Title' },
          mockRequest as ExpressRequest
        )
      ).rejects.toThrow(UnauthorizedError);

      expect(titleService.updateTitle).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError for invalid status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        controller.updateTitle(
          'org-123',
          'title-123',
          { status: 'INVALID_STATUS' as any },
          mockRequest as ExpressRequest
        )
      ).rejects.toThrow(BadRequestError);

      expect(titleService.updateTitle).not.toHaveBeenCalled();
    });

    it('should update with valid scheduledDate', async () => {
      const scheduledDate = '2025-03-15T10:00:00Z';
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue({
        ...mockTitle,
        scheduledDate: new Date(scheduledDate),
      });

      await controller.updateTitle(
        'org-123',
        'title-123',
        { scheduledDate },
        mockRequest as ExpressRequest
      );

      expect(titleService.updateTitle).toHaveBeenCalledWith('org-123', 'title-123', {
        scheduledDate: new Date(scheduledDate),
      });
    });

    it('should allow null scheduledDate', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue({
        ...mockTitle,
        scheduledDate: null,
      });

      await controller.updateTitle(
        'org-123',
        'title-123',
        { scheduledDate: null },
        mockRequest as ExpressRequest
      );

      expect(titleService.updateTitle).toHaveBeenCalledWith('org-123', 'title-123', {
        scheduledDate: null,
      });
    });

    it('should allow empty string scheduledDate (converts to null)', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue({
        ...mockTitle,
        scheduledDate: null,
      });

      await controller.updateTitle(
        'org-123',
        'title-123',
        { scheduledDate: '' },
        mockRequest as ExpressRequest
      );

      expect(titleService.updateTitle).toHaveBeenCalledWith('org-123', 'title-123', {
        scheduledDate: null,
      });
    });

    it('should throw BadRequestError for invalid scheduledDate', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        controller.updateTitle(
          'org-123',
          'title-123',
          { scheduledDate: 'not-a-valid-date' },
          mockRequest as ExpressRequest
        )
      ).rejects.toThrow(BadRequestError);

      expect(titleService.updateTitle).not.toHaveBeenCalled();
    });

    it('should update aiGenerationContext', async () => {
      const aiGenerationContext = { prompt: 'updated prompt', model: 'gpt-4' };
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue({
        ...mockTitle,
        aiGenerationContext,
      });

      await controller.updateTitle(
        'org-123',
        'title-123',
        { aiGenerationContext },
        mockRequest as ExpressRequest
      );

      expect(titleService.updateTitle).toHaveBeenCalledWith('org-123', 'title-123', {
        aiGenerationContext,
      });
    });

    it('should allow PENDING status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue(mockTitle);

      await controller.updateTitle(
        'org-123',
        'title-123',
        { status: 'PENDING' },
        mockRequest as ExpressRequest
      );

      expect(titleService.updateTitle).toHaveBeenCalledWith('org-123', 'title-123', {
        status: 'PENDING',
      });
    });

    it('should allow REJECTED status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue({
        ...mockTitle,
        status: 'REJECTED',
      });

      await controller.updateTitle(
        'org-123',
        'title-123',
        { status: 'REJECTED' },
        mockRequest as ExpressRequest
      );

      expect(titleService.updateTitle).toHaveBeenCalledWith('org-123', 'title-123', {
        status: 'REJECTED',
      });
    });

    it('should allow REGENERATING status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue({
        ...mockTitle,
        status: 'REGENERATING',
      });

      await controller.updateTitle(
        'org-123',
        'title-123',
        { status: 'REGENERATING' },
        mockRequest as ExpressRequest
      );

      expect(titleService.updateTitle).toHaveBeenCalledWith('org-123', 'title-123', {
        status: 'REGENERATING',
      });
    });
  });

  describe('deleteTitle', () => {
    it('should delete title successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.deleteTitle as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deleteTitle(
        'org-123',
        'title-123',
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.deleteTitle).toHaveBeenCalledWith('org-123', 'title-123');
      expect(result).toEqual({ message: 'Title deleted successfully' });
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.deleteTitle('org-123', 'title-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(titleService.deleteTitle).not.toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to delete title');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.deleteTitle as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.deleteTitle('org-123', 'title-123', mockRequest as ExpressRequest)
      ).rejects.toThrow('Failed to delete title');
    });
  });
});
