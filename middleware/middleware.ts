import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { body, validationResult, param, query } from "express-validator";

// Rate limiting configurations
export const authRateLimit = rateLimit({
  // express-rate-limit expects milliseconds
  windowMs: (() => {
    const minutes = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || 15);
    return Math.max(1, Math.floor(minutes)) * 60 * 1000; // minutes -> ms
  })(),
  max: (() => {
    const max = Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 5);
    return Math.max(1, Math.floor(max));
  })(),
  message: {
    error: "Too many authentication attempts",
    message: `Please try again after ${process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || 15} minutes`,
    statusCode: 429
  },
  standardHeaders: true, // Sends RateLimit-* headers per RFC
  legacyHeaders: false,   // Disables X-RateLimit-* headers
  statusCode: 429
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests",
    message: "Please try again later",
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Structured logging instead of console.log
    const logEntry = {
      timestamp: new Date().toISOString(),
      method,
      url,
      ip,
      userAgent,
      statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.userId || 'anonymous'
    };

    if (statusCode >= 400) {
      console.error('REQUEST_ERROR:', JSON.stringify(logEntry));
    } else {
      console.info('REQUEST_INFO:', JSON.stringify(logEntry));
    }
  });

  next();
};

// Input validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      message: "Invalid input data provided",
      details: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      })),
      statusCode: 400
    });
  }
  next();
};

export const securityChecker = (req: Request, res: Response, next: NextFunction) => {
  // Allow public endpoints with API key
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey && apiKey === process.env.API_KEY) {
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({
      error: "Authentication required",
      message: "No authorization header provided",
      statusCode: 401
    });
  }

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      error: "Invalid authentication format",
      message: "Authorization header must be 'Bearer <token>'",
      statusCode: 401
    });
  }

  const token = parts[1];
  if (!token || token.length < 10) {
    return res.status(401).json({
      error: "Invalid token",
      message: "Token is missing or malformed",
      statusCode: 401
    });
  }

  try {
    const secret = process.env.JWT_SECRET || "yo_mero_secret_key_ho";
    const decoded = jwt.verify(token, secret) as any;

    // Normalize payload for backward compatibility (support tokens that used `id` instead of `userId`)
    const normalizedUserId = decoded.userId || decoded.id;
    const normalized = { ...decoded, userId: normalizedUserId };

    // Validate token structure
    if (!normalized.userId || !normalized.email) {
      return res.status(401).json({
        error: "Invalid token payload",
        message: "Token does not contain required user information",
        statusCode: 401
      });
    }

    (req as any).user = normalized;
    return next();
  } catch (error: any) {
    let message = "Invalid or expired token";
    if (error.name === "TokenExpiredError") {
      message = "Token has expired, please login again";
    } else if (error.name === "JsonWebTokenError") {
      message = "Token is malformed or invalid";
    }

    return res.status(401).json({
      error: "Authentication failed",
      message,
      statusCode: 401
    });
  }
};

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user) {
    return next();
  }
  return res.status(401).json({
    error: "Authentication required",
    message: "User must be authenticated to access this resource",
    statusCode: 401
  });
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user && user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    error: "Insufficient permissions",
    message: "Admin role required to access this resource",
    statusCode: 403
  });
};

export const isVendor = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user && user.role === "vendor") {
    return next();
  }
  return res.status(403).json({
    error: "Insufficient permissions",
    message: "Vendor role required to access this resource",
    statusCode: 403
  });
};

// User ownership verification middleware
export const verifyOwnership = (resourceUserIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authenticatedUser = (req as any).user;
    const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];

    if (!authenticatedUser) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User must be authenticated",
        statusCode: 401
      });
    }

    // Admin can access any resource
    if (authenticatedUser.role === "admin") {
      return next();
    }

    // Regular users can only access their own resources
    if (authenticatedUser.userId !== resourceUserId) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only access your own resources",
        statusCode: 403
      });
    }

    next();
  };
};

// Request size limiter
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    const maxBytes = parseSize(maxSize);

    if (contentLength && parseInt(contentLength) > maxBytes) {
      return res.status(413).json({
        error: "Request too large",
        message: `Request size exceeds limit of ${maxSize}`,
        statusCode: 413
      });
    }

    next();
  };
};

// Helper function to parse size strings
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB

  const [, num, unit] = match;
  return parseFloat(num) * units[unit];
}

// Common validation rules
export const validateUserId = [
  param('userId').isUUID().withMessage('User ID must be a valid UUID'),
  handleValidationErrors
];

export const validateProductId = [
  param('id').isUUID().withMessage('Product ID must be a valid UUID'),
  handleValidationErrors
];

export const validateOrderId = [
  param('id').isUUID().withMessage('Order ID must be a valid UUID'),
  handleValidationErrors
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

export const validateEmail = [
  body('email').isEmail().normalizeEmail().withMessage('Must be a valid email address'),
  handleValidationErrors
];

export const validatePassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors
];

export const sanitizeInput = [
  body('*').trim().escape(),
  query('*').trim().escape()
];

// Error handling middleware for async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error response formatter
export const formatErrorResponse = (error: any, req: Request, res: Response, next: NextFunction) => {
  const isDev = process.env.NODE_ENV !== "production";
  const statusCode = error.statusCode || error.status || 500;

  const errorResponse = {
    error: error.name || "Internal Server Error",
    message: error.message || "An unexpected error occurred",
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add stack trace only in development
  if (isDev && error.stack) {
    (errorResponse as any).stack = error.stack;
  }

  // Log error with structured format
  const logEntry = {
    ...errorResponse,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId || 'anonymous'
  };

  console.error('ERROR_RESPONSE:', JSON.stringify(logEntry));

  res.status(statusCode).json(errorResponse);
};

export default securityChecker;
