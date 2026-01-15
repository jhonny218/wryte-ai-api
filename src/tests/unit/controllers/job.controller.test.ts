import { Request, Response, NextFunction } from 'express';
import { jobController } from '../../../controllers/job.controller';
import { jobService } from '../../../services/job.service';
import { userService } from '../../../services/user.service';
import { getAuth } from '@clerk/express';
import { UnauthorizedError } from '../../../utils/errors';
import { titleGenerationQueue, outlineGenerationQueue, blogGenerationQueue } from '../../../workers/queues';
import { titleGenerationSchema } from '../../../validators/title.validator';
import { generateOutlineSchema } from '../../../validators/outline.validator';
import { JobType } from '../../../../generated/prisma/client';

jest.mock('../../../services/job.service');
jest.mock('../../../services/user.service');
jest.mock('@clerk/express');
jest.mock('../../../workers/queues');
jest.mock('../../../validators/title.validator');
jest.mock('../../../validators/outline.validator');

describe('JobController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
    name: 'John Doe',
  };

  const mockJob = {
    id: 'job-123',
    userId: 'user-123',
    organizationId: 'org-123',
    type: JobType.GENERATE_TITLES,
    status: 'PENDING',
    data: {},
    result: null,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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

    // Mock queue add methods
    (titleGenerationQueue.add as jest.Mock) = jest.fn().mockResolvedValue({});
    (outlineGenerationQueue.add as jest.Mock) = jest.fn().mockResolvedValue({});
    (blogGenerationQueue.add as jest.Mock) = jest.fn().mockResolvedValue({});
  });

  describe('createTitleGenerationJob', () => {
    it('should create title generation job successfully', async () => {
      const requestData = {
        dates: ['2024-01-01', '2024-01-02'],
        organizationId: 'org-123',
      };

      mockReq.body = requestData;

      (titleGenerationSchema.parse as jest.Mock).mockReturnValue(requestData);
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockResolvedValue(mockJob);

      await jobController.createTitleGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(titleGenerationSchema.parse).toHaveBeenCalledWith(requestData);
      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(jobService.createJob).toHaveBeenCalledWith(
        'user-123',
        'org-123',
        JobType.GENERATE_TITLES,
        requestData
      );
      expect(titleGenerationQueue.add).toHaveBeenCalledWith(
        'generate-titles',
        {
          ...requestData,
          userId: 'user-123',
          organizationId: 'org-123',
          jobId: 'job-123',
        },
        { jobId: 'job-123' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'accepted',
        data: mockJob,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not authenticated', async () => {
      const requestData = {
        dates: ['2024-01-01'],
        organizationId: 'org-123',
      };

      mockReq.body = requestData;

      (titleGenerationSchema.parse as jest.Mock).mockReturnValue(requestData);
      (getAuth as jest.Mock).mockReturnValue({ userId: null });

      await jobController.createTitleGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).not.toHaveBeenCalled();
      expect(jobService.createJob).not.toHaveBeenCalled();
      expect(titleGenerationQueue.add).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const requestData = {
        dates: ['2024-01-01'],
        organizationId: 'org-123',
      };

      mockReq.body = requestData;

      (titleGenerationSchema.parse as jest.Mock).mockReturnValue(requestData);
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await jobController.createTitleGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(jobService.createJob).not.toHaveBeenCalled();
      expect(titleGenerationQueue.add).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle validation errors and call next', async () => {
      const error = new Error('Validation error');
      mockReq.body = { dates: [], organizationId: 'org-123' };

      (titleGenerationSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await jobController.createTitleGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jobService.createJob).not.toHaveBeenCalled();
      expect(titleGenerationQueue.add).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle errors from job service and call next', async () => {
      const error = new Error('Database error');
      const requestData = {
        dates: ['2024-01-01'],
        organizationId: 'org-123',
      };

      mockReq.body = requestData;

      (titleGenerationSchema.parse as jest.Mock).mockReturnValue(requestData);
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockRejectedValue(error);

      await jobController.createTitleGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(titleGenerationQueue.add).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle errors from queue and call next', async () => {
      const error = new Error('Queue error');
      const requestData = {
        dates: ['2024-01-01'],
        organizationId: 'org-123',
      };

      mockReq.body = requestData;

      (titleGenerationSchema.parse as jest.Mock).mockReturnValue(requestData);
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockResolvedValue(mockJob);
      (titleGenerationQueue.add as jest.Mock).mockRejectedValue(error);

      await jobController.createTitleGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('createOutlineGenerationJob', () => {
    it('should create outline generation job successfully', async () => {
      const requestData = {
        blogTitleId: 'title-123',
        additionalInstructions: 'Make it detailed',
      };

      const outlineJob = {
        ...mockJob,
        id: 'job-456',
        type: JobType.GENERATE_OUTLINE,
        organizationId: null,
      };

      mockReq.body = requestData;

      (generateOutlineSchema.parse as jest.Mock).mockReturnValue(requestData);
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockResolvedValue(outlineJob);

      await jobController.createOutlineGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(generateOutlineSchema.parse).toHaveBeenCalledWith(requestData);
      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(jobService.createJob).toHaveBeenCalledWith(
        'user-123',
        null,
        JobType.GENERATE_OUTLINE,
        requestData
      );
      expect(outlineGenerationQueue.add).toHaveBeenCalledWith(
        'generate-outline',
        {
          ...requestData,
          userId: 'user-123',
          jobId: 'job-456',
        },
        { jobId: 'job-456' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'accepted',
        data: outlineJob,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should create outline generation job without additional instructions', async () => {
      const requestData = {
        blogTitleId: 'title-123',
      };

      const outlineJob = {
        ...mockJob,
        id: 'job-456',
        type: JobType.GENERATE_OUTLINE,
        organizationId: null,
      };

      mockReq.body = requestData;

      (generateOutlineSchema.parse as jest.Mock).mockReturnValue(requestData);
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockResolvedValue(outlineJob);

      await jobController.createOutlineGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(jobService.createJob).toHaveBeenCalledWith(
        'user-123',
        null,
        JobType.GENERATE_OUTLINE,
        requestData
      );
      expect(outlineGenerationQueue.add).toHaveBeenCalledWith(
        'generate-outline',
        {
          ...requestData,
          userId: 'user-123',
          jobId: 'job-456',
        },
        { jobId: 'job-456' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(202);
    });

    it('should throw UnauthorizedError when user not authenticated', async () => {
      const requestData = {
        blogTitleId: 'title-123',
      };

      mockReq.body = requestData;

      (generateOutlineSchema.parse as jest.Mock).mockReturnValue(requestData);
      (getAuth as jest.Mock).mockReturnValue({ userId: null });

      await jobController.createOutlineGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).not.toHaveBeenCalled();
      expect(jobService.createJob).not.toHaveBeenCalled();
      expect(outlineGenerationQueue.add).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const requestData = {
        blogTitleId: 'title-123',
      };

      mockReq.body = requestData;

      (generateOutlineSchema.parse as jest.Mock).mockReturnValue(requestData);
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await jobController.createOutlineGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(jobService.createJob).not.toHaveBeenCalled();
      expect(outlineGenerationQueue.add).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle validation errors and call next', async () => {
      const error = new Error('Validation error');
      mockReq.body = { blogTitleId: '' };

      (generateOutlineSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await jobController.createOutlineGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jobService.createJob).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      const requestData = {
        blogTitleId: 'title-123',
      };

      mockReq.body = requestData;

      (generateOutlineSchema.parse as jest.Mock).mockReturnValue(requestData);
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockRejectedValue(error);

      await jobController.createOutlineGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createBlogGenerationJob', () => {
    it('should create blog generation job successfully', async () => {
      const requestData = {
        blogOutlineId: 'outline-123',
        additionalInstructions: 'Make it engaging',
      };

      const blogJob = {
        ...mockJob,
        id: 'job-789',
        type: JobType.GENERATE_BLOG,
        organizationId: null,
      };

      mockReq.body = requestData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockResolvedValue(blogJob);

      await jobController.createBlogGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(jobService.createJob).toHaveBeenCalledWith(
        'user-123',
        null,
        JobType.GENERATE_BLOG,
        {
          blogOutlineId: 'outline-123',
          additionalInstructions: 'Make it engaging',
        }
      );
      expect(blogGenerationQueue.add).toHaveBeenCalledWith(
        'generate-blog',
        {
          blogOutlineId: 'outline-123',
          additionalInstructions: 'Make it engaging',
          userId: 'user-123',
          jobId: 'job-789',
        },
        { jobId: 'job-789' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'accepted',
        data: blogJob,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should create blog generation job without additional instructions', async () => {
      const requestData = {
        blogOutlineId: 'outline-123',
      };

      const blogJob = {
        ...mockJob,
        id: 'job-789',
        type: JobType.GENERATE_BLOG,
        organizationId: null,
      };

      mockReq.body = requestData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockResolvedValue(blogJob);

      await jobController.createBlogGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(jobService.createJob).toHaveBeenCalledWith(
        'user-123',
        null,
        JobType.GENERATE_BLOG,
        {
          blogOutlineId: 'outline-123',
          additionalInstructions: undefined,
        }
      );
      expect(blogGenerationQueue.add).toHaveBeenCalledWith(
        'generate-blog',
        {
          blogOutlineId: 'outline-123',
          additionalInstructions: undefined,
          userId: 'user-123',
          jobId: 'job-789',
        },
        { jobId: 'job-789' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(202);
    });

    it('should throw UnauthorizedError when blogOutlineId is missing', async () => {
      mockReq.body = {};

      await jobController.createBlogGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).not.toHaveBeenCalled();
      expect(jobService.createJob).not.toHaveBeenCalled();
      expect(blogGenerationQueue.add).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should throw UnauthorizedError when blogOutlineId is not a string', async () => {
      mockReq.body = { blogOutlineId: 123 };

      await jobController.createBlogGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).not.toHaveBeenCalled();
      expect(jobService.createJob).not.toHaveBeenCalled();
      expect(blogGenerationQueue.add).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should throw UnauthorizedError when user not authenticated', async () => {
      mockReq.body = { blogOutlineId: 'outline-123' };

      (getAuth as jest.Mock).mockReturnValue({ userId: null });

      await jobController.createBlogGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).not.toHaveBeenCalled();
      expect(jobService.createJob).not.toHaveBeenCalled();
      expect(blogGenerationQueue.add).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should throw UnauthorizedError when user not found', async () => {
      mockReq.body = { blogOutlineId: 'outline-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await jobController.createBlogGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(jobService.createJob).not.toHaveBeenCalled();
      expect(blogGenerationQueue.add).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.body = { blogOutlineId: 'outline-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (jobService.createJob as jest.Mock).mockRejectedValue(error);

      await jobController.createBlogGenerationJob(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getJobStatus', () => {
    it('should get job status successfully', async () => {
      mockReq.params = { jobId: 'job-123' };

      (jobService.getJobStatus as jest.Mock).mockResolvedValue(mockJob);

      await jobController.getJobStatus(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(jobService.getJobStatus).toHaveBeenCalledWith('job-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockJob });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return completed job with result', async () => {
      const completedJob = {
        ...mockJob,
        status: 'COMPLETED',
        result: { titles: ['Title 1', 'Title 2'] },
      };

      mockReq.params = { jobId: 'job-123' };

      (jobService.getJobStatus as jest.Mock).mockResolvedValue(completedJob);

      await jobController.getJobStatus(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(jobService.getJobStatus).toHaveBeenCalledWith('job-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: completedJob });
    });

    it('should return failed job with error', async () => {
      const failedJob = {
        ...mockJob,
        status: 'FAILED',
        error: 'Job failed due to API error',
      };

      mockReq.params = { jobId: 'job-123' };

      (jobService.getJobStatus as jest.Mock).mockResolvedValue(failedJob);

      await jobController.getJobStatus(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(jobService.getJobStatus).toHaveBeenCalledWith('job-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: failedJob });
    });

    it('should return 404 when job not found', async () => {
      mockReq.params = { jobId: 'job-123' };

      (jobService.getJobStatus as jest.Mock).mockResolvedValue(null);

      await jobController.getJobStatus(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(jobService.getJobStatus).toHaveBeenCalledWith('job-123');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Job not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { jobId: 'job-123' };

      (jobService.getJobStatus as jest.Mock).mockRejectedValue(error);

      await jobController.getJobStatus(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
