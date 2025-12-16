import type { Request, Response, NextFunction } from 'express'
import { ZodError, type ZodType } from 'zod'
import { BadRequestError } from '../utils/errors'

/**
 * Express middleware factory for validating request data with Zod schemas
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate ('body' | 'query' | 'params')
 */
export function validate(schema: ZodType, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source]
      
      // Validate and parse the data
      const validated = await schema.parseAsync(data)
      
      // Replace request data with validated & typed data
      req[source] = validated
      
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
        
        throw new BadRequestError('Validation failed', formattedErrors)
      }
      
      next(error)
    }
  }
}
