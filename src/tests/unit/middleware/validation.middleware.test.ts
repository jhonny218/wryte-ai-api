import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validate } from '../../../middleware/validation.middleware'
import { BadRequestError } from '../../../utils/errors'

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {}
    }
    mockRes = {}
    mockNext = jest.fn()
    jest.clearAllMocks()
  })

  describe('Body validation', () => {
    it('should validate valid body data', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      mockReq.body = { name: 'John', age: 30 }

      const middleware = validate(schema, 'body')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.body).toEqual({ name: 'John', age: 30 })
    })

    it('should replace body with validated data', async () => {
      const schema = z.object({
        email: z.string().email(),
        count: z.number().default(10)
      })

      mockReq.body = { email: 'test@example.com' }

      const middleware = validate(schema, 'body')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.body).toEqual({ email: 'test@example.com', count: 10 })
    })

    it('should throw BadRequestError for invalid body data', async () => {
      const schema = z.object({
        age: z.number()
      })

      mockReq.body = { age: 'not a number' }

      const middleware = validate(schema, 'body')

      await expect(
        middleware(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(BadRequestError)
    })

    it('should include field name in validation error', async () => {
      const schema = z.object({
        email: z.string().email()
      })

      mockReq.body = { email: 'invalid-email' }

      const middleware = validate(schema, 'body')

      try {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).details).toContainEqual(
          expect.objectContaining({ field: 'email' })
        )
      }
    })

    it('should handle nested validation errors', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email()
        })
      })

      mockReq.body = {
        user: {
          name: 'John',
          email: 'invalid'
        }
      }

      const middleware = validate(schema, 'body')

      try {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).details).toContainEqual(
          expect.objectContaining({ field: 'user.email' })
        )
      }
    })

    it('should validate and transform data', async () => {
      const schema = z.object({
        name: z.string().transform(s => s.toUpperCase()),
        age: z.string().transform(Number)
      })

      mockReq.body = { name: 'john', age: '25' }

      const middleware = validate(schema, 'body')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.body).toEqual({ name: 'JOHN', age: 25 })
    })
  })

  describe('Query validation', () => {
    it('should validate query parameters', async () => {
      const schema = z.object({
        page: z.string(),
        limit: z.string()
      })

      mockReq.query = { page: '1', limit: '10' }

      const middleware = validate(schema, 'query')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.query).toEqual({ page: '1', limit: '10' })
    })

    it('should transform query parameters', async () => {
      const schema = z.object({
        page: z.string().transform(Number),
        limit: z.string().transform(Number)
      })

      mockReq.query = { page: '2', limit: '20' }

      const middleware = validate(schema, 'query')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.query).toEqual({ page: 2, limit: 20 })
    })

    it('should throw error for invalid query parameters', async () => {
      const schema = z.object({
        id: z.string().min(5)
      })

      mockReq.query = { id: 'abc' }

      const middleware = validate(schema, 'query')

      await expect(
        middleware(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(BadRequestError)
    })
  })

  describe('Params validation', () => {
    it('should validate route parameters', async () => {
      const schema = z.object({
        id: z.string().uuid()
      })

      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const middleware = validate(schema, 'params')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should throw error for invalid params', async () => {
      const schema = z.object({
        id: z.string().uuid()
      })

      mockReq.params = { id: 'not-a-uuid' }

      const middleware = validate(schema, 'params')

      await expect(
        middleware(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(BadRequestError)
    })
  })

  describe('Default source behavior', () => {
    it('should default to validating body', async () => {
      const schema = z.object({
        field: z.string()
      })

      mockReq.body = { field: 'value' }

      const middleware = validate(schema) // No source specified
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.body).toEqual({ field: 'value' })
    })
  })

  describe('Error formatting', () => {
    it('should format single field error', async () => {
      const schema = z.object({
        email: z.string().email()
      })

      mockReq.body = { email: 'bad-email' }

      const middleware = validate(schema, 'body')

      try {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
        fail('Should have thrown')
      } catch (error) {
        const badRequestError = error as BadRequestError
        expect(badRequestError.message).toBe('Validation failed')
        expect(badRequestError.details).toHaveLength(1)
        expect(badRequestError.details[0]).toEqual({
          field: 'email',
          message: expect.any(String)
        })
      }
    })

    it('should format multiple field errors', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
        name: z.string().min(2)
      })

      mockReq.body = { email: 'bad', age: 10, name: 'a' }

      const middleware = validate(schema, 'body')

      try {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
        fail('Should have thrown')
      } catch (error) {
        const badRequestError = error as BadRequestError
        expect(badRequestError.details).toHaveLength(3)
      }
    })

    it('should include field path for nested errors', async () => {
      const schema = z.object({
        address: z.object({
          street: z.string().min(1),
          city: z.string().min(1)
        })
      })

      mockReq.body = { address: { street: '', city: '' } }

      const middleware = validate(schema, 'body')

      try {
        await middleware(mockReq as Request, mockRes as Response, mockNext)
        fail('Should have thrown')
      } catch (error) {
        const badRequestError = error as BadRequestError
        expect(badRequestError.details).toBeDefined()
        expect(badRequestError.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: expect.stringContaining('address') })
          ])
        )
      }
    })
  })

  describe('Complex schemas', () => {
    it('should validate optional fields', async () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      mockReq.body = { required: 'value' }

      const middleware = validate(schema, 'body')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should validate arrays', async () => {
      const schema = z.object({
        tags: z.array(z.string())
      })

      mockReq.body = { tags: ['tag1', 'tag2', 'tag3'] }

      const middleware = validate(schema, 'body')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.body).toEqual({ tags: ['tag1', 'tag2', 'tag3'] })
    })

    it('should validate enums', async () => {
      const schema = z.object({
        role: z.enum(['ADMIN', 'USER', 'GUEST'])
      })

      mockReq.body = { role: 'ADMIN' }

      const middleware = validate(schema, 'body')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should fail for invalid enum value', async () => {
      const schema = z.object({
        role: z.enum(['ADMIN', 'USER'])
      })

      mockReq.body = { role: 'INVALID' }

      const middleware = validate(schema, 'body')

      await expect(
        middleware(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(BadRequestError)
    })

    it('should validate with refinements', async () => {
      const schema = z.object({
        password: z.string(),
        confirmPassword: z.string()
      }).refine(data => data.password === data.confirmPassword, {
        message: 'Passwords must match',
        path: ['confirmPassword']
      })

      mockReq.body = { password: 'secret', confirmPassword: 'different' }

      const middleware = validate(schema, 'body')

      await expect(
        middleware(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(BadRequestError)
    })
  })

  describe('Non-Zod errors', () => {
    it('should pass non-Zod errors to next', async () => {
      const schema = z.object({}).transform(() => {
        throw new Error('Custom error')
      })

      mockReq.body = {}

      const middleware = validate(schema, 'body')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expect(mockNext).not.toHaveBeenCalledWith()
    })
  })

  describe('Async validation', () => {
    it('should handle async schema validation', async () => {
      const schema = z.object({
        email: z.string().email().refine(async (email) => {
          // Simulate async check
          await new Promise(resolve => setTimeout(resolve, 10))
          return !email.includes('blocked')
        }, { message: 'Email is blocked' })
      })

      mockReq.body = { email: 'valid@example.com' }

      const middleware = validate(schema, 'body')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should fail async validation when appropriate', async () => {
      const schema = z.object({
        email: z.string().email().refine(async (email) => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return !email.includes('blocked')
        }, { message: 'Email is blocked' })
      })

      mockReq.body = { email: 'blocked@example.com' }

      const middleware = validate(schema, 'body')

      await expect(
        middleware(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(BadRequestError)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty object validation', async () => {
      const schema = z.object({})

      mockReq.body = {}

      const middleware = validate(schema, 'body')
      await middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should handle undefined request source', async () => {
      const schema = z.object({ field: z.string().optional() })

      mockReq.body = undefined as any

      const middleware = validate(schema, 'body')

      // Should attempt to validate undefined
      await expect(
        middleware(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow()
    })

    it('should strip unknown fields with strict schema', async () => {
      const schema = z.object({
        allowed: z.string()
      }).strict()

      mockReq.body = { allowed: 'value', unknown: 'field' }

      const middleware = validate(schema, 'body')

      await expect(
        middleware(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(BadRequestError)
    })
  })
})
