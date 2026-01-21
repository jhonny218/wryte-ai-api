import { Worker, Job } from "bullmq";
import { connection } from "../config/redis";
import { QueueName, TitleGenerationJobProtocol } from "../types/jobs";
import { promptService } from "../services/ai/prompt.service";
import { geminiService } from "../services/ai/gemini.service";
import { parserService } from "../services/ai/parser.service";
import { titleService } from "../services/title.service";
import { jobService } from "../services/job.service";
import { JobStatus } from "../../generated/prisma/client";
import { logger } from "../utils/logger";

export const titleGenerationWorker = new Worker<TitleGenerationJobProtocol>(
  QueueName.TITLE_GENERATION,
  async (job: Job<TitleGenerationJobProtocol>) => {
    const { userId, organizationId, dates } = job.data;
    const dbJobIdFromPayload = (job.data as any).jobId;
    const startTime = Date.now();

    const jobLogger = logger.child({
      worker: "title-generation",
      jobId: job.id,
      dbJobId: dbJobIdFromPayload,
      userId,
      organizationId,
    });

    jobLogger.info("Job started", { event: "worker_job_start", dateCount: dates.length });

    if (dbJobIdFromPayload) {
      await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.PROCESSING);
    }

    try {
      // 1. Fetch Content Settings
      jobLogger.debug("Fetching content settings");
      const settings = await titleService.getContentSettings(organizationId);
      if (!settings) throw new Error("Content settings not found.");

      // 2. Logic: Generate X titles where X = dates.length
      const titlesToGenerate = dates.length;
      if (titlesToGenerate === 0) throw new Error("No dates provided.");

      const prompt = promptService.generateTitlePrompt(settings, titlesToGenerate);
      jobLogger.debug("Prompt generated", { promptLength: prompt.length });

      // 3. Call Gemini
      jobLogger.debug("Calling Gemini API");
      const gptResponse = await geminiService.generateCompletion(prompt);

      // 4. Parse Response
      const titles = parserService.parseTitleResponse(gptResponse);
      jobLogger.debug("Response parsed", { titleCount: titles.length });

      // 5. Save to DB
      const count = Math.min(titles.length, dates.length);
      const titlesToSave: { title: string; date: Date }[] = [];

      for (let i = 0; i < count; i++) {
        const titleText = titles[i];
        const dateString = dates[i];
        if (titleText && dateString) {
          titlesToSave.push({
            title: titleText,
            date: new Date(dateString),
          });
        }
      }

      await titleService.createTitlesWithDates(organizationId, titlesToSave);

      // 6. Update Job Status
      if (dbJobIdFromPayload) {
        await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.COMPLETED, {
          count: titlesToSave.length,
          titles: titlesToSave,
        });
      }

      const duration = Date.now() - startTime;
      jobLogger.info("Job completed", {
        event: "worker_job_complete",
        duration,
        titlesCreated: titlesToSave.length,
      });

      return { success: true, count: titlesToSave.length };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      jobLogger.error("Job failed", {
        event: "worker_job_error",
        duration,
        error: error.message,
        stack: error.stack,
      });

      if (dbJobIdFromPayload) {
        await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.FAILED, undefined, error.message);
      }
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    lockDuration: 30000,
    lockRenewTime: 15000,
    stalledInterval: 30000,
    maxStalledCount: 1,
    autorun: true,
  }
);
