import { Request, Response, NextFunction } from 'express';
import { titleController } from '../../../controllers/title.controller';
import { titleService } from '../../../services/title.service';
import { userService } from '../../../services/user.service';
import { successResponse } from '../../../utils/response';
import { getAuth } from '@clerk/express';
import { UnauthorizedError, BadRequestError } from '../../../utils/errors';

jest.mock('../../../services/title.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/response');
jest.mock('@clerk/express');

describe('TitleController', () => {
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

  describe('getTitles', () => {
    it('should get titles successfully', async () => {
      const orgId = 'org-123';
      const mockTitles = [
        {
          id: 'title-1',
          title: 'Test Title 1',
          organizationId: orgId,
          status: 'PENDING',
        },
        {
          id: 'title-2',
          title: 'Test Title 2',
          organizationId: orgId,
          status: 'APPROVED',
        },
      ];

      mockReq.params = { orgId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getTitles as jest.Mock).mockResolvedValue(mockTitles);

      await titleController.getTitles(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.getTitles).toHaveBeenCalledWith(orgId);
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockTitles);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const orgId = 'org-123';
      mockReq.params = { orgId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await titleController.getTitles(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.getTitles).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getTitles as jest.Mock).mockRejectedValue(error);

      await titleController.getTitles(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('updateTitle', () => {
    it('should update title successfully', async () => {
      const orgId = 'org-123';
      const titleId = 'title-123';
      const updateData = {
        title: 'Updated Title',
        status: 'APPROVED',
      };
      const mockUpdatedTitle = {
        id: titleId,
        ...updateData,
        organizationId: orgId,
      };

      mockReq.params = { orgId, titleId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue(mockUpdatedTitle);

      await titleController.updateTitle(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.updateTitle).toHaveBeenCalledWith(orgId, titleId, updateData);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedTitle,
        'Title updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update title with scheduledDate', async () => {
      const orgId = 'org-123';
      const titleId = 'title-123';
      const scheduledDate = '2025-12-31T10:00:00Z';
      const updateData = {
        title: 'Updated Title',
        scheduledDate,
      };
      const mockUpdatedTitle = {
        id: titleId,
        title: 'Updated Title',
        scheduledDate: new Date(scheduledDate),
        organizationId: orgId,
      };

      mockReq.params = { orgId, titleId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue(mockUpdatedTitle);

      await titleController.updateTitle(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(titleService.updateTitle).toHaveBeenCalledWith(
        orgId,
        titleId,
        expect.objectContaining({
          title: 'Updated Title',
          scheduledDate: expect.any(Date),
        })
      );
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedTitle,
        'Title updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update title with null scheduledDate', async () => {
      const orgId = 'org-123';
      const titleId = 'title-123';
      const updateData = {
        title: 'Updated Title',
        scheduledDate: null,
      };
      const mockUpdatedTitle = {
        id: titleId,
        title: 'Updated Title',
        scheduledDate: null,
        organizationId: orgId,
      };

      mockReq.params = { orgId, titleId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockResolvedValue(mockUpdatedTitle);

      await titleController.updateTitle(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(titleService.updateTitle).toHaveBeenCalledWith(
        orgId,
        titleId,
        expect.objectContaining({
          title: 'Updated Title',
          scheduledDate: null,
        })
      );
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedTitle,
        'Title updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError for invalid status', async () => {
      const orgId = 'org-123';
      const titleId = 'title-123';
      const updateData = {
        title: 'Updated Title',
        status: 'INVALID_STATUS',
      };

      mockReq.params = { orgId, titleId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await titleController.updateTitle(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(titleService.updateTitle).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError for invalid scheduledDate', async () => {
      const orgId = 'org-123';
      const titleId = 'title-123';
      const updateData = {
        title: 'Updated Title',
        scheduledDate: 'invalid-date',
      };

      mockReq.params = { orgId, titleId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await titleController.updateTitle(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(titleService.updateTitle).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const orgId = 'org-123';
      const titleId = 'title-123';
      mockReq.params = { orgId, titleId };
      mockReq.body = { title: 'Updated Title' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await titleController.updateTitle(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.updateTitle).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123', titleId: 'title-123' };
      mockReq.body = { title: 'Updated Title' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.updateTitle as jest.Mock).mockRejectedValue(error);

      await titleController.updateTitle(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('deleteTitle', () => {
    it('should delete title successfully', async () => {
      const orgId = 'org-123';
      const titleId = 'title-123';

      mockReq.params = { orgId, titleId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.deleteTitle as jest.Mock).mockResolvedValue(undefined);

      await titleController.deleteTitle(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.deleteTitle).toHaveBeenCalledWith(orgId, titleId);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        'Title deleted successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const orgId = 'org-123';
      const titleId = 'title-123';
      mockReq.params = { orgId, titleId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await titleController.deleteTitle(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.deleteTitle).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123', titleId: 'title-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.deleteTitle as jest.Mock).mockRejectedValue(error);

      await titleController.deleteTitle(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });
});
