import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { QueueName, TitleGenerationJobProtocol } from '../types/jobs';
import { promptService } from '../services/prompt.service';
import { geminiService } from '../services/gemini.service';
import { parserService } from '../services/parser.service';
import { titleService } from '../services/title.service';
import { jobService } from '../services/job.service';
import { JobStatus, JobType } from '../../generated/prisma/client';

export const titleGenerationWorker = new Worker<TitleGenerationJobProtocol>(
  QueueName.TITLE_GENERATION,
  async (job: Job<TitleGenerationJobProtocol>) => {
    const { userId, organizationId, dates } = job.data;
    const dbJobIdFromPayload = (job.data as any).jobId;

    if (dbJobIdFromPayload) {
      await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.PROCESSING);
    }

    try {
      // 2. Fetch Content Settings
      const settings = await titleService.getContentSettings(organizationId);
      if (!settings) throw new Error("Content settings not found.");

      // 3. Logic: Generate X titles where X = dates.length
      const titlesToGenerate = dates.length;
      if (titlesToGenerate === 0) throw new Error("No dates provided.");

      const prompt = promptService.generateTitlePrompt(settings, titlesToGenerate);
      console.log("Prompt:", prompt);

      // 4. Call Gemini
      const gptResponse = await geminiService.generateCompletion(prompt);
      console.log("GPT Response:", gptResponse);

      // 5. Parse Response
      const titles = parserService.parseTitleResponse(gptResponse);
      console.log("Parsed Titles:", titles);

      // 6. Save to DB - assigning each title a specific date from the list
      // Note: titles.length might differ from dates.length if AI hallucinates count.
      // We'll iterate up to the minimum of both.

      const count = Math.min(titles.length, dates.length);
      const titlesToSave: { title: string; date: Date }[] = [];

      for (let i = 0; i < count; i++) {
        const titleText = titles[i];
        const dateString = dates[i];
        if (titleText && dateString) {
          titlesToSave.push({
            title: titleText,
            date: new Date(dateString)
          });
        }
      }

      // We need to update titleService to handle saving individual titles with specific dates
      // OR we just loop here. `titleService.createTitles` currently takes `titles array` and `ONE date`.
      // We should probably loop and create them, or update `createTitles` to accept objects.

      // Let's rely on a new method or modifications. 
      // For now, I will modify `createTitles` call in `title.service.ts` next to handle this structure 
      // OR just call `create` individually here? Batch insert is better.
      // Actually, I'll update the worker first, then I MUST update the service.

      await titleService.createTitlesWithDates(organizationId, titlesToSave);

      // 7. Update Job Status
      if (dbJobIdFromPayload) {
        await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.COMPLETED, { count: titlesToSave.length, titles: titlesToSave });
      }

      return { success: true, count: titlesToSave.length };

    } catch (error: any) {
      console.error('Title Generation Worker Error:', error);
      if (dbJobIdFromPayload) {
        await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.FAILED, undefined, error.message);
      }
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 jobs at a time
    // Dramatically reduce polling frequency for Upstash free tier
    lockDuration: 30000, // 30 seconds - how long to hold job lock
    lockRenewTime: 15000, // 15 seconds - renew lock interval
    stalledInterval: 30000, // Check for stalled jobs every 30s
    maxStalledCount: 1, // Max times a job can be recovered from stalled state
    autorun: true,
  }
);
