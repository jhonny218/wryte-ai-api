import { Request, Response, NextFunction } from 'express'
import { errorMiddleware } from '../../../middleware/error.middleware'
import { AppError, BadRequestError, NotFoundError, UnauthorizedError } from '../../../utils/errors'
import { logger } from '../../../utils/logger'

jest.mock('../../../utils/logger')

describe('Error Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })

    mockReq = {
      path: '/api/test',
      method: 'GET'
    } as any
    mockRes = {
      status: statusMock
    } as any
    mockNext = jest.fn()

    jest.clearAllMocks()
  })

  describe('AppError handling', () => {
    it('should handle BadRequestError with correct status code', () => {
      const error = new BadRequestError('Invalid input')

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          details: undefined,
          timestamp: expect.any(String)
        }
      })
    })

    it('should handle NotFoundError with correct status code', () => {
      const error = new NotFoundError('Resource not found')

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          details: undefined,
          timestamp: expect.any(String)
        }
      })
    })

    it('should handle UnauthorizedError with correct status code', () => {
      const error = new UnauthorizedError('Not authenticated')

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
          details: undefined,
          timestamp: expect.any(String)
        }
      })
    })

    it('should include error details when provided', () => {
      const details = { field: 'email', issue: 'invalid format' }
      const error = new BadRequestError('Validation failed', details)

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'BAD_REQUEST',
          message: 'Validation failed',
          details,
          timestamp: expect.any(String)
        }
      })
    })

    it('should log AppError with correct parameters', () => {
      const error = new BadRequestError('Test error')

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        error: 'Test error',
        stack: expect.any(String),
        path: '/api/test',
        method: 'GET'
      })
    })
  })

  describe('Prisma error handling', () => {
    it('should handle PrismaClientKnownRequestError', () => {
      const error = new Error('Prisma error')
      error.name = 'PrismaClientKnownRequestError'
      ;(error as any).code = 'P2002'
      ;(error as any).meta = { target: ['email'] }

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: undefined,
          timestamp: expect.any(String)
        }
      })
    })

    it('should log Prisma error details', () => {
      const error = new Error('Unique constraint failed')
      error.name = 'PrismaClientKnownRequestError'
      ;(error as any).code = 'P2002'
      ;(error as any).meta = { target: ['email'] }

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(logger.error).toHaveBeenCalledWith('Error occurred', expect.any(Object))
      expect(logger.error).toHaveBeenCalledWith('Prisma error details', {
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed'
      })
    })

    it('should include Prisma error message in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Unique constraint violation')
      error.name = 'PrismaClientKnownRequestError'
      ;(error as any).code = 'P2002'

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: 'Unique constraint violation',
          timestamp: expect.any(String)
        }
      })

      process.env.NODE_ENV = originalEnv
    })

    it('should not include Prisma error message in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Unique constraint violation')
      error.name = 'PrismaClientKnownRequestError'
      ;(error as any).code = 'P2002'

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: undefined,
          timestamp: expect.any(String)
        }
      })

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Generic error handling', () => {
    it('should handle generic Error with 500 status', () => {
      const error = new Error('Something went wrong')

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          timestamp: expect.any(String)
        }
      })
    })

    it('should log generic errors', () => {
      const error = new Error('Unexpected error')

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        error: 'Unexpected error',
        stack: expect.any(String),
        path: '/api/test',
        method: 'GET'
      })
    })

    it('should include timestamp in all error responses', () => {
      const errors = [
        new BadRequestError('Bad request'),
        new Error('Generic error'),
        Object.assign(new Error('Prisma'), { name: 'PrismaClientKnownRequestError' })
      ]

      errors.forEach(error => {
        jest.clearAllMocks()
        errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

        expect(jsonMock).toHaveBeenCalledWith({
          error: expect.objectContaining({
            timestamp: expect.any(String)
          })
        })
      })
    })
  })

  describe('Error logging', () => {
    it('should log request path and method', () => {
      const customReq = {
        path: '/api/users/123',
        method: 'DELETE'
      } as any
      const error = new Error('Test error')

      errorMiddleware(error, customReq as Request, mockRes as Response, mockNext)

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        error: 'Test error',
        stack: expect.any(String),
        path: '/api/users/123',
        method: 'DELETE'
      })
    })

    it('should log error stack trace', () => {
      const error = new Error('Test error')

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(logger.error).toHaveBeenCalledWith('Error occurred', 
        expect.objectContaining({
          stack: expect.stringContaining('Error: Test error')
        })
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle error without message', () => {
      const error = new Error()

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalled()
    })

    it('should handle null request path', () => {
      const customReq = {
        path: undefined,
        method: 'GET'
      } as any
      const error = new Error('Test')

      errorMiddleware(error, customReq as Request, mockRes as Response, mockNext)

      expect(logger.error).toHaveBeenCalledWith('Error occurred', 
        expect.objectContaining({
          path: undefined
        })
      )
    })

    it('should not call next function', () => {
      const error = new Error('Test')

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
    })
  })
})
