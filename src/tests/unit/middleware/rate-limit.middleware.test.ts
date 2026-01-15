import { Request, Response, NextFunction } from 'express'
import { rateLimitMiddleware } from '../../../middleware/rate-limit.middleware'
import { connection } from '../../../config/redis'

jest.mock('../../../config/redis', () => ({
  connection: {
    incr: jest.fn(),
    expire: jest.fn()
  }
}))

describe('Rate Limit Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })

    mockReq = {
      ip: '192.168.1.1'
    } as any
    mockRes = {
      status: statusMock
    } as any
    mockNext = jest.fn()

    jest.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('should call next for first request within limit', async () => {
      (connection.incr as jest.Mock).mockResolvedValue(1)

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(connection.incr).toHaveBeenCalledWith('rate-limit:192.168.1.1')
      expect(connection.expire).toHaveBeenCalledWith('rate-limit:192.168.1.1', 60)
      expect(mockNext).toHaveBeenCalled()
      expect(statusMock).not.toHaveBeenCalled()
    })

    it('should set expiry on first request', async () => {
      (connection.incr as jest.Mock).mockResolvedValue(1)

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(connection.expire).toHaveBeenCalledWith('rate-limit:192.168.1.1', 60)
    })

    it('should not set expiry on subsequent requests', async () => {
      (connection.incr as jest.Mock).mockResolvedValue(5)

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(connection.expire).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })

    it('should allow requests up to the limit', async () => {
      (connection.incr as jest.Mock).mockResolvedValue(20)

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(statusMock).not.toHaveBeenCalled()
    })
  })

  describe('Rate limiting', () => {
    it('should block request when limit exceeded', async () => {
      (connection.incr as jest.Mock).mockResolvedValue(21)

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(429)
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Too many requests, please try again later.'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should block request when significantly over limit', async () => {
      (connection.incr as jest.Mock).mockResolvedValue(100)

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(429)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should block at exactly limit + 1', async () => {
      (connection.incr as jest.Mock).mockResolvedValue(21)

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(429)
    })
  })

  describe('IP address handling', () => {
    it('should use request IP for rate limit key', async () => {
      const customReq = { ip: '10.0.0.5' } as any
      ;(connection.incr as jest.Mock).mockResolvedValue(1)

      await rateLimitMiddleware(customReq as Request, mockRes as Response, mockNext)

      expect(connection.incr).toHaveBeenCalledWith('rate-limit:10.0.0.5')
    })

    it('should handle IPv6 addresses', async () => {
      const customReq = { ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' } as any
      ;(connection.incr as jest.Mock).mockResolvedValue(1)

      await rateLimitMiddleware(customReq as Request, mockRes as Response, mockNext)

      expect(connection.incr).toHaveBeenCalledWith(
        'rate-limit:2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      )
    })

    it('should use "unknown" when IP is undefined', async () => {
      const customReq = {} as any
      ;(connection.incr as jest.Mock).mockResolvedValue(1)

      await rateLimitMiddleware(customReq as Request, mockRes as Response, mockNext)

      expect(connection.incr).toHaveBeenCalledWith('rate-limit:unknown')
    })

    it('should use "unknown" when IP is empty string', async () => {
      const customReq = { ip: '' } as any
      ;(connection.incr as jest.Mock).mockResolvedValue(1)

      await rateLimitMiddleware(customReq as Request, mockRes as Response, mockNext)

      expect(connection.incr).toHaveBeenCalledWith('rate-limit:unknown')
    })

    it('should handle different IPs independently', async () => {
      // First IP
      const customReq1 = { ip: '192.168.1.1' } as any
      ;(connection.incr as jest.Mock).mockResolvedValue(1)

      await rateLimitMiddleware(customReq1 as Request, mockRes as Response, mockNext)

      expect(connection.incr).toHaveBeenCalledWith('rate-limit:192.168.1.1')

      // Second IP
      jest.clearAllMocks()
      const customReq2 = { ip: '192.168.1.2' } as any
      ;(connection.incr as jest.Mock).mockResolvedValue(1)

      await rateLimitMiddleware(customReq2 as Request, mockRes as Response, mockNext)

      expect(connection.incr).toHaveBeenCalledWith('rate-limit:192.168.1.2')
    })
  })

  describe('Error handling', () => {
    it('should fail open when Redis incr fails', async () => {
      (connection.incr as jest.Mock).mockRejectedValue(new Error('Redis error'))

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(statusMock).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Rate Limit Error:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('should fail open when Redis expire fails', async () => {
      (connection.incr as jest.Mock).mockResolvedValue(1)
      ;(connection.expire as jest.Mock).mockRejectedValue(new Error('Expire error'))

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should log error when Redis fails', async () => {
      const error = new Error('Connection timeout')
      ;(connection.incr as jest.Mock).mockRejectedValue(error)

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Rate Limit Error:', error)

      consoleErrorSpy.mockRestore()
    })

    it('should not throw when error occurs', async () => {
      (connection.incr as jest.Mock).mockRejectedValue(new Error('Redis down'))

      await expect(
        rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)
      ).resolves.not.toThrow()
    })
  })

  describe('Window size and limits', () => {
    it('should use 60 second window', async () => {
      (connection.incr as jest.Mock).mockResolvedValue(1)

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(connection.expire).toHaveBeenCalledWith(expect.any(String), 60)
    })

    it('should enforce 20 requests per window', async () => {
      // Request 20 - should pass
      ;(connection.incr as jest.Mock).mockResolvedValue(20)
      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalled()

      // Request 21 - should be blocked
      jest.clearAllMocks()
      ;(connection.incr as jest.Mock).mockResolvedValue(21)
      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)
      expect(statusMock).toHaveBeenCalledWith(429)
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle rapid successive requests', async () => {
      for (let i = 1; i <= 20; i++) {
        jest.clearAllMocks()
        ;(connection.incr as jest.Mock).mockResolvedValue(i)

        await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

        expect(mockNext).toHaveBeenCalled()
      }

      // 21st request should be blocked
      jest.clearAllMocks()
      ;(connection.incr as jest.Mock).mockResolvedValue(21)

      await rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(429)
    })

    it('should handle requests from load balancer with X-Forwarded-For', async () => {
      const customReq = { ip: '172.16.0.1' } as any // Load balancer IP
      ;(connection.incr as jest.Mock).mockResolvedValue(1)

      await rateLimitMiddleware(customReq as Request, mockRes as Response, mockNext)

      expect(connection.incr).toHaveBeenCalledWith('rate-limit:172.16.0.1')
    })

    it('should maintain separate counts for different IPs', async () => {
      // First IP at limit
      const customReq1 = { ip: '192.168.1.100' } as any
      ;(connection.incr as jest.Mock).mockResolvedValue(20)
      await rateLimitMiddleware(customReq1 as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalled()

      // Second IP should start fresh
      jest.clearAllMocks()
      const customReq2 = { ip: '192.168.1.101' } as any
      ;(connection.incr as jest.Mock).mockResolvedValue(1)
      await rateLimitMiddleware(customReq2 as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })
  })
})
