import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { clerkMiddleware } from '@clerk/express'

import { routes } from "./routes"
import { errorMiddleware } from './middleware/error.middleware'
import { loggingMiddleware } from './middleware/logging.middleware'
import { env } from './config/env'

export const app = express();

// Security & Performance
app.use(helmet())
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}))
app.use(compression())

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Clerk middleware
app.use(clerkMiddleware())

// Logging
app.use(loggingMiddleware)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/v1', routes)

// Error handling (must be last)
app.use(errorMiddleware)
