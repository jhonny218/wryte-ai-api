import { stopTestServer } from './test-server'
import { cleanupTestDatabase, getTestPrismaClient } from './database'
import { flushAllTestKeys } from './redis'
import { logger } from '../../../utils/logger'

/**
 * Global teardown for Playwright E2E tests
 * Runs once after all tests complete
 */
async function globalTeardown() {
  logger.info('🧹 Starting E2E test cleanup...')

  try {
    // 1. Stop test server
    logger.info('🛑 Stopping test server...')
    await stopTestServer()

    // 2. Close database connections
    logger.info('🗄️  Closing database connections...')
    const prisma = getTestPrismaClient()
    await cleanupTestDatabase(prisma)

    // 3. Flush all test Redis keys
    logger.info('🔴 Flushing Redis test keys...')
    await flushAllTestKeys()

    logger.info('✅ E2E test cleanup complete')
  } catch (error) {
    logger.error('❌ E2E test cleanup failed', { error })
    // Don't throw - we want cleanup to continue even if some steps fail
  }
}

export default globalTeardown
