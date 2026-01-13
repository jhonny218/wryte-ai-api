import { logger } from "./utils/logger";
import { titleGenerationWorker } from "./workers/title-generation.worker";
import { outlineGenerationWorker } from "./workers/outline-generation.worker";
import { blogGenerationWorker } from "./workers/blog-generation.worker";

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

  outlineGenerationWorker.on('active', (job) => {
    logger.info(`[Outline Job ${job.id}] Processing ${job.name}...`);
  });

  outlineGenerationWorker.on('completed', (job) => {
    logger.info(`[Outline Job ${job.id}] Completed successfully`);
  });

  outlineGenerationWorker.on('failed', (job, err) => {
    logger.error(`[Outline Job ${job?.id}] Failed: ${err.message}`);
  });

  blogGenerationWorker.on('active', (job) => {
    logger.info(`[Blog Job ${job.id}] Processing ${job.name}...`);
  });

  blogGenerationWorker.on('completed', (job) => {
    logger.info(`[Blog Job ${job.id}] Completed successfully`);
  });

  blogGenerationWorker.on('failed', (job, err) => {
    logger.error(`[Blog Job ${job?.id}] Failed: ${err.message}`);
  });

  logger.info("👷 Workers started and listening for jobs");
}
