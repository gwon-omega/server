import { Request, Response, NextFunction } from "express";
import upload from "./multerUpload"; // use existing multer config

// Standard JSON error responder
const respondError = (res: Response, error: any) => {
  return res.status(400).json({ message: "upload error", error: error?.message || String(error) });
};

// Wrap a multer middleware executor so we can catch errors centrally
const wrap = (handler: any) => (req: Request, res: Response, next: NextFunction) => {
  handler(req, res, (err: any) => {
    if (err) return respondError(res, err);
    return next();
  });
};

// Single file helper
export const uploadSingle = (fieldName: string) => wrap(upload.single(fieldName));

// Multiple files for same field
export const uploadArray = (fieldName: string, maxCount: number) => wrap(upload.array(fieldName, maxCount));

// Multiple mixed fields
export const uploadFields = (fields: { name: string; maxCount?: number }[]) => wrap(upload.fields(fields));

// Raw access if needed
export const uploadAny = () => wrap(upload.any());

export default { uploadSingle, uploadArray, uploadFields, uploadAny };
