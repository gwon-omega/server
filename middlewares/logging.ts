import { Request, Response, NextFunction } from "express";

// TODO: replace with Winston/Pino
const logInfo = (msg: string, obj: any) => console.info(msg, JSON.stringify(obj));
const logError = (msg: string, obj: any) => console.error(msg, JSON.stringify(obj));

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get("User-Agent") || "Unknown";

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method,
      url,
      ip,
      userAgent,
      statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId || "anonymous",
    };
    if (statusCode >= 400) logError("REQUEST_ERROR:", logEntry);
    else logInfo("REQUEST_INFO:", logEntry);
  });

  next();
};

export default requestLogger;
