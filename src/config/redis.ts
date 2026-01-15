import IORedis from 'ioredis';
import { env } from './env';

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false, // Skip ready check to reduce requests
  lazyConnect: true, // Don't connect until first command (reduces initial requests)
});

// Log connection status
connection.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Redis connected');
  }
});

connection.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Redis connection error:', err.message);
  }
});

export { connection };
