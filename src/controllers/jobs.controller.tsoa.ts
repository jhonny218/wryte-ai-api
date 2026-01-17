import {
  Route,
  Post,
  Body,
  Tags,
  Security,
  Response,
  SuccessResponse,
  Request,
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';
import {
  CreateTitleJobRequest,
  CreateOutlineJobRequest,
  CreateBlogJobRequest,
  JobResponse,
  ErrorResponse,
} from '../types/api.types';
import { jobService } from '../services/job.service';
import { userService } from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';
import { getUserId } from '../utils/auth';

@Route('jobs')
@Tags('Jobs')
@Security('clerk')
export class JobsController {
  /**
   * Create a job to generate blog titles
   * @summary Generate blog titles
   * @param requestBody Title generation parameters
   * @returns Job created and queued for processing
   */
  @Post('title')
  @SuccessResponse(202, 'Job created successfully')
  @Response<ErrorResponse>(400, 'Invalid request')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async createTitleGenerationJob(
    @Body() requestBody: CreateTitleJobRequest,
    @Request() request: ExpressRequest
  ): Promise<JobResponse> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    const job = await jobService.createJob(
      user.id,
      requestBody.organizationId,
      'GENERATE_TITLES' as any,
      requestBody
    );

    return {
      status: 'accepted',
      data: job as any,
    };
  }

  /**
   * Create a job to generate a blog outline
   * @summary Generate blog outline
   * @param requestBody Outline generation parameters
   * @returns Job created and queued for processing
   */
  @Post('outline')
  @SuccessResponse(202, 'Job created successfully')
  @Response<ErrorResponse>(400, 'Invalid request')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async createOutlineGenerationJob(
    @Body() requestBody: CreateOutlineJobRequest,
    @Request() request: ExpressRequest
  ): Promise<JobResponse> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    const job = await jobService.createJob(
      user.id,
      null,
      'GENERATE_OUTLINE' as any,
      requestBody
    );

    return {
      status: 'accepted',
      data: job as any,
    };
  }

  /**
   * Create a job to generate full blog content
   * @summary Generate blog content
   * @param requestBody Blog generation parameters
   * @returns Job created and queued for processing
   */
  @Post('blog')
  @SuccessResponse(202, 'Job created successfully')
  @Response<ErrorResponse>(400, 'Invalid request')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async createBlogGenerationJob(
    @Body() requestBody: CreateBlogJobRequest,
    @Request() request: ExpressRequest
  ): Promise<JobResponse> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    const job = await jobService.createJob(
      user.id,
      null,
      'GENERATE_BLOG' as any,
      requestBody
    );

    return {
      status: 'accepted',
      data: job as any,
    };
  }
}
