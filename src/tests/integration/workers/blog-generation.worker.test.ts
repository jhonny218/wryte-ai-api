import { Job } from 'bullmq'
import { promptService } from '../../../services/ai/prompt.service'
import { geminiService } from '../../../services/ai/gemini.service'
import { parserService } from '../../../services/ai/parser.service'
import { blogService } from '../../../services/blog.service'
import { titleService } from '../../../services/title.service'
import { jobService } from '../../../services/job.service'
import { prisma } from '../../../utils/prisma'
import { marked } from 'marked'
import { JobStatus } from '../../../../generated/prisma/client'
import type { BlogGenerationJobProtocol } from '../../../types/jobs'

jest.mock('../../../services/ai/prompt.service')
jest.mock('../../../services/ai/gemini.service')
jest.mock('../../../services/ai/parser.service')
jest.mock('../../../services/blog.service')
jest.mock('../../../services/title.service')
jest.mock('../../../services/job.service')
jest.mock('../../../utils/prisma', () => ({
  prisma: {
    blogOutline: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock marked before importing the worker - needs to be a full namespace mock
jest.mock('marked', () => {
  const mockMarked = jest.fn() as jest.Mock & { setOptions: jest.Mock }
  mockMarked.setOptions = jest.fn()
  return {
    marked: mockMarked,
    setOptions: jest.fn(),
  }
})

// Now import the worker after mocks are set up
import { blogGenerationWorker } from '../../../workers/blog-generation.worker'

describe('blogGenerationWorker', () => {
  let mockJob: Partial<Job<BlogGenerationJobProtocol>>

  beforeEach(() => {
    mockJob = {
      data: {
        userId: 'user_123',
        blogOutlineId: 'outline_123',
        additionalInstructions: 'Focus on practical examples',
        jobId: 'job_123',
      } as any,
    }

    ;(prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue({
      id: 'outline_123',
      blogTitleId: 'title_123',
      structure: {
        sections: ['Introduction', 'Main Points', 'Conclusion'],
      },
      blogTitle: {
        id: 'title_123',
        title: 'Future of AI',
        organizationId: 'org_123',
      },
    })

    ;(titleService.getContentSettings as jest.Mock).mockResolvedValue({
      primaryKeywords: ['AI', 'future'],
      tone: 'PROFESSIONAL',
    })

    ;(promptService.generateBlogPrompt as jest.Mock).mockReturnValue(
      'Generate blog about Future of AI'
    )

    ;(geminiService.generateCompletion as jest.Mock).mockResolvedValue(
      '{"content": "# Introduction\\n\\nAI is transforming...\\n\\n## Benefits\\n\\nKey benefits include...", "wordCount": 500}'
    )

    ;(parserService.parseBlogResponse as jest.Mock).mockReturnValue({
      content: '# Introduction\n\nAI is transforming...\n\n## Benefits\n\nKey benefits include...',
      wordCount: 500,
    })

    ;(marked as unknown as jest.Mock).mockResolvedValue(
      '<h1>Introduction</h1><p>AI is transforming...</p><h2>Benefits</h2><p>Key benefits include...</p>'
    )

    ;(blogService.createBlog as jest.Mock).mockResolvedValue({
      id: 'blog_123',
      blogOutlineId: 'outline_123',
      content: '# Introduction\n\nAI is transforming...',
      htmlContent: '<h1>Introduction</h1><p>AI is transforming...</p>',
      wordCount: 500,
    })

    ;(jobService.updateJobStatus as jest.Mock).mockResolvedValue(undefined)
  })

  it('should process blog generation job successfully', async () => {
    const processor = (blogGenerationWorker as any).processFn

    const result = await processor(mockJob as Job<BlogGenerationJobProtocol>)

    expect(jobService.updateJobStatus).toHaveBeenCalledWith('job_123', JobStatus.PROCESSING)
    expect(prisma.blogOutline.findUnique).toHaveBeenCalledWith({
      where: { id: 'outline_123' },
      include: { blogTitle: true },
    })
    expect(titleService.getContentSettings).toHaveBeenCalledWith('org_123')
    expect(promptService.generateBlogPrompt).toHaveBeenCalledWith(
      expect.objectContaining({ primaryKeywords: ['AI', 'future'] }),
      'Future of AI',
      expect.objectContaining({ sections: ['Introduction', 'Main Points', 'Conclusion'] })
    )
    expect(geminiService.generateCompletion).toHaveBeenCalledWith('Generate blog about Future of AI')
    expect(parserService.parseBlogResponse).toHaveBeenCalled()
    expect(marked).toHaveBeenCalledWith(
      '# Introduction\n\nAI is transforming...\n\n## Benefits\n\nKey benefits include...'
    )
    expect(blogService.createBlog).toHaveBeenCalledWith('outline_123', {
      content: '# Introduction\n\nAI is transforming...\n\n## Benefits\n\nKey benefits include...',
      htmlContent:
        '<h1>Introduction</h1><p>AI is transforming...</p><h2>Benefits</h2><p>Key benefits include...</p>',
      wordCount: 500,
    })
    expect(jobService.updateJobStatus).toHaveBeenCalledWith('job_123', JobStatus.COMPLETED, {
      blogId: 'blog_123',
      wordCount: 500,
    })
    expect(result).toEqual({ success: true, blogId: 'blog_123' })
  })

  it('should process without additional instructions', async () => {
    const { additionalInstructions, ...dataWithoutInstructions } = mockJob.data!
    mockJob.data = dataWithoutInstructions as BlogGenerationJobProtocol

    const processor = (blogGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<BlogGenerationJobProtocol>)

    expect(result).toEqual({ success: true, blogId: 'blog_123' })
  })

  it('should throw error when blog outline not found', async () => {
    ;(prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(null)

    const processor = (blogGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<BlogGenerationJobProtocol>)).rejects.toThrow(
      'Blog outline not found'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'Blog outline not found'
    )
  })

  it('should throw error when content settings not found', async () => {
    ;(titleService.getContentSettings as jest.Mock).mockResolvedValue(null)

    const processor = (blogGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<BlogGenerationJobProtocol>)).rejects.toThrow(
      'Content settings not found'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'Content settings not found'
    )
  })

  it('should throw error when AI response cannot be parsed', async () => {
    ;(parserService.parseBlogResponse as jest.Mock).mockReturnValue(null)

    const processor = (blogGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<BlogGenerationJobProtocol>)).rejects.toThrow(
      'Failed to parse blog response from AI'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'Failed to parse blog response from AI'
    )
  })

  it('should handle AI service failure', async () => {
    ;(geminiService.generateCompletion as jest.Mock).mockRejectedValue(
      new Error('Token limit exceeded')
    )

    const processor = (blogGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<BlogGenerationJobProtocol>)).rejects.toThrow(
      'Token limit exceeded'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'Token limit exceeded'
    )
  })

  it('should process job without jobId in payload', async () => {
    delete (mockJob.data as any).jobId

    const processor = (blogGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<BlogGenerationJobProtocol>)

    expect(jobService.updateJobStatus).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, blogId: 'blog_123' })
  })

  it('should handle empty markdown content', async () => {
    ;(parserService.parseBlogResponse as jest.Mock).mockReturnValue({
      content: '',
      wordCount: 0,
    })
    ;(marked as unknown as jest.Mock).mockResolvedValue('')
    ;(blogService.createBlog as jest.Mock).mockResolvedValue({
      id: 'blog_123',
      content: '',
      htmlContent: '',
      wordCount: 0,
    })

    const processor = (blogGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<BlogGenerationJobProtocol>)

    expect(marked).toHaveBeenCalledWith('')
    expect(blogService.createBlog).toHaveBeenCalledWith('outline_123', {
      content: '',
      htmlContent: '',
      wordCount: 0,
    })
    expect(result).toEqual({ success: true, blogId: 'blog_123' })
  })

  it('should handle parsed blog with missing wordCount', async () => {
    ;(parserService.parseBlogResponse as jest.Mock).mockReturnValue({
      content: '# Test\n\nContent here',
    })
    ;(blogService.createBlog as jest.Mock).mockResolvedValue({
      id: 'blog_123',
      wordCount: 0,
    })

    const processor = (blogGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<BlogGenerationJobProtocol>)

    expect(blogService.createBlog).toHaveBeenCalledWith('outline_123', {
      content: '# Test\n\nContent here',
      htmlContent: expect.any(String),
      wordCount: 0,
    })
    expect(result).toEqual({ success: true, blogId: 'blog_123' })
  })

  it('should handle markdown conversion failure', async () => {
    ;(marked as unknown as jest.Mock).mockRejectedValue(new Error('Markdown parsing error'))

    const processor = (blogGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<BlogGenerationJobProtocol>)).rejects.toThrow(
      'Markdown parsing error'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'Markdown parsing error'
    )
  })

  it('should handle database failure during blog creation', async () => {
    ;(blogService.createBlog as jest.Mock).mockRejectedValue(
      new Error('Database write failed')
    )

    const processor = (blogGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<BlogGenerationJobProtocol>)).rejects.toThrow(
      'Database write failed'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'Database write failed'
    )
  })
})
