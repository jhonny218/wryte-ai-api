import winston from "winston";
import { env } from "../config/env";
import { trace, context } from "@opentelemetry/api";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const envLevel = env.LOG_LEVEL;
  return envLevel || "info";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Custom format to inject OpenTelemetry trace context
const otelFormat = winston.format((info) => {
  const span = trace.getSpan(context.active());
  if (span) {
    const spanContext = span.spanContext();
    info.traceId = spanContext.traceId;
    info.spanId = spanContext.spanId;
    info.traceFlags = spanContext.traceFlags;
  }
  return info;
});

// Development format: colored, human-readable
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  otelFormat(),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, traceId, ...meta } = info;
    const reqIdStr = requestId ? ` [${requestId}]` : "";
    const traceStr = traceId ? ` [trace:${String(traceId).slice(0, 8)}]` : "";
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp}${reqIdStr}${traceStr} ${level}: ${message}${metaStr}`;
  })
);

// Production format: JSON for log aggregators
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  otelFormat(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// File format: uncolorized with JSON for structured logging
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  otelFormat(),
  winston.format.errors({ stack: true }),
  winston.format.uncolorize(),
  winston.format.json()
);

const isProduction = env.NODE_ENV === "production";

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? prodFormat : devFormat,
  }),
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: fileFormat,
  }),
  new winston.transports.File({
    filename: "logs/all.log",
    format: fileFormat,
  }),
];

export const logger = winston.createLogger({
  level: level(),
  levels,
  defaultMeta: { service: "wryte-api" },
  transports,
});

// Child logger factory for adding request context
export function createRequestLogger(requestId: string, meta?: Record<string, unknown>) {
  return logger.child({ requestId, ...meta });
}
