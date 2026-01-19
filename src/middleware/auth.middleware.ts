import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { UnauthorizedError } from '../utils/errors';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // In test mode, check if auth was already set by test middleware
  if (process.env.NODE_ENV === 'test' && (req as any).auth?.userId) {
    return next();
  }

  const { userId } = getAuth(req);

  if (!userId) {
    throw new UnauthorizedError('You must be signed in to access this resource');
  }

  next();
};

/**
 * TSOA expects an `expressAuthentication` export when using @Security decorators.
 * Provide a small adapter that returns a boolean/Promise<boolean> indicating
 * whether the request is authenticated. This keeps generated routes working
 * while reusing Clerk's `getAuth` logic.
 */
export const expressAuthentication = async (
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<boolean> => {
  try {
    // test-mode bypass
    if (process.env.NODE_ENV === 'test' && (request as any).auth?.userId) return true;

    const { userId } = getAuth(request as any);
    return !!userId;
  } catch (err) {
    return false;
  }
};
