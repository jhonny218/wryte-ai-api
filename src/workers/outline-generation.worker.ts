import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { QueueName, OutlineGenerationJobProtocol } from '../types/jobs';
import { promptService } from '../services/ai/prompt.service';
import { geminiService } from '../services/ai/gemini.service';
import { parserService } from '../services/ai/parser.service';
import { outlineService } from '../services/outline.service';
import { titleService } from '../services/title.service';
import { jobService } from '../services/job.service';
import { JobStatus } from '../../generated/prisma/client';
import { prisma } from '../utils/prisma';

export const outlineGenerationWorker = new Worker<OutlineGenerationJobProtocol>(
  QueueName.OUTLINE_GENERATION,
  async (job: Job<OutlineGenerationJobProtocol>) => {
    const { userId, organizationId, blogTitleId, additionalInstructions } = job.data;
    const dbJobIdFromPayload = (job.data as any).jobId;

    if (dbJobIdFromPayload) {
      await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.PROCESSING);
    }

    try {
      // 1. Fetch the blog title
      const blogTitle = await prisma.blogTitle.findUnique({
        where: { id: blogTitleId },
      });

      if (!blogTitle) {
        throw new Error('Blog title not found');
      }

      if (blogTitle.organizationId !== organizationId) {
        throw new Error('Blog title does not belong to this organization');
      }

      // 2. Fetch content settings
      const settings = await titleService.getContentSettings(organizationId);
      if (!settings) {
        throw new Error('Content settings not found');
      }

      // 3. Generate prompt
      const structureHint = additionalInstructions || undefined;
      const prompt = promptService.generateOutlinePrompt(settings, blogTitle.title, structureHint);
      console.log('Outline Prompt:', prompt);

      // 4. Call Gemini
      const aiResponse = await geminiService.generateCompletion(prompt);
      console.log('AI Response:', aiResponse);

      // 5. Parse response
      const parsedOutline = parserService.parseOutlineResponse(aiResponse);
      console.log('Parsed Outline:', parsedOutline);

      if (!parsedOutline) {
        throw new Error('Failed to parse outline response from AI');
      }

      // 6. Save outline to database
      const outline = await outlineService.createOutline(blogTitleId, {
        structure: parsedOutline,
        seoKeywords: parsedOutline.seoKeywords || [],
        metaDescription: parsedOutline.metaDescription || '',
        suggestedImages: parsedOutline.suggestedImages || [],
      });

      // 7. Update job status
      if (dbJobIdFromPayload) {
        await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.COMPLETED, {
          outlineId: outline.id,
          structure: parsedOutline,
        });
      }

      return { success: true, outlineId: outline.id };

    } catch (error: any) {
      console.error('Outline Generation Worker Error:', error);
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