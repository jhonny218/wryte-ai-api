import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { createRequestLogger } from "../utils/logger";
import type { Logger } from "winston";

const REQUEST_ID_HEADER = "x-request-id";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: Logger;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Use existing request ID from header or generate new one
  const requestId = (req.headers[REQUEST_ID_HEADER] as string) || randomUUID();

  req.requestId = requestId;

  // Create a child logger with request context
  req.log = createRequestLogger(requestId, {
    method: req.method,
    path: req.path,
  });

  // Set response header for tracing
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
