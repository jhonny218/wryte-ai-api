import { Request, Response, NextFunction } from 'express'
import { loggingMiddleware } from '../../../middleware/logging.middleware'
import { logger } from '../../../utils/logger'

jest.mock('../../../utils/logger')

describe('Logging Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction
  let eventListeners: { [key: string]: Function }

  beforeEach(() => {
    eventListeners = {}

    mockReq = {
      method: 'GET',
      url: '/api/test',
      originalUrl: '/api/test?param=value'
    }

    mockRes = {
      on: jest.fn((event: string, handler: Function) => {
        eventListeners[event] = handler
        return mockRes as Response
      }),
      statusCode: 200
    } as any

    mockNext = jest.fn()
    jest.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('should call next immediately', () => {
      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should register finish event listener', () => {
      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function))
    })

    it('should log response when finish event is emitted', () => {
      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)

      // Trigger finish event
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalled()
    })

    it('should log with correct format', () => {
      mockReq.method = 'POST'
      mockReq.originalUrl = '/api/users'
      mockRes.statusCode = 201

      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/users 201')
      )
    })

    it('should include duration in milliseconds', () => {
      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)

      // Simulate some processing time
      jest.advanceTimersByTime(150)

      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalledWith(
        expect.stringContaining('ms')
      )
    })
  })

  describe('Different HTTP methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

    methods.forEach(method => {
      it(`should log ${method} requests`, () => {
        mockReq.method = method

        loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
        eventListeners['finish']?.()

        expect(logger.http).toHaveBeenCalledWith(
          expect.stringContaining(method)
        )
      })
    })
  })

  describe('Different status codes', () => {
    const statusCodes = [200, 201, 400, 401, 404, 500]

    statusCodes.forEach(statusCode => {
      it(`should log status code ${statusCode}`, () => {
        mockRes.statusCode = statusCode

        loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
        eventListeners['finish']?.()

        expect(logger.http).toHaveBeenCalledWith(
          expect.stringContaining(String(statusCode))
        )
      })
    })
  })

  describe('URL logging', () => {
    it('should log original URL with query parameters', () => {
      mockReq.originalUrl = '/api/search?q=test&limit=10'

      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalledWith(
        expect.stringContaining('/api/search?q=test&limit=10')
      )
    })

    it('should log URL without query parameters if not present', () => {
      mockReq.originalUrl = '/api/users/123'

      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/123')
      )
    })

    it('should prefer originalUrl over url', () => {
      mockReq.url = '/api/simple'
      mockReq.originalUrl = '/api/original'

      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalledWith(
        expect.stringContaining('/api/original')
      )
    })
  })

  describe('Duration calculation', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should calculate duration correctly for fast requests', () => {
      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)

      jest.advanceTimersByTime(10)
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalledWith(
        expect.stringMatching(/\d+ms$/)
      )
    })

    it('should calculate duration correctly for slow requests', () => {
      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)

      jest.advanceTimersByTime(5000)
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalledWith(
        expect.stringContaining('5000ms')
      )
    })

    it('should handle zero duration', () => {
      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)

      // Don't advance time
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalledWith(
        expect.stringMatching(/0ms$/)
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle missing originalUrl', () => {
      const customReq = {
        method: 'GET',
        url: '/api/test'
      } as any

      loggingMiddleware(customReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalled()
    })

    it('should handle undefined status code', () => {
      mockRes.statusCode = undefined as any

      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalled()
    })

    it('should not throw if logger is unavailable', () => {
      (logger.http as jest.Mock).mockImplementation(() => {
        throw new Error('Logger error')
      })

      expect(() => {
        loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
        eventListeners['finish']?.()
      }).not.toThrow()
    })
  })

  describe('Multiple requests', () => {
    it('should log each request independently', () => {
      // First request
      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalledTimes(1)

      // Second request
      jest.clearAllMocks()
      mockReq.method = 'POST'
      mockReq.originalUrl = '/api/different'

      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      expect(logger.http).toHaveBeenCalledTimes(1)
      expect(logger.http).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/different')
      )
    })
  })

  describe('Real-world scenarios', () => {
    it('should log successful GET request', () => {
      mockReq.method = 'GET'
      mockReq.originalUrl = '/api/users/123'
      mockRes.statusCode = 200

      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      const logCall = (logger.http as jest.Mock).mock.calls[0][0]
      expect(logCall).toMatch(/^GET \/api\/users\/123 200 \d+ms$/)
    })

    it('should log failed POST request', () => {
      mockReq.method = 'POST'
      mockReq.originalUrl = '/api/users'
      mockRes.statusCode = 400

      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      const logCall = (logger.http as jest.Mock).mock.calls[0][0]
      expect(logCall).toMatch(/^POST \/api\/users 400 \d+ms$/)
    })

    it('should log server error', () => {
      mockReq.method = 'DELETE'
      mockReq.originalUrl = '/api/resource/456'
      mockRes.statusCode = 500

      loggingMiddleware(mockReq as Request, mockRes as Response, mockNext)
      eventListeners['finish']?.()

      const logCall = (logger.http as jest.Mock).mock.calls[0][0]
      expect(logCall).toMatch(/^DELETE \/api\/resource\/456 500 \d+ms$/)
    })
  })
})
