import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log the request immediately
  // logger.http(`Incoming: ${req.method} ${req.url}`);

  // Log the response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

    logger.http(message);
  });

  next();
};
