import IORedis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false, // Skip ready check to reduce requests
  lazyConnect: true, // Don't connect until first command (reduces initial requests)
});

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
