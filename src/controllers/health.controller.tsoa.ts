import { Route, Get, Tags, Response, SuccessResponse } from 'tsoa';
import { HealthCheckResponse } from '../types/api.types';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

@Route('health')
@Tags('Health')
export class HealthController {
  /**
   * Health check endpoint
   * @summary Check API health status
   * @returns Health status information
   */
  @Get()
  @SuccessResponse(200, 'API is healthy')
  @Response<{ message: string }>(503, 'Service unavailable')
  public async getHealth(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected';
    let redisStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      logger.error('Database health check failed', error);
    }

    // TODO: Add Redis health check when Redis client is available
    // try {
    //   await redisClient.ping();
    //   redisStatus = 'connected';
    // } catch (error) {
    //   logger.error('Redis health check failed', error);
    // }

    const status = databaseStatus === 'connected' ? 'ok' : 'error';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: databaseStatus,
      redis: redisStatus,
    };
  }

  /**
   * Simple ping endpoint
   * @summary Quick health ping
   * @returns Pong response
   */
  @Get('ping')
  @SuccessResponse(200, 'Pong')
  public async ping(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }
}
