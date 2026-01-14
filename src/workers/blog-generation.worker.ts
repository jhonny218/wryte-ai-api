import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { QueueName, BlogGenerationJobProtocol } from '../types/jobs';
import { promptService } from '../services/ai/prompt.service';
import { geminiService } from '../services/ai/gemini.service';
import { parserService } from '../services/ai/parser.service';
import { blogService } from '../services/blog.service';
import { titleService } from '../services/title.service';
import { jobService } from '../services/job.service';
import { JobStatus } from '../../generated/prisma/client';
import { prisma } from '../utils/prisma';
import { marked } from 'marked';

// Configure marked for better HTML output
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

export const blogGenerationWorker = new Worker<BlogGenerationJobProtocol>(
  QueueName.BLOG_GENERATION,
  async (job: Job<BlogGenerationJobProtocol>) => {
    const { userId, blogOutlineId, additionalInstructions } = job.data;
    const dbJobIdFromPayload = (job.data as any).jobId;

    if (dbJobIdFromPayload) {
      await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.PROCESSING);
    }

    try {
      // 1. Fetch the blog outline
      const blogOutline = await prisma.blogOutline.findUnique({
        where: { id: blogOutlineId },
        include: {
          blogTitle: true
        }
      });

      if (!blogOutline) {
        throw new Error('Blog outline not found');
      }

      // Use the organizationId from the fetched blog title
      const organizationId = blogOutline.blogTitle.organizationId;

      // 2. Fetch content settings
      const settings = await titleService.getContentSettings(organizationId);
      if (!settings) {
        throw new Error('Content settings not found');
      }

      // 3. Generate prompt
      const prompt = promptService.generateBlogPrompt(
        settings, 
        blogOutline.blogTitle.title, 
        blogOutline.structure
      );
      console.log('Blog Prompt:', prompt);

      // 4. Call Gemini
      const aiResponse = await geminiService.generateCompletion(prompt);
      console.log('AI Response:', aiResponse);

      // 5. Parse response
      const parsedBlog = parserService.parseBlogResponse(aiResponse);
      console.log('Parsed Blog:', parsedBlog);

      if (!parsedBlog) {
        throw new Error('Failed to parse blog response from AI');
      }

      // 6. Convert Markdown to HTML
      const markdownContent = parsedBlog.content || '';
      const htmlContent = await marked(markdownContent);

      // 7. Save blog to database
      const blog = await blogService.createBlog(blogOutlineId, {
        content: markdownContent,
        htmlContent: htmlContent,
        wordCount: parsedBlog.wordCount || 0,
      });

      // 8. Update job status
      if (dbJobIdFromPayload) {
        await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.COMPLETED, {
          blogId: blog.id,
          wordCount: blog.wordCount,
        });
      }

      return { success: true, blogId: blog.id };

    } catch (error: any) {
      console.error('Blog Generation Worker Error:', error);
      if (dbJobIdFromPayload) {
        await jobService.updateJobStatus(dbJobIdFromPayload, JobStatus.FAILED, undefined, error.message);
      }
      throw error;
    }
  },
  {
    connection,
    concurrency: 3, // Lower concurrency for larger content generation
    lockDuration: 60000, // 60 seconds - blog generation takes longer
    lockRenewTime: 30000, // 30 seconds
    stalledInterval: 60000,
    maxStalledCount: 1,
    autorun: true,
  }
);