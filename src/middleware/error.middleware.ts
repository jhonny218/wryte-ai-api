import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { AppError } from '../utils/errors'

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  })

  // Custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any
    logger.error('Prisma error details', {
      code: prismaError.code,
      meta: prismaError.meta,
      message: prismaError.message
    })
    
    return res.status(400).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? prismaError.message : undefined,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Default 500 error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  })
}