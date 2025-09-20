import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  [key: string]: any;
}

export const jwtVerify = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({
      error: "Authentication required",
      message: "No authorization header provided",
      statusCode: 401,
    });
  }

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      error: "Invalid authentication format",
      message: "Authorization header must be 'Bearer <token>'",
      statusCode: 401,
    });
  }

  const token = parts[1];
  if (!token || token.length < 10) {
    return res.status(401).json({
      error: "Invalid token",
      message: "Token is missing or malformed",
      statusCode: 401,
    });
  }

  try {
    const secret = process.env.JWT_SECRET || "yo_mero_secret_key_ho";
    const decoded = jwt.verify(token, secret) as any;
    const normalizedUserId = decoded.userId || decoded.id;
    const normalized: AuthUser = { ...decoded, userId: String(normalizedUserId) };

    if (!normalized.userId || !decoded.email) {
      return res.status(401).json({
        error: "Invalid token payload",
        message: "Token does not contain required user information",
        statusCode: 401,
      });
    }

    req.user = normalized;
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
      statusCode: 401,
    });
  }
};

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) return next();
  return res.status(401).json({
    error: "Authentication required",
    message: "User must be authenticated to access this resource",
    statusCode: 401,
  });
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user && user.role === "admin") return next();
  return res.status(403).json({
    error: "Insufficient permissions",
    message: "Admin role required to access this resource",
    statusCode: 403,
  });
};

export const isVendor = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user && user.role === "vendor") return next();
  return res.status(403).json({
    error: "Insufficient permissions",
    message: "Vendor role required to access this resource",
    statusCode: 403,
  });
};

export const verifyOwnership = (resourceUserIdParam: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authenticatedUser = req.user;
    const resourceUserId = (req.params as any)[resourceUserIdParam] ?? (req.body as any)[resourceUserIdParam];

    if (!authenticatedUser) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User must be authenticated",
        statusCode: 401,
      });
    }

    if (authenticatedUser.role === "admin") return next();

    if (String(authenticatedUser.userId) !== String(resourceUserId)) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only access your own resources",
        statusCode: 403,
      });
    }

    next();
  };
};

// Combined security checker: allow API key OR JWT Bearer
import { apiKeyChecker } from "./security";
export const securityChecker = (req: Request, res: Response, next: NextFunction) => {
  // pass-through if API key matches
  if (apiKeyChecker(req)) return next();
  // else require JWT
  return jwtVerify(req, res, next);
};

export default securityChecker;
