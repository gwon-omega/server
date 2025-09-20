import { Request, Response, NextFunction } from "express";
import helmet from "helmet";

const scriptSrcEnv = process.env.HELMET_SCRIPT_SRC || ""; // comma-separated
const extraScripts = scriptSrcEnv.split(",").map((s) => s.trim()).filter(Boolean);
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", ...extraScripts],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
});

export const requestSizeLimit = (maxSize: string = "10mb") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get("content-length");
    const maxBytes = parseSize(maxSize);
    if (contentLength && parseInt(contentLength) > maxBytes) {
      return res.status(413).json({
        error: "Request too large",
        message: `Request size exceeds limit of ${maxSize}`,
        statusCode: 413,
      });
    }
    next();
  };
};

export function apiKeyChecker(req: Request) {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  return Boolean(apiKey && process.env.API_KEY && apiKey === process.env.API_KEY);
}

function parseSize(size: string): number {
  const units: { [key: string]: number } = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) return 10 * 1024 * 1024;
  const [, num, unit] = match;
  return parseFloat(num) * units[unit];
}

export default securityHeaders;
