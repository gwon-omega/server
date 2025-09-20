import rateLimit from "express-rate-limit";

export const authRateLimit = rateLimit({
  windowMs: Math.max(1, Math.floor(Number(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || 15))) * 60 * 1000,
  max: Math.max(1, Math.floor(Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 5))),
  message: {
    error: "Too many authentication attempts",
    message: `Please try again after ${process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || 15} minutes`,
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
});

export const generalRateLimit = rateLimit({
  windowMs: Math.max(1, Math.floor(Number(process.env.GENERAL_RATE_LIMIT_WINDOW_MINUTES || 15))) * 60 * 1000,
  max: Math.max(1, Math.floor(Number(process.env.GENERAL_RATE_LIMIT_MAX_REQUESTS || 100))),
  message: { error: "Too many requests", message: "Please try again later", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
});

export default { authRateLimit, generalRateLimit };
