import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { UnauthorizedError } from "../utils/errors";
import { logger } from "../utils/logger";

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const log = req.log || logger;

  // In test mode, check if auth was already set by test middleware
  if (process.env.NODE_ENV === "test" && (req as any).auth?.userId) {
    return next();
  }

  const { userId } = getAuth(req);

  if (!userId) {
    log.warn("Authentication failed: no userId", {
      event: "auth_failure",
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    throw new UnauthorizedError(
      "You must be signed in to access this resource"
    );
  }

  log.debug("Authentication successful", {
    event: "auth_success",
    userId,
    path: req.path,
  });

  next();
};

/**
 * TSOA expects an `expressAuthentication` export when using @Security decorators.
 * Provide a small adapter that returns a boolean/Promise<boolean> indicating
 * whether the request is authenticated. This keeps generated routes working
 * while reusing Clerk's `getAuth` logic.
 */
export const expressAuthentication = async (
  request: Request,
  _securityName: string,
  _scopes?: string[]
): Promise<boolean> => {
  const log = (request as any).log || logger;

  try {
    // test-mode bypass
    if (process.env.NODE_ENV === "test" && (request as any).auth?.userId) {
      return true;
    }

    const { userId } = getAuth(request as any);

    if (!userId) {
      log.warn("TSOA authentication failed: no userId", {
        event: "tsoa_auth_failure",
        path: request.path,
        method: request.method,
      });
      return false;
    }

    return true;
  } catch (err) {
    log.error("TSOA authentication error", {
      event: "tsoa_auth_error",
      error: err instanceof Error ? err.message : "Unknown error",
      path: request.path,
    });
    return false;
  }
};
