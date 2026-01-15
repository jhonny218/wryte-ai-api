import { Request, Response, NextFunction } from 'express'
import { requireAuth } from '../../../middleware/auth.middleware'
import { getAuth } from '@clerk/express'
import { UnauthorizedError } from '../../../utils/errors'

jest.mock('@clerk/express')

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {}
    mockRes = {}
    mockNext = jest.fn()
    jest.clearAllMocks()
  })

  describe('requireAuth', () => {
    it('should call next when userId is present', () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' })

      requireAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(getAuth).toHaveBeenCalledWith(mockReq)
      expect(mockNext).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should throw UnauthorizedError when userId is null', () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: null })

      expect(() => {
        requireAuth(mockReq as Request, mockRes as Response, mockNext)
      }).toThrow(UnauthorizedError)

      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedError when userId is undefined', () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: undefined })

      expect(() => {
        requireAuth(mockReq as Request, mockRes as Response, mockNext)
      }).toThrow(UnauthorizedError)

      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should throw error with correct message', () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: null })

      expect(() => {
        requireAuth(mockReq as Request, mockRes as Response, mockNext)
      }).toThrow('You must be signed in to access this resource')
    })

    it('should call getAuth with request object', () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: 'user_456' })

      requireAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(getAuth).toHaveBeenCalledTimes(1)
      expect(getAuth).toHaveBeenCalledWith(mockReq)
    })

    it('should handle empty string userId as falsy', () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: '' })

      expect(() => {
        requireAuth(mockReq as Request, mockRes as Response, mockNext)
      }).toThrow(UnauthorizedError)
    })

    it('should pass through valid userId without modification', () => {
      const validUserId = 'user_abc123def456'
      ;(getAuth as jest.Mock).mockReturnValue({ userId: validUserId })

      requireAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(getAuth).toHaveBeenCalledWith(mockReq)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should work with different userId formats', () => {
      const userIds = [
        'user_123',
        'user_abc',
        'clerk_user_id_123',
        'authenticated-user-456'
      ]

      userIds.forEach(userId => {
        jest.clearAllMocks()
        ;(getAuth as jest.Mock).mockReturnValue({ userId })

        requireAuth(mockReq as Request, mockRes as Response, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })
    })
  })
})
