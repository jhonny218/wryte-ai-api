import { JobService } from '../../../services/job.service';
import { prisma } from '../../../utils/prisma';
import { JobStatus, JobType } from '../../../../generated/prisma/client';

jest.mock('../../../utils/prisma', () => ({
  prisma: {
    job: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('JobService', () => {
  let jobService: JobService;
  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';
  const mockJobId = 'job-123';

  beforeEach(() => {
    jobService = new JobService();
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a job with all parameters', async () => {
      const input = { data: 'test data' };
      const mockJob = {
        id: mockJobId,
        userId: mockUserId,
        organizationId: mockOrgId,
        type: JobType.GENERATE_TITLES,
        status: JobStatus.PENDING,
        input,
        result: null,
        error: null,
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
      };

      (prisma.job.create as jest.Mock).mockResolvedValue(mockJob);

      const result = await jobService.createJob(
        mockUserId,
        mockOrgId,
        JobType.GENERATE_TITLES,
        input
      );

      expect(prisma.job.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          organizationId: mockOrgId,
          type: JobType.GENERATE_TITLES,
          status: JobStatus.PENDING,
          input,
        },
      });
      expect(result).toEqual(mockJob);
    });

    it('should create a job with null organizationId', async () => {
      const input = { data: 'test data' };
      const mockJob = {
        id: mockJobId,
        userId: mockUserId,
        organizationId: null,
        type: JobType.GENERATE_OUTLINE,
        status: JobStatus.PENDING,
        input,
      };

      (prisma.job.create as jest.Mock).mockResolvedValue(mockJob);

      const result = await jobService.createJob(
        mockUserId,
        null,
        JobType.GENERATE_OUTLINE,
        input
      );

      expect(prisma.job.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          organizationId: null,
          type: JobType.GENERATE_OUTLINE,
          status: JobStatus.PENDING,
          input,
        },
      });
      expect(result).toEqual(mockJob);
    });
  });

  describe('getJobStatus', () => {
    it('should return job when found', async () => {
      const mockJob = {
        id: mockJobId,
        userId: mockUserId,
        organizationId: mockOrgId,
        type: JobType.GENERATE_BLOG,
        status: JobStatus.COMPLETED,
        input: {},
        result: { output: 'result data' },
        error: null,
      };

      (prisma.job.findUnique as jest.Mock).mockResolvedValue(mockJob);

      const result = await jobService.getJobStatus(mockJobId);

      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: mockJobId },
      });
      expect(result).toEqual(mockJob);
    });

    it('should return null when job not found', async () => {
      (prisma.job.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await jobService.getJobStatus('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateJobStatus', () => {
    it('should update job to PROCESSING status with startedAt', async () => {
      const mockUpdatedJob = {
        id: mockJobId,
        status: JobStatus.PROCESSING,
        startedAt: expect.any(Date),
      };

      (prisma.job.update as jest.Mock).mockResolvedValue(mockUpdatedJob);

      const result = await jobService.updateJobStatus(mockJobId, JobStatus.PROCESSING);

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          status: JobStatus.PROCESSING,
          startedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockUpdatedJob);
    });

    it('should update job to COMPLETED status with result and completedAt', async () => {
      const result = { output: 'completed data' };
      const mockUpdatedJob = {
        id: mockJobId,
        status: JobStatus.COMPLETED,
        result,
        completedAt: expect.any(Date),
      };

      (prisma.job.update as jest.Mock).mockResolvedValue(mockUpdatedJob);

      const updateResult = await jobService.updateJobStatus(
        mockJobId,
        JobStatus.COMPLETED,
        result
      );

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          status: JobStatus.COMPLETED,
          result,
          completedAt: expect.any(Date),
        },
      });
      expect(updateResult).toEqual(mockUpdatedJob);
    });

    it('should update job to FAILED status with error and completedAt', async () => {
      const error = 'Job failed due to error';
      const mockUpdatedJob = {
        id: mockJobId,
        status: JobStatus.FAILED,
        error,
        completedAt: expect.any(Date),
      };

      (prisma.job.update as jest.Mock).mockResolvedValue(mockUpdatedJob);

      const result = await jobService.updateJobStatus(
        mockJobId,
        JobStatus.FAILED,
        undefined,
        error
      );

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          status: JobStatus.FAILED,
          error,
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockUpdatedJob);
    });

    it('should update job status with both result and error', async () => {
      const result = { partial: 'data' };
      const error = 'Warning message';
      const mockUpdatedJob = {
        id: mockJobId,
        status: JobStatus.COMPLETED,
        result,
        error,
        completedAt: expect.any(Date),
      };

      (prisma.job.update as jest.Mock).mockResolvedValue(mockUpdatedJob);

      await jobService.updateJobStatus(mockJobId, JobStatus.COMPLETED, result, error);

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          status: JobStatus.COMPLETED,
          result,
          error,
          completedAt: expect.any(Date),
        },
      });
    });

    it('should update job to PENDING status without additional fields', async () => {
      const mockUpdatedJob = {
        id: mockJobId,
        status: JobStatus.PENDING,
      };

      (prisma.job.update as jest.Mock).mockResolvedValue(mockUpdatedJob);

      const result = await jobService.updateJobStatus(mockJobId, JobStatus.PENDING);

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          status: JobStatus.PENDING,
        },
      });
      expect(result).toEqual(mockUpdatedJob);
    });
  });
});
