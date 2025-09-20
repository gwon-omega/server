import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Simple cached mode flag (not frozen so that .env reload via process manager restarts picks change).
const getAppMode = () => (process.env.APP_MODE || process.env.NODE_ENV === 'production' ? process.env.APP_MODE : 'production');

function logMaintenanceRequest(req: Request) {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const file = path.join(logsDir, `maintenance-${new Date().toISOString().slice(0,10)}.log`);
    const line = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ip=${req.ip} ua="${req.headers['user-agent'] || ''}"\n`;
    fs.appendFile(file, line, () => {});
  } catch {
    // swallow
  }
}

export function maintenanceMode(req: Request, res: Response, next: NextFunction) {
  if (getAppMode() === 'maintenance') {
    logMaintenanceRequest(req);
    return res.status(503).json({ error: 'Site is under maintenance. Please try again later.' });
  }
  next();
}
