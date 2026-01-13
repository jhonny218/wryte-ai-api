import { Queue } from 'bullmq';
import { connection } from '../config/redis';
import { QueueName } from '../types/jobs';

export const titleGenerationQueue = new Queue(QueueName.TITLE_GENERATION, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 3600 * 7, // Keep failed jobs for 7 days
    }
  },
});

export const outlineGenerationQueue = new Queue(QueueName.OUTLINE_GENERATION, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 3600 * 7, // Keep failed jobs for 7 days
    }
  },
});

export const blogGenerationQueue = new Queue(QueueName.BLOG_GENERATION, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 3600 * 7, // Keep failed jobs for 7 days
    }
  },
});
