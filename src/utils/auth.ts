import { Request } from 'express'
import { getAuth } from '@clerk/express'

/**
 * Get user ID from Clerk or test auth middleware.
 *
 * Prefer calling Clerk's `getAuth` (so tests that mock it will see the call).
 * Fallback to `req.auth.userId` if `getAuth` is not available or throws.
 */
export function getUserId(req: Request): string | null {
  try {
    const auth = getAuth(req as any);
    if (auth?.userId) return auth.userId;
  } catch (err) {
    // ignore and fallback to test middleware
  }

  return (req as any).auth?.userId || null;
}
