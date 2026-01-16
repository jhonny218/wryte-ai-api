import { Request } from 'express'
import { getAuth } from '@clerk/express'

/**
 * Get user ID from either Clerk (production) or test auth middleware
 */
export function getUserId(req: Request): string | null {
  if (process.env.NODE_ENV === 'test') {
    return (req as any).auth?.userId || null
  }
  
  const auth = getAuth(req)
  return auth.userId
}
