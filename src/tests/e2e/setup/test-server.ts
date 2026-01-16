import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { Server } from 'http'
import { routes } from '../../../routes'
import { errorMiddleware } from '../../../middleware/error.middleware'
import { loggingMiddleware } from '../../../middleware/logging.middleware'
import { pingDatabase } from '../../../config/database'
import { serverAdapter } from '../../../config/bullboard'
import { testAuthMiddleware } from '../helpers/auth-bypass'
import { logger } from '../../../utils/logger'

let server: Server | null = null

/**
 * Create and configure Express app for E2E testing
 */
export function createTestApp(): express.Application {
  const app = express()

  // Security & Performance
  app.use(helmet())
  app.use(cors({
    origin: '*', // Allow all origins in test
    credentials: true,
  }))
  app.use(compression())

  // Body parsing
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Webhooks need raw body for signature verification
  app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }))

  // TEST MODE: Use auth bypass instead of Clerk middleware
  if (process.env.NODE_ENV === 'test') {
    app.use(testAuthMiddleware)
    logger.info('[Test Server] Using authentication bypass middleware')
  }

  // Logging
  app.use(loggingMiddleware)

  // Health check
  app.get('/health', async (req, res) => {
    const timestamp = new Date().toISOString()
    try {
      const dbOk = await pingDatabase()
      const status = dbOk ? 'ok' : 'degraded'
      return res.status(dbOk ? 200 : 503).json({ 
        status, 
        timestamp, 
        database: dbOk ? 'ok' : 'down',
        mode: 'test'
      })
    } catch (err) {
      return res.status(500).json({ 
        status: 'error', 
        timestamp, 
        database: 'unknown',
        mode: 'test'
      })
    }
  })

  // Bull Board UI for queue monitoring
  app.use('/admin/queues', serverAdapter.getRouter())

  // API routes
  app.use('/api/v1', routes)

  // Error handling (must be last)
  app.use(errorMiddleware)

  return app
}

/**
 * Start test server on port 3001
 */
export async function startTestServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const app = createTestApp()
      const port = 3001

      server = app.listen(port, () => {
        logger.info(`✅ Test server started on http://localhost:${port}`)
        logger.info(`   Mode: ${process.env.NODE_ENV}`)
        logger.info(`   Database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}`)
        logger.info(`   Workers: ${process.env.RUN_WORKERS || 'false'}`)
        resolve()
      })

      server.on('error', (error) => {
        logger.error('Failed to start test server', { error })
        reject(error)
      })
    } catch (error) {
      logger.error('Error creating test server', { error })
      reject(error)
    }
  })
}

/**
 * Stop test server and close connections
 */
export async function stopTestServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server) {
      logger.warn('No test server to stop')
      resolve()
      return
    }

    server.close((error) => {
      if (error) {
        logger.error('Error stopping test server', { error })
        reject(error)
      } else {
        logger.info('✅ Test server stopped')
        server = null
        resolve()
      }
    })
  })
}

/**
 * Get test server instance (for direct testing if needed)
 */
export function getTestServer(): Server | null {
  return server
}
