import { Job } from 'bullmq'
import { outlineGenerationWorker } from '../../../workers/outline-generation.worker'
import { promptService } from '../../../services/ai/prompt.service'
import { geminiService } from '../../../services/ai/gemini.service'
import { parserService } from '../../../services/ai/parser.service'
import { outlineService } from '../../../services/outline.service'
import { titleService } from '../../../services/title.service'
import { jobService } from '../../../services/job.service'
import { prisma } from '../../../utils/prisma'
import { JobStatus } from '../../../../generated/prisma/client'
import type { OutlineGenerationJobProtocol } from '../../../types/jobs'

jest.mock('../../../services/ai/prompt.service')
jest.mock('../../../services/ai/gemini.service')
jest.mock('../../../services/ai/parser.service')
jest.mock('../../../services/outline.service')
jest.mock('../../../services/title.service')
jest.mock('../../../services/job.service')
jest.mock('../../../utils/prisma', () => ({
  prisma: {
    blogTitle: {
      findUnique: jest.fn(),
    },
  },
}))

describe('outlineGenerationWorker', () => {
  let mockJob: Partial<Job<OutlineGenerationJobProtocol>>

  beforeEach(() => {
    mockJob = {
      data: {
        userId: 'user_123',
        blogTitleId: 'title_123',
        additionalInstructions: 'Include examples',
        jobId: 'job_123',
      } as any,
    }

    ;(prisma.blogTitle.findUnique as jest.Mock).mockResolvedValue({
      id: 'title_123',
      title: 'AI in Healthcare',
      organizationId: 'org_123',
    })

    ;(titleService.getContentSettings as jest.Mock).mockResolvedValue({
      primaryKeywords: ['healthcare', 'AI'],
      tone: 'PROFESSIONAL',
    })

    ;(promptService.generateOutlinePrompt as jest.Mock).mockReturnValue(
      'Generate outline for AI in Healthcare'
    )

    ;(geminiService.generateCompletion as jest.Mock).mockResolvedValue(
      '{"sections": ["Intro", "Benefits", "Conclusion"], "seoKeywords": ["AI", "healthcare"]}'
    )

    ;(parserService.parseOutlineResponse as jest.Mock).mockReturnValue({
      sections: ['Intro', 'Benefits', 'Conclusion'],
      seoKeywords: ['AI', 'healthcare'],
      metaDescription: 'AI transforming healthcare',
      suggestedImages: ['hero.jpg'],
    })

    ;(outlineService.createOutline as jest.Mock).mockResolvedValue({
      id: 'outline_123',
      blogTitleId: 'title_123',
    })

    ;(jobService.updateJobStatus as jest.Mock).mockResolvedValue(undefined)
  })

  it('should process outline generation job successfully', async () => {
    const processor = (outlineGenerationWorker as any).processFn

    const result = await processor(mockJob as Job<OutlineGenerationJobProtocol>)

    expect(jobService.updateJobStatus).toHaveBeenCalledWith('job_123', JobStatus.PROCESSING)
    expect(prisma.blogTitle.findUnique).toHaveBeenCalledWith({
      where: { id: 'title_123' },
    })
    expect(titleService.getContentSettings).toHaveBeenCalledWith('org_123')
    expect(promptService.generateOutlinePrompt).toHaveBeenCalledWith(
      expect.objectContaining({ primaryKeywords: ['healthcare', 'AI'] }),
      'AI in Healthcare',
      'Include examples'
    )
    expect(geminiService.generateCompletion).toHaveBeenCalledWith(
      'Generate outline for AI in Healthcare'
    )
    expect(parserService.parseOutlineResponse).toHaveBeenCalled()
    expect(outlineService.createOutline).toHaveBeenCalledWith('title_123', {
      structure: expect.objectContaining({ sections: ['Intro', 'Benefits', 'Conclusion'] }),
      seoKeywords: ['AI', 'healthcare'],
      metaDescription: 'AI transforming healthcare',
      suggestedImages: ['hero.jpg'],
    })
    expect(jobService.updateJobStatus).toHaveBeenCalledWith('job_123', JobStatus.COMPLETED, {
      outlineId: 'outline_123',
      structure: expect.any(Object),
    })
    expect(result).toEqual({ success: true, outlineId: 'outline_123' })
  })

  it('should process without additional instructions', async () => {
    const { additionalInstructions, ...dataWithoutInstructions } = mockJob.data!
    mockJob.data = dataWithoutInstructions as OutlineGenerationJobProtocol

    const processor = (outlineGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<OutlineGenerationJobProtocol>)

    expect(promptService.generateOutlinePrompt).toHaveBeenCalledWith(
      expect.any(Object),
      'AI in Healthcare',
      undefined
    )
    expect(result).toEqual({ success: true, outlineId: 'outline_123' })
  })

  it('should throw error when blog title not found', async () => {
    ;(prisma.blogTitle.findUnique as jest.Mock).mockResolvedValue(null)

    const processor = (outlineGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<OutlineGenerationJobProtocol>)).rejects.toThrow(
      'Blog title not found'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'Blog title not found'
    )
  })

  it('should throw error when content settings not found', async () => {
    ;(titleService.getContentSettings as jest.Mock).mockResolvedValue(null)

    const processor = (outlineGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<OutlineGenerationJobProtocol>)).rejects.toThrow(
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
    ;(parserService.parseOutlineResponse as jest.Mock).mockReturnValue(null)

    const processor = (outlineGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<OutlineGenerationJobProtocol>)).rejects.toThrow(
      'Failed to parse outline response from AI'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'Failed to parse outline response from AI'
    )
  })

  it('should handle AI service failure', async () => {
    ;(geminiService.generateCompletion as jest.Mock).mockRejectedValue(
      new Error('API rate limit exceeded')
    )

    const processor = (outlineGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<OutlineGenerationJobProtocol>)).rejects.toThrow(
      'API rate limit exceeded'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'API rate limit exceeded'
    )
  })

  it('should process job without jobId in payload', async () => {
    delete (mockJob.data as any).jobId

    const processor = (outlineGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<OutlineGenerationJobProtocol>)

    expect(jobService.updateJobStatus).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, outlineId: 'outline_123' })
  })

  it('should handle parsed outline with missing optional fields', async () => {
    ;(parserService.parseOutlineResponse as jest.Mock).mockReturnValue({
      sections: ['Intro'],
    })

    const processor = (outlineGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<OutlineGenerationJobProtocol>)

    expect(outlineService.createOutline).toHaveBeenCalledWith('title_123', {
      structure: { sections: ['Intro'] },
      seoKeywords: [],
      metaDescription: '',
      suggestedImages: [],
    })
    expect(result).toEqual({ success: true, outlineId: 'outline_123' })
  })

  it('should handle database failure during outline creation', async () => {
    ;(outlineService.createOutline as jest.Mock).mockRejectedValue(
      new Error('Database connection error')
    )

    const processor = (outlineGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<OutlineGenerationJobProtocol>)).rejects.toThrow(
      'Database connection error'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'Database connection error'
    )
  })
})
