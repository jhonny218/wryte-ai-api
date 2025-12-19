import { logger } from "./utils/logger";
import { titleGenerationWorker } from "./workers/title-generation.worker";

export async function startWorkers() {
  logger.info("👷 Workers initializing...");

  // Attach event listeners to monitor worker health
  titleGenerationWorker.on('active', (job) => {
    logger.info(`[Job ${job.id}] Processing ${job.name}...`);
  });

  titleGenerationWorker.on('completed', (job) => {
    logger.info(`[Job ${job.id}] Completed successfully`);
  });

  titleGenerationWorker.on('failed', (job, err) => {
    logger.error(`[Job ${job?.id}] Failed: ${err.message}`);
  });

  logger.info("👷 Workers started and listening for jobs");
}
