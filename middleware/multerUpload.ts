import * as multer from 'multer';
import { storage } from '../services/cloudinaryConfig';
import { Request } from 'express';

// multer can be exported as a callable default or as a namespace depending on module system.
const multerFactory: any = (multer as any).default ?? multer;

const upload = multerFactory({
  storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedFileTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are supported'));
    }
  },
  limits: {
    fileSize: 4 * 1024 * 1024, // 4 MB
  },
});

export default upload;
