import { JobsController } from '../../../controllers/jobs.controller.tsoa';
import { jobService } from '../../../services/job.service';
import { userService } from '../../../services/user.service';
import { getUserId } from '../../../utils/auth';
import { UnauthorizedError } from '../../../utils/errors';
import type { Request as ExpressRequest } from 'express';

jest.mock('../../../services/job.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/auth');

describe('JobsController (TSOA)', () => {
  let controller: JobsController;
  let mockRequest: Partial<ExpressRequest>;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
  };

  const mockJob = {
    id: 'job-123',
    userId: 'user-123',
    organizationId: 'org-123',
    type: 'GENERATE_TITLES',
    status: 'PENDING',
    payload: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    controller = new JobsController();
    mockRequest = {};
    jest.clearAllMocks();
  });

  describe('createTitleGenerationJob', () => {
    const requestBody = {
      organizationId: 'org-123',
      dates: ['2025-02-15', '2025-02-16'],
    };

    it('should create title generation job successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockResolvedValue(mockJob);

      const result = await controller.createTitleGenerationJob(
        requestBody,
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(jobService.createJob).toHaveBeenCalledWith(
        'user-123',
        'org-123',
        'GENERATE_TITLES',
        requestBody
      );
      expect(result.status).toBe('accepted');
      expect(result.data).toEqual(mockJob);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.createTitleGenerationJob(requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(jobService.createJob).not.toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to create job');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.createTitleGenerationJob(requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow('Failed to create job');
    });
  });

  describe('createOutlineGenerationJob', () => {
    const requestBody = {
      titleId: 'title-123',
      additionalContext: 'Some context',
    };

    const outlineJob = {
      ...mockJob,
      type: 'GENERATE_OUTLINE',
      organizationId: null,
    };

    it('should create outline generation job successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockResolvedValue(outlineJob);

      const result = await controller.createOutlineGenerationJob(
        requestBody,
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(jobService.createJob).toHaveBeenCalledWith(
        'user-123',
        null,
        'GENERATE_OUTLINE',
        requestBody
      );
      expect(result.status).toBe('accepted');
      expect(result.data).toEqual(outlineJob);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.createOutlineGenerationJob(requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(jobService.createJob).not.toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to create outline job');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.createOutlineGenerationJob(requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow('Failed to create outline job');
    });
  });

  describe('createBlogGenerationJob', () => {
    const requestBody = {
      outlineId: 'outline-123',
      additionalInstructions: 'Make it engaging',
    };

    const blogJob = {
      ...mockJob,
      type: 'GENERATE_BLOG',
      organizationId: null,
    };

    it('should create blog generation job successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockResolvedValue(blogJob);

      const result = await controller.createBlogGenerationJob(
        requestBody,
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(jobService.createJob).toHaveBeenCalledWith(
        'user-123',
        null,
        'GENERATE_BLOG',
        requestBody
      );
      expect(result.status).toBe('accepted');
      expect(result.data).toEqual(blogJob);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.createBlogGenerationJob(requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(jobService.createJob).not.toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to create blog job');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.createBlogGenerationJob(requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow('Failed to create blog job');
    });
  });
});
