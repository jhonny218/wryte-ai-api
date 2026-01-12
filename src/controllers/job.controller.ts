import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { jobService } from '../services/job.service';
import { titleGenerationQueue } from '../workers/queues';
import { JobType } from '../../generated/prisma/client';
import { titleGenerationSchema } from '../validators/title.validator';
import { userService } from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';

export class JobController {
  // POST /api/v1/jobs/title
  async createTitleGenerationJob(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('Auth Debug:', getAuth(req));
      // 1. Validate Input
      const validatedData = titleGenerationSchema.parse(req.body);

      // 2. Auth & User Resolution
      const { userId: clerkId } = getAuth(req);
      if (!clerkId) throw new UnauthorizedError('Not authenticated');

      const user = await userService.findByClerkId(clerkId);
      if (!user) throw new UnauthorizedError('User not found');

      const { organizationId } = validatedData;

      // 3. Create Job Record in DB
      const job = await jobService.createJob(
        user.id, // Use DB User ID
        organizationId,
        JobType.GENERATE_TITLES,
        validatedData
      );

      // 4. Add to BullMQ
      // We pass the DB Job ID so the worker can update it
      await titleGenerationQueue.add('generate-titles', {
        ...validatedData,
        userId: user.id,
        organizationId,
        jobId: job.id
      }, {
        jobId: job.id // Use same ID for deduplication if needed
      });

      res.status(202).json({
        status: 'accepted',
        data: job
      });

    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/jobs/:id
  // Endpoint to poll job status
  async getJobStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      
      // Fetch job status from DB
      const job = await jobService.getJobStatus(jobId!);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Return job status
      return res.status(200).json({ data: job });
    } catch (error) {
      next(error);
    }
  }
}

export const jobController = new JobController();
