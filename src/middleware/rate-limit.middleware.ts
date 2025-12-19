import { Request, Response, NextFunction } from 'express';
import { connection } from '../config/redis';

const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_WINDOW_REQUEST_COUNT = 20;

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || 'unknown';
    const key = `rate-limit:${ip}`;

    const currentCount = await connection.incr(key);

    if (currentCount === 1) {
      await connection.expire(key, WINDOW_SIZE_IN_SECONDS);
    }

    if (currentCount > MAX_WINDOW_REQUEST_COUNT) {
      res.status(429).json({
        status: 'error',
        message: 'Too many requests, please try again later.',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Rate Limit Error:', error);
    // Fail open if Redis is down
    next();
  }
};
