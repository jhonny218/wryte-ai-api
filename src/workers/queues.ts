import { Queue, QueueEvents } from "bullmq";
import { connection } from "../config/redis";
import { QueueName } from "../types/jobs";
import { logger } from "../utils/logger";

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
  removeOnComplete: {
    age: 24 * 3600, // Keep for 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 24 * 3600 * 7, // Keep failed jobs for 7 days
  },
};

export const titleGenerationQueue = new Queue(QueueName.TITLE_GENERATION, {
  connection,
  defaultJobOptions,
});

export const outlineGenerationQueue = new Queue(QueueName.OUTLINE_GENERATION, {
  connection,
  defaultJobOptions,
});

export const blogGenerationQueue = new Queue(QueueName.BLOG_GENERATION, {
  connection,
  defaultJobOptions,
});

// Queue event listeners for observability
function setupQueueEvents(_queue: Queue, queueName: string) {
  const queueEvents = new QueueEvents(queueName, { connection });

  queueEvents.on("waiting", ({ jobId }) => {
    logger.debug("Job waiting", { event: "job_waiting", queue: queueName, jobId });
  });

  queueEvents.on("active", ({ jobId, prev }) => {
    logger.info("Job started", {
      event: "job_active",
      queue: queueName,
      jobId,
      previousState: prev,
    });
  });

  queueEvents.on("completed", ({ jobId, returnvalue }) => {
    logger.info("Job completed", {
      event: "job_completed",
      queue: queueName,
      jobId,
      result: returnvalue,
    });
  });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    logger.error("Job failed", {
      event: "job_failed",
      queue: queueName,
      jobId,
      reason: failedReason,
    });
  });

  queueEvents.on("stalled", ({ jobId }) => {
    logger.warn("Job stalled", {
      event: "job_stalled",
      queue: queueName,
      jobId,
    });
  });

  queueEvents.on("retries-exhausted", ({ jobId, attemptsMade }) => {
    logger.error("Job retries exhausted", {
      event: "job_retries_exhausted",
      queue: queueName,
      jobId,
      attemptsMade,
    });
  });

  queueEvents.on("error", (error) => {
    logger.error("Queue error", {
      event: "queue_error",
      queue: queueName,
      error: error.message,
    });
  });

  return queueEvents;
}

// Initialize queue events (only in non-test environments)
let queueEventsInstances: QueueEvents[] = [];

export function initializeQueueEvents() {
  if (process.env.NODE_ENV === "test") return;

  queueEventsInstances = [
    setupQueueEvents(titleGenerationQueue, QueueName.TITLE_GENERATION),
    setupQueueEvents(outlineGenerationQueue, QueueName.OUTLINE_GENERATION),
    setupQueueEvents(blogGenerationQueue, QueueName.BLOG_GENERATION),
  ];

  logger.info("Queue events initialized", {
    event: "queue_events_init",
    queues: [
      QueueName.TITLE_GENERATION,
      QueueName.OUTLINE_GENERATION,
      QueueName.BLOG_GENERATION,
    ],
  });
}

export async function closeQueueEvents() {
  await Promise.all(queueEventsInstances.map((qe) => qe.close()));
  queueEventsInstances = [];
}
