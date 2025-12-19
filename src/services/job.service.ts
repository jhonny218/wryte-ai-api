import { Job, JobStatus, JobType } from "../../generated/prisma/client";
import { prisma } from "../utils/prisma";

export class JobService {
  async createJob(
    userId: string,
    organizationId: string,
    type: JobType,
    input: any
  ): Promise<Job> {
    return prisma.job.create({
      data: {
        userId,
        organizationId,
        type,
        status: JobStatus.PENDING,
        input,
      },
    });
  }

  async updateJobStatus(jobId: string, status: JobStatus, result?: any, error?: string) {
    const data: any = { status };
    if (result) data.result = result;
    if (error) data.error = error;

    if (status === JobStatus.PROCESSING) {
      data.startedAt = new Date();
    } else if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      data.completedAt = new Date();
    }

    return prisma.job.update({
      where: { id: jobId },
      data,
    });
  }
}

export const jobService = new JobService();
