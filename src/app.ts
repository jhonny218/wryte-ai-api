import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { clerkMiddleware } from '@clerk/express'

import { routes } from "./routes"
import { errorMiddleware } from './middleware/error.middleware'
import { loggingMiddleware } from './middleware/logging.middleware'
import { env } from './config/env'
import { pingDatabase } from './config/database'
import { serverAdapter } from './config/bullboard'

export const app = express();

// Security & Performance
app.use(helmet())
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true
}))
app.use(compression())

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Webhooks need raw body for signature verification
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }))

// Clerk middleware
app.use(clerkMiddleware())

// Logging
app.use(loggingMiddleware)

// Health check
app.get('/health', async (req, res) => {
  const timestamp = new Date().toISOString()
  try {
    const dbOk = await pingDatabase()
    const status = dbOk ? 'ok' : 'degraded'
    return res.status(dbOk ? 200 : 503).json({ status, timestamp, database: dbOk ? 'ok' : 'down' })
  } catch (err) {
    return res.status(500).json({ status: 'error', timestamp, database: 'unknown' })
  }
})

// Bull Board UI for queue monitoring
app.use('/admin/queues', serverAdapter.getRouter())

// API routes
app.use('/api/v1', routes)

// Error handling (must be last)
app.use(errorMiddleware)
