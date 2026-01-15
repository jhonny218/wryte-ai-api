import { Pool } from 'pg'

// Mock dependencies before imports
jest.mock('../../../utils/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

jest.mock('../../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('../../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  },
}))

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}))

jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  }
  
  const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    end: jest.fn().mockResolvedValue(undefined),
  }
  
  return {
    Pool: jest.fn(() => mockPool),
  }
})

import { pingDatabase, runMigrations, shutdownDatabase, pgPool } from '../../../config/database'
import prisma from '../../../utils/prisma'
import { logger } from '../../../utils/logger'
import { execSync } from 'child_process'

describe('Database Config', () => {
  let mockClient: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Get the mock client from the pool
    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
      release: jest.fn(),
    }
    
    ;(pgPool.connect as jest.Mock).mockResolvedValue(mockClient)
  })

  describe('pingDatabase', () => {
    it('should return true when Prisma query succeeds', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])

      const result = await pingDatabase()

      expect(result).toBe(true)
      expect(prisma.$queryRaw).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining('SELECT 1')]))
      expect(pgPool.connect).not.toHaveBeenCalled()
    })

    it('should fallback to pg pool when Prisma fails', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Prisma connection failed'))

      const result = await pingDatabase()

      expect(result).toBe(true)
      expect(logger.warn).toHaveBeenCalledWith('Prisma ping failed; falling back to pg pool', {
        error: expect.any(Error),
      })
      expect(pgPool.connect).toHaveBeenCalled()
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should return false when both Prisma and pg pool fail', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Prisma failed'))
      ;(pgPool.connect as jest.Mock).mockRejectedValue(new Error('Pool connection failed'))

      const result = await pingDatabase()

      expect(result).toBe(false)
      expect(logger.warn).toHaveBeenCalledWith('Prisma ping failed; falling back to pg pool', {
        error: expect.any(Error),
      })
      expect(logger.error).toHaveBeenCalledWith('Postgres ping failed', {
        error: expect.any(Error),
      })
    })

    it('should return false when pg query fails', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Prisma failed'))
      mockClient.query.mockRejectedValue(new Error('Query failed'))

      const result = await pingDatabase()

      expect(result).toBe(false)
      expect(mockClient.release).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith('Postgres ping failed', {
        error: expect.any(Error),
      })
    })

    it('should release client even when query throws', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Prisma failed'))
      mockClient.query.mockRejectedValue(new Error('Query failed'))

      await pingDatabase()

      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('runMigrations', () => {
    it('should run prisma migrate dev with default name in non-production', () => {
      runMigrations()

      expect(execSync).toHaveBeenCalledWith('npx prisma migrate dev --name init', { stdio: 'inherit' })
      expect(logger.info).toHaveBeenCalledWith('Running development migrations via `prisma migrate dev`')
    })

    it('should run prisma migrate dev with custom name', () => {
      runMigrations('add_user_table')

      expect(execSync).toHaveBeenCalledWith('npx prisma migrate dev --name add_user_table', { stdio: 'inherit' })
    })

    it('should log error and throw when migration fails', () => {
      const migrationError = new Error('Migration failed')
      ;(execSync as jest.Mock).mockImplementation(() => {
        throw migrationError
      })

      expect(() => runMigrations()).toThrow('Migration failed')
      expect(logger.error).toHaveBeenCalledWith('Database migration failed', { error: migrationError })
    })
  })

  describe('shutdownDatabase', () => {
    it('should disconnect prisma and close pg pool', async () => {
      await shutdownDatabase()

      expect(prisma.$disconnect).toHaveBeenCalled()
      expect(pgPool.end).toHaveBeenCalled()
    })

    it('should handle prisma disconnect errors gracefully', async () => {
      const disconnectError = new Error('Disconnect failed')
      ;(prisma.$disconnect as jest.Mock).mockRejectedValue(disconnectError)

      await shutdownDatabase()

      expect(logger.warn).toHaveBeenCalledWith('Error disconnecting prisma', { error: disconnectError })
      expect(pgPool.end).toHaveBeenCalled()
    })

    it('should handle pg pool end errors gracefully', async () => {
      const endError = new Error('Pool end failed')
      ;(pgPool.end as jest.Mock).mockRejectedValue(endError)

      await shutdownDatabase()

      expect(prisma.$disconnect).toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith('Error closing pg pool', { error: endError })
    })

    it('should handle both prisma and pg errors gracefully', async () => {
      ;(prisma.$disconnect as jest.Mock).mockRejectedValue(new Error('Prisma error'))
      ;(pgPool.end as jest.Mock).mockRejectedValue(new Error('Pool error'))

      await shutdownDatabase()

      expect(logger.warn).toHaveBeenCalledTimes(2)
    })
  })
})
