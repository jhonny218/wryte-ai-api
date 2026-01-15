import { Job } from 'bullmq'
import { titleGenerationWorker } from '../../../workers/title-generation.worker'
import { promptService } from '../../../services/ai/prompt.service'
import { geminiService } from '../../../services/ai/gemini.service'
import { parserService } from '../../../services/ai/parser.service'
import { titleService } from '../../../services/title.service'
import { jobService } from '../../../services/job.service'
import { JobStatus } from '../../../../generated/prisma/client'
import type { TitleGenerationJobProtocol } from '../../../types/jobs'

jest.mock('../../../services/ai/prompt.service')
jest.mock('../../../services/ai/gemini.service')
jest.mock('../../../services/ai/parser.service')
jest.mock('../../../services/title.service')
jest.mock('../../../services/job.service')

describe('titleGenerationWorker', () => {
  let mockJob: Partial<Job<TitleGenerationJobProtocol>>

  beforeEach(() => {
    mockJob = {
      data: {
        userId: 'user_123',
        organizationId: 'org_123',
        dates: ['2026-01-15', '2026-01-16', '2026-01-17'],
        jobId: 'job_123',
      } as any,
    }

    ;(titleService.getContentSettings as jest.Mock).mockResolvedValue({
      primaryKeywords: ['tech', 'ai'],
      tone: 'PROFESSIONAL',
      preferredLength: 'MEDIUM',
    })

    ;(promptService.generateTitlePrompt as jest.Mock).mockReturnValue('Generate 3 titles')

    ;(geminiService.generateCompletion as jest.Mock).mockResolvedValue(
      '["Title One", "Title Two", "Title Three"]'
    )

    ;(parserService.parseTitleResponse as jest.Mock).mockReturnValue([
      'Title One',
      'Title Two',
      'Title Three',
    ])

    ;(titleService.createTitlesWithDates as jest.Mock).mockResolvedValue(undefined)
    ;(jobService.updateJobStatus as jest.Mock).mockResolvedValue(undefined)
  })

  it('should process title generation job successfully', async () => {
    const processor = (titleGenerationWorker as any).processFn

    const result = await processor(mockJob as Job<TitleGenerationJobProtocol>)

    expect(jobService.updateJobStatus).toHaveBeenCalledWith('job_123', JobStatus.PROCESSING)
    expect(titleService.getContentSettings).toHaveBeenCalledWith('org_123')
    expect(promptService.generateTitlePrompt).toHaveBeenCalledWith(
      expect.objectContaining({ primaryKeywords: ['tech', 'ai'] }),
      3
    )
    expect(geminiService.generateCompletion).toHaveBeenCalledWith('Generate 3 titles')
    expect(parserService.parseTitleResponse).toHaveBeenCalled()
    expect(titleService.createTitlesWithDates).toHaveBeenCalledWith('org_123', [
      { title: 'Title One', date: new Date('2026-01-15') },
      { title: 'Title Two', date: new Date('2026-01-16') },
      { title: 'Title Three', date: new Date('2026-01-17') },
    ])
    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.COMPLETED,
      expect.objectContaining({ count: 3 })
    )
    expect(result).toEqual({ success: true, count: 3 })
  })

  it('should handle fewer AI titles than dates', async () => {
    ;(parserService.parseTitleResponse as jest.Mock).mockReturnValue(['Title One', 'Title Two'])

    const processor = (titleGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<TitleGenerationJobProtocol>)

    expect(titleService.createTitlesWithDates).toHaveBeenCalledWith('org_123', [
      { title: 'Title One', date: new Date('2026-01-15') },
      { title: 'Title Two', date: new Date('2026-01-16') },
    ])
    expect(result).toEqual({ success: true, count: 2 })
  })

  it('should handle more AI titles than dates', async () => {
    ;(parserService.parseTitleResponse as jest.Mock).mockReturnValue([
      'Title One',
      'Title Two',
      'Title Three',
      'Title Four',
    ])

    const processor = (titleGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<TitleGenerationJobProtocol>)

    expect(titleService.createTitlesWithDates).toHaveBeenCalledWith('org_123', [
      { title: 'Title One', date: new Date('2026-01-15') },
      { title: 'Title Two', date: new Date('2026-01-16') },
      { title: 'Title Three', date: new Date('2026-01-17') },
    ])
    expect(result).toEqual({ success: true, count: 3 })
  })

  it('should throw error when content settings not found', async () => {
    ;(titleService.getContentSettings as jest.Mock).mockResolvedValue(null)

    const processor = (titleGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<TitleGenerationJobProtocol>)).rejects.toThrow(
      'Content settings not found.'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'Content settings not found.'
    )
  })

  it('should throw error when no dates provided', async () => {
    mockJob.data = { ...mockJob.data!, dates: [] }

    const processor = (titleGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<TitleGenerationJobProtocol>)).rejects.toThrow(
      'No dates provided.'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'No dates provided.'
    )
  })

  it('should handle AI service failure', async () => {
    ;(geminiService.generateCompletion as jest.Mock).mockRejectedValue(
      new Error('AI service unavailable')
    )

    const processor = (titleGenerationWorker as any).processFn

    await expect(processor(mockJob as Job<TitleGenerationJobProtocol>)).rejects.toThrow(
      'AI service unavailable'
    )

    expect(jobService.updateJobStatus).toHaveBeenCalledWith(
      'job_123',
      JobStatus.FAILED,
      undefined,
      'AI service unavailable'
    )
  })

  it('should process job without jobId in payload', async () => {
    delete (mockJob.data as any).jobId

    const processor = (titleGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<TitleGenerationJobProtocol>)

    expect(jobService.updateJobStatus).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, count: 3 })
  })

  it('should handle empty title or date in parsed results', async () => {
    ;(parserService.parseTitleResponse as jest.Mock).mockReturnValue([
      'Title One',
      '',
      'Title Three',
    ])

    const processor = (titleGenerationWorker as any).processFn
    const result = await processor(mockJob as Job<TitleGenerationJobProtocol>)

    expect(titleService.createTitlesWithDates).toHaveBeenCalledWith('org_123', [
      { title: 'Title One', date: new Date('2026-01-15') },
      { title: 'Title Three', date: new Date('2026-01-17') },
    ])
    expect(result).toEqual({ success: true, count: 2 })
  })
})
