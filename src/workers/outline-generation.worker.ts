import { Worker, Job } from "bullmq";
import { connection } from "../config/redis";
import { QueueName, OutlineGenerationJobProtocol } from "../types/jobs";
import { promptService } from "../services/ai/prompt.service";
import { geminiService } from "../services/ai/gemini.service";
import { parserService } from "../services/ai/parser.service";
import { outlineService } from "../services/outline.service";
import { titleService } from "../services/title.service";
import { jobService } from "../services/job.service";
import { JobStatus } from "../../generated/prisma/client";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";

export const outlineGenerationWorker = new Worker<OutlineGenerationJobProtocol>(
  QueueName.OUTLINE_GENERATION,
  async (job: Job<OutlineGenerationJobProtocol>) => {
    const { userId, blogTitleId, additionalInstructions } = job.data;
    const dbJobIdFromPayload = (job.data as any).jobId;
    const startTime = Date.now();

    const jobLogger = logger.child({
      worker: "outline-generation",
      jobId: job.id,
      dbJobId: dbJobIdFromPayload,
      userId,
      blogTitleId,
    });

    jobLogger.info("Job started", { event: "worker_job_start" });

    if (dbJobIdFromPayload) {
      await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.PROCESSING);
    }

    try {
      // 1. Fetch the blog title
      jobLogger.debug("Fetching blog title");
      const blogTitle = await prisma.blogTitle.findUnique({
        where: { id: blogTitleId },
      });

      if (!blogTitle) {
        throw new Error("Blog title not found");
      }

      const organizationId = blogTitle.organizationId;
      jobLogger.debug("Blog title fetched", { organizationId, title: blogTitle.title });

      // 2. Fetch content settings
      jobLogger.debug("Fetching content settings");
      const settings = await titleService.getContentSettings(organizationId);
      if (!settings) {
        throw new Error("Content settings not found");
      }

      // 3. Generate prompt
      const structureHint = additionalInstructions || undefined;
      const prompt = promptService.generateOutlinePrompt(settings, blogTitle.title, structureHint);
      jobLogger.debug("Prompt generated", { promptLength: prompt.length });

      // 4. Call Gemini
      jobLogger.debug("Calling Gemini API");
      const aiResponse = await geminiService.generateCompletion(prompt);

      // 5. Parse response
      const parsedOutline = parserService.parseOutlineResponse(aiResponse);
      jobLogger.debug("Response parsed", { hasOutline: !!parsedOutline });

      if (!parsedOutline) {
        throw new Error("Failed to parse outline response from AI");
      }

      // 6. Save outline to database
      jobLogger.debug("Saving outline to database");
      const outline = await outlineService.createOutline(blogTitleId, {
        structure: parsedOutline,
        seoKeywords: parsedOutline.seoKeywords || [],
        metaDescription: parsedOutline.metaDescription || "",
        suggestedImages: parsedOutline.suggestedImages || [],
      });

      // 7. Update job status
      if (dbJobIdFromPayload) {
        await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.COMPLETED, {
          outlineId: outline.id,
          structure: parsedOutline,
        });
      }

      const duration = Date.now() - startTime;
      jobLogger.info("Job completed", {
        event: "worker_job_complete",
        duration,
        outlineId: outline.id,
      });

      return { success: true, outlineId: outline.id };
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
