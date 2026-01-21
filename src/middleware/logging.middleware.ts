import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = req.log || logger;

    try {
      log.http("Request completed", {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        contentLength: res.get("content-length"),
      });
    } catch {
      // Silently fail if logger is unavailable
    }
  });

  next();
}
