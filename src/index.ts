import "dotenv/config";
import { startServer } from "./server";
import { startWorkers } from "./workers";
import { logger } from "./utils/logger";
import { env } from "./config/env";

async function bootstrap() {
  try {
    // Start Express server
    await startServer()

    // Start BullMQ workers (controlled by RUN_WORKERS flag)
    if (env.RUN_WORKERS) {
      await startWorkers()
    } else {
      logger.info('⏸️  Workers disabled (RUN_WORKERS=false)')
    }

    logger.info('🚀 Application started successfully')
  } catch (error) {
    logger.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  // Close database connections, workers, etc.
  process.exit(0)
})

bootstrap();
