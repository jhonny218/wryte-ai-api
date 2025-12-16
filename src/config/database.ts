import { execSync } from 'child_process'
import { Pool } from 'pg'
import prisma from '../utils/prisma'
import { env } from './env'
import { logger } from '../utils/logger'

/**
 * Postgres connection pool (for low-level SQL, LISTEN/NOTIFY, COPY, etc.)
 */
export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  // If using a managed DB that requires SSL, enable it in production.
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

/**
 * Re-export the Prisma client from `src/utils/prisma.ts` so callers can import
 * from a single `config` place if desired.
 */
export { prisma }

/**
 * Lightweight readiness check used by health endpoints.
 * Tries Prisma first, then falls back to a raw `pg` query.
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    // quick Prisma check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).$queryRaw`SELECT 1`
    return true
  } catch (prismaErr) {
    logger.warn('Prisma ping failed; falling back to pg pool', { error: prismaErr })
  }

  try {
    const client = await pgPool.connect()
    try {
      await client.query('SELECT 1')
      return true
    } finally {
      client.release()
    }
  } catch (pgErr) {
    logger.error('Postgres ping failed', { error: pgErr })
    return false
  }
}

/**
 * Run migrations programmatically. In production this uses `prisma migrate deploy`.
 * In development it runs `prisma migrate dev` which is convenient for local dev only.
 */
export function runMigrations(name = 'init'): void {
  try {
    if (env.NODE_ENV === 'production') {
      logger.info('Running production migrations via `prisma migrate deploy`')
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    } else {
      logger.info('Running development migrations via `prisma migrate dev`')
      execSync(`npx prisma migrate dev --name ${name}`, { stdio: 'inherit' })
    }
  } catch (err) {
    logger.error('Database migration failed', { error: err })
    throw err
  }
}

/**
 * Gracefully close all DB connections. Call during shutdown.
 */
export async function shutdownDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (err) {
    logger.warn('Error disconnecting prisma', { error: err })
  }

  try {
    await pgPool.end()
  } catch (err) {
    logger.warn('Error closing pg pool', { error: err })
  }
}

export default {
  prisma,
  pgPool,
  pingDatabase,
  runMigrations,
  shutdownDatabase,
}
