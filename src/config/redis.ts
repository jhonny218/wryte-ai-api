import IORedis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

// Parse URL and detect TLS needs. Some providers (eg. Upstash) accept TLS on port 6379
const redisUrl = env.REDIS_URL;
let redisOptions: any = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: true,
  lazyConnect: false, // connect immediately and keep connection alive
  // Exponential backoff for reconnect attempts
  retryStrategy(times: number) {
    return Math.min(10000, Math.pow(2, times) * 100);
  },
  reconnectOnError(err: any) {
    const code = err?.code;
    return code === 'ECONNRESET' || code === 'EPIPE' || code === 'ETIMEDOUT';
  },
};

try {
  if (redisUrl) {
    const parsed = new URL(redisUrl);
    const protocol = parsed.protocol; // redis: or rediss:
    const host = parsed.hostname || '';

    const explicitTls = (protocol === 'rediss:') || env.REDIS_TLS === 'true' || host.includes('upstash.io');
    if (explicitTls) {
      // ioredis accepts a `tls` option to enable TLS over the socket
      redisOptions.tls = { rejectUnauthorized: true };
    }
  }
} catch (err) {
  // If URL parsing fails, continue with default options and let connection emit errors
  logger.warn('Failed to parse REDIS_URL for TLS detection', { event: 'redis_parse_warn', error: (err as any).message });
}

const connection = new IORedis(redisUrl, redisOptions);

// Log connection lifecycle events
connection.on("connect", () => {
  logger.info("Redis connected", { event: "redis_connect" });
});

connection.on("ready", () => {
  logger.info("Redis ready", { event: "redis_ready" });
});

connection.on("error", (err) => {
  logger.error("Redis connection error", {
    event: "redis_error",
    error: err.message,
    code: (err as any).code,
  });
});

connection.on("close", () => {
  logger.warn("Redis connection closed", { event: "redis_close" });
});

connection.on("reconnecting", (delay: number) => {
  logger.info("Redis reconnecting", { event: "redis_reconnecting", delay });
});

connection.on("end", () => {
  logger.warn("Redis connection ended", { event: "redis_end" });
});

export { connection };
