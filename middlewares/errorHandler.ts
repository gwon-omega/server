import { Request, Response, NextFunction } from "express";

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const formatErrorResponse = (error: any, req: Request, res: Response, next: NextFunction) => {
  const isDev = process.env.NODE_ENV !== "production";
  const statusCode = error.statusCode || error.status || 500;

  const errorResponse: any = {
    error: error.name || "Internal Server Error",
    message: error.message || "An unexpected error occurred",
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  if (isDev && error.stack) errorResponse.stack = error.stack;

  const logEntry = {
    ...errorResponse,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.userId || "anonymous",
  };
  console.error("ERROR_RESPONSE:", JSON.stringify(logEntry));

  res.status(statusCode).json(errorResponse);
};

export default { asyncHandler, formatErrorResponse };
