import Redis from 'ioredis'
import { logger } from '../../../utils/logger'

/**
 * Get Redis client with worker-specific key prefix for test isolation
 */
export function getTestRedis(workerIndex: number): Redis {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    keyPrefix: `test:w${workerIndex}:`,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        return null
      }
      return Math.min(times * 50, 2000)
    },
  })

  redis.on('connect', () => {
    logger.info(`[Worker ${workerIndex}] Redis connected with prefix: test:w${workerIndex}:`)
  })

  redis.on('error', (error) => {
    logger.error(`[Worker ${workerIndex}] Redis error`, { error })
  })

  return redis
}

/**
 * Clean up all keys for a specific worker
 * Uses SCAN for safe iteration and DEL for removal
 */
export async function cleanupWorkerKeys(workerIndex: number, redis?: Redis): Promise<number> {
  const client = redis || getTestRedis(workerIndex)
  const pattern = `test:w${workerIndex}:*`
  let cursor = '0'
  let deletedCount = 0

  try {
    do {
      // SCAN returns [cursor, keys[]]
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      )
      
      cursor = nextCursor

      if (keys.length > 0) {
        // Remove the prefix for deletion since Redis client adds it automatically
        const keysWithoutPrefix = keys.map(key => key.replace(`test:w${workerIndex}:`, ''))
        await client.del(...keysWithoutPrefix)
        deletedCount += keys.length
      }
    } while (cursor !== '0')

    logger.debug(`[Worker ${workerIndex}] Cleaned up ${deletedCount} Redis keys`)
    
    if (!redis) {
      await client.quit()
    }
    
    return deletedCount
  } catch (error) {
    logger.error(`[Worker ${workerIndex}] Failed to cleanup Redis keys`, { error })
    throw error
  }
}

/**
 * Get worker-specific queue name for BullMQ
 */
export function getTestQueueName(baseName: string, workerIndex: number): string {
  return `${baseName}-w${workerIndex}`
}

/**
 * Initialize Redis for test worker
 */
export async function initializeTestRedis(workerIndex: number): Promise<Redis> {
  const redis = getTestRedis(workerIndex)
  
  try {
    // Verify connection
    await redis.ping()
    logger.info(`[Worker ${workerIndex}] ✅ Redis connection established`)
    
    // Clean up any leftover keys from previous test runs
    await cleanupWorkerKeys(workerIndex, redis)
    
    return redis
  } catch (error) {
    logger.error(`[Worker ${workerIndex}] Failed to initialize Redis`, { error })
    throw error
  }
}

/**
 * Cleanup and close Redis connection
 */
export async function cleanupTestRedis(workerIndex: number, redis: Redis): Promise<void> {
  try {
    // Clean up all test keys
    await cleanupWorkerKeys(workerIndex, redis)
    
    // Close connection
    await redis.quit()
    
    logger.info(`[Worker ${workerIndex}] ✅ Redis connection closed`)
  } catch (error) {
    logger.error(`[Worker ${workerIndex}] Failed to cleanup Redis`, { error })
    throw error
  }
}

/**
 * Flush all test keys across all workers (use in global teardown)
 */
export async function flushAllTestKeys(): Promise<void> {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  
  try {
    let cursor = '0'
    let totalDeleted = 0

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        'test:*',
        'COUNT',
        1000
      )
      
      cursor = nextCursor

      if (keys.length > 0) {
        await redis.del(...keys)
        totalDeleted += keys.length
      }
    } while (cursor !== '0')

    logger.info(`✅ Flushed ${totalDeleted} test keys from Redis`)
  } catch (error) {
    logger.error('Failed to flush test keys from Redis', { error })
  } finally {
    await redis.quit()
  }
}
