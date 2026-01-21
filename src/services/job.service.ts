import { Job, JobStatus, JobType } from "../../generated/prisma/client";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";

export class JobService {
  async createJob(
    userId: string,
    organizationId: string | null,
    type: JobType,
    input: any
  ): Promise<Job> {
    const job = await prisma.job.create({
      data: {
        userId,
        organizationId,
        type,
        status: JobStatus.PENDING,
        input,
      },
    });

    logger.info("Job created", {
      event: "job_created",
      jobId: job.id,
      userId,
      organizationId,
      type,
    });

    return job;
  }

  async getJobStatus(jobId: string): Promise<Job | null> {
    return prisma.job.findUnique({
      where: { id: jobId },
    });
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: any,
    error?: string
  ) {
    const data: any = { status };
    if (result) data.result = result;
    if (error) data.error = error;

    if (status === JobStatus.PROCESSING) {
      data.startedAt = new Date();
    } else if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      data.completedAt = new Date();
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data,
    });

    logger.info("Job status updated", {
      event: "job_status_updated",
      jobId,
      status,
      hasResult: !!result,
      hasError: !!error,
    });

    return job;
  }
}

export const jobService = new JobService();
