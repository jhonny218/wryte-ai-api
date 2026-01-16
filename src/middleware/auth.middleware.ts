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
