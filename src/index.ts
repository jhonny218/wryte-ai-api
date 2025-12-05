import "dotenv/config";
import { startServer } from "./server";
import { startWorkers } from "./workers";
import { logger } from "./utils/logger";

async function bootstrap() {
  try {
    // Start Express server
    await startServer()

    // Start BullMQ workers
    await startWorkers()

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
