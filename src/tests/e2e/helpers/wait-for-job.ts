import { APIRequestContext } from '@playwright/test'
import { logger } from '../../../utils/logger'

export interface WaitForJobOptions {
  /** Polling interval in milliseconds (default: 500) */
  interval?: number
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number
  /** Custom error message */
  errorMessage?: string
}

export interface JobStatus {
  id: string
  type: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
}

/**
 * Poll a job until it completes or fails
 * @throws Error if job fails or timeout is reached
 */
export async function waitForJobCompletion(
  request: APIRequestContext,
  jobId: string,
  options: WaitForJobOptions = {}
): Promise<JobStatus> {
  const {
    interval = 500,
    timeout = 10000,
    errorMessage = `Job ${jobId} did not complete within ${timeout}ms`,
  } = options

  const startTime = Date.now()
  let attempts = 0

  while (Date.now() - startTime < timeout) {
    attempts++
    
    try {
      const response = await request.get(`/api/v1/jobs/${jobId}`)
      
      if (!response.ok()) {
        throw new Error(`Failed to fetch job status: ${response.status()} ${await response.text()}`)
      }

      const job: JobStatus = await response.json()
      
      logger.debug(`[Job Poll] Attempt ${attempts}: Job ${jobId} status = ${job.status}`)

      if (job.status === 'COMPLETED') {
        logger.info(`[Job Poll] ✅ Job ${jobId} completed after ${attempts} attempts (${Date.now() - startTime}ms)`)
        return job
      }

      if (job.status === 'FAILED') {
        const errorDetails = job.error || 'Unknown error'
        logger.error(`[Job Poll] ❌ Job ${jobId} failed: ${errorDetails}`)
        throw new Error(`Job ${jobId} failed: ${errorDetails}`)
      }

      // Job still pending or processing, wait before next poll
      await sleep(interval)
    } catch (error) {
      if (error instanceof Error && error.message.includes('failed:')) {
        // Re-throw job failure errors
        throw error
      }
      // Log other errors but continue polling
      logger.warn(`[Job Poll] Error polling job ${jobId}`, { error })
      await sleep(interval)
    }
  }

  // Timeout reached
  logger.error(`[Job Poll] ⏱️  Timeout waiting for job ${jobId} after ${attempts} attempts`)
  throw new Error(errorMessage)
}

/**
 * Assertion helper that waits for job completion and returns the result
 */
export async function expectJobCompleted(
  request: APIRequestContext,
  jobId: string,
  options?: WaitForJobOptions
): Promise<JobStatus> {
  try {
    const job = await waitForJobCompletion(request, jobId, options)
    
    if (job.status !== 'COMPLETED') {
      throw new Error(`Expected job ${jobId} to be COMPLETED but was ${job.status}`)
    }

    return job
  } catch (error) {
    logger.error(`[Job Assertion] Job ${jobId} did not complete successfully`, { error })
    throw error
  }
}

/**
 * Wait for multiple jobs to complete in parallel
 */
export async function waitForAllJobs(
  request: APIRequestContext,
  jobIds: string[],
  options?: WaitForJobOptions
): Promise<JobStatus[]> {
  logger.info(`[Job Poll] Waiting for ${jobIds.length} jobs to complete...`)
  
  const promises = jobIds.map(jobId => waitForJobCompletion(request, jobId, options))
  
  try {
    const results = await Promise.all(promises)
    logger.info(`[Job Poll] ✅ All ${jobIds.length} jobs completed`)
    return results
  } catch (error) {
    logger.error(`[Job Poll] ❌ One or more jobs failed`, { error })
    throw error
  }
}

/**
 * Helper to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get job status without waiting
 */
export async function getJobStatus(
  request: APIRequestContext,
  jobId: string
): Promise<JobStatus | null> {
  try {
    const response = await request.get(`/api/v1/jobs/${jobId}`)
    
    if (!response.ok()) {
      return null
    }

    return await response.json()
  } catch (error) {
    logger.warn(`Failed to get job status for ${jobId}`, { error })
    return null
  }
}
