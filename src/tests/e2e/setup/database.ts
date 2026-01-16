import { PrismaClient } from '../../../../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { logger } from '../../../utils/logger'

/**
 * Get Prisma client configured for E2E testing with connection pooling
 * optimized for parallel test execution
 */
export function getTestPrismaClient(workerIndex?: number): PrismaClient {
  const workerPrefix = workerIndex !== undefined ? `[Worker ${workerIndex}]` : ''
  
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({
    adapter,
    log: process.env.DEBUG === 'true' ? ['query', 'error', 'warn'] : ['error'],
  })

  logger.info(`${workerPrefix} Created Prisma client for E2E tests`)

  return prisma
}

/**
 * Get connection pool statistics for monitoring
 */
export async function getConnectionPoolStats(prisma: PrismaClient): Promise<{
  activeConnections: number
  idleConnections: number
  totalConnections: number
}> {
  try {
    // Prisma doesn't expose connection pool metrics directly
    // This is a placeholder for monitoring implementation
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `
    
    const totalConnections = Number(result?.[0]?.count ?? 0)
    
    return {
      activeConnections: 0, // Would need custom implementation
      idleConnections: 0,
      totalConnections,
    }
  } catch (error) {
    logger.warn('Failed to get connection pool stats', { error })
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
    }
  }
}

/**
 * Log connection pool status for debugging
 */
export async function logConnectionPoolStatus(prisma: PrismaClient, label: string): Promise<void> {
  if (process.env.DEBUG === 'true') {
    const stats = await getConnectionPoolStats(prisma)
    logger.debug(`[${label}] Connection Pool Status`, stats)
  }
}

/**
 * Wrapper to execute test within a transaction that auto-rolls back
 * This ensures test isolation without manual cleanup
 */
export async function withTransaction<T>(
  prisma: PrismaClient,
  testFn: (tx: any) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    try {
      const result = await testFn(tx)
      // Force rollback by throwing
      throw new Error('__ROLLBACK__')
    } catch (error) {
      if (error instanceof Error && error.message === '__ROLLBACK__') {
        // This is our intentional rollback, don't propagate
        throw error
      }
      // Re-throw actual errors
      throw error
    }
  }).catch((error) => {
    if (error instanceof Error && error.message === '__ROLLBACK__') {
      // Rollback successful, return undefined
      return undefined as T
    }
    throw error
  })
}

/**
 * Initialize test database connection with optimized settings
 */
export async function initializeTestDatabase(): Promise<PrismaClient> {
  const prisma = getTestPrismaClient()
  
  try {
    // Verify connection
    await prisma.$queryRaw`SELECT 1`
    logger.info('✅ Test database connection established')
    
    await logConnectionPoolStatus(prisma, 'Initialize')
    
    return prisma
  } catch (error) {
    logger.error('Failed to initialize test database', { error })
    throw error
  }
}

/**
 * Cleanup and close test database connections
 */
export async function cleanupTestDatabase(prisma: PrismaClient): Promise<void> {
  try {
    await logConnectionPoolStatus(prisma, 'Cleanup')
    await prisma.$disconnect()
    logger.info('✅ Test database connections closed')
  } catch (error) {
    logger.error('Failed to cleanup test database', { error })
    throw error
  }
}

/**
 * Truncate all tables for test cleanup (alternative to transactions)
 * Use with caution - this deletes all data
 */
export async function truncateAllTables(prisma: PrismaClient): Promise<void> {
  const tables = [
    'FullBlog',
    'BlogOutline',
    'BlogTitle',
    'Job',
    'ContentSettings',
    'OrganizationMember',
    'Organization',
    'User',
  ]

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
    } catch (error) {
      logger.warn(`Failed to truncate table ${table}`, { error })
    }
  }
}
