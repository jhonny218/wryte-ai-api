import { HealthController } from '../../../controllers/health.controller.tsoa';
import { prisma } from '../../../utils/prisma';
import { logger } from '../../../utils/logger';

jest.mock('../../../utils/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('HealthController (TSOA)', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
    jest.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return healthy status when database is connected', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);

      const result = await controller.getHealth();

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.redis).toBe('disconnected'); // Redis not implemented yet
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('number');
    });

    it('should return error status when database connection fails', async () => {
      const dbError = new Error('Connection refused');
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(dbError);

      const result = await controller.getHealth();

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Database health check failed', dbError);
      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
    });

    it('should include timestamp in ISO format', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);

      const result = await controller.getHealth();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include uptime as a positive number', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);

      const result = await controller.getHealth();

      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ping', () => {
    it('should return pong message', async () => {
      const result = await controller.ping();

      expect(result.message).toBe('pong');
      expect(result.timestamp).toBeDefined();
    });

    it('should include timestamp in ISO format', async () => {
      const result = await controller.ping();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return consistent structure', async () => {
      const result = await controller.ping();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(Object.keys(result)).toHaveLength(2);
    });
  });
});
