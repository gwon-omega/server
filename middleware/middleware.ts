import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const securityChecker = (req: Request, res: Response, next: NextFunction) => {
  // Allow public endpoints
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey && apiKey === process.env.API_KEY) return next();

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "unauthorized" });
  const parts = auth.split(" ");
  if (parts.length !== 2) return res.status(401).json({ message: "unauthorized" });
  const token = parts[1];
  try {
    const secret = process.env.JWT_SECRET || "secret";
    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ message: "invalid token" });
  }
};

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user) return next();
  return res.status(401).json({ message: "unauthorized" });
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user && user.role === "admin") return next();
  return res.status(403).json({ message: "forbidden" });
};

export const isVendor = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user && user.role === "vendor") return next();
  return res.status(403).json({ message: "forbidden" });
};

export default securityChecker;
