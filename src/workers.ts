import { logger } from "./utils/logger";
import { titleGenerationWorker } from "./workers/title-generation.worker";
import { outlineGenerationWorker } from "./workers/outline-generation.worker";
import { blogGenerationWorker } from "./workers/blog-generation.worker";
import { initializeQueueEvents, closeQueueEvents } from "./workers/queues";

export async function startWorkers() {
  logger.info("Workers initializing", { event: "workers_init" });

  // Initialize queue event listeners for observability
  initializeQueueEvents();

  // Log worker error events
  titleGenerationWorker.on("error", (err) => {
    logger.error("Title generation worker error", {
      event: "worker_error",
      worker: "title-generation",
      error: err.message,
    });
  });

  outlineGenerationWorker.on("error", (err) => {
    logger.error("Outline generation worker error", {
      event: "worker_error",
      worker: "outline-generation",
      error: err.message,
    });
  });

  blogGenerationWorker.on("error", (err) => {
    logger.error("Blog generation worker error", {
      event: "worker_error",
      worker: "blog-generation",
      error: err.message,
    });
  });

  logger.info("Workers started", {
    event: "workers_started",
    workers: ["title-generation", "outline-generation", "blog-generation"],
  });
}

export async function stopWorkers() {
  logger.info("Workers stopping", { event: "workers_stopping" });

  await Promise.all([
    titleGenerationWorker.close(),
    outlineGenerationWorker.close(),
    blogGenerationWorker.close(),
  ]);

  await closeQueueEvents();

  logger.info("Workers stopped", { event: "workers_stopped" });
}
