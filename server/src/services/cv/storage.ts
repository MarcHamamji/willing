import { promises as fs } from 'fs';
import path from 'path';

import { type Request } from 'express';
import multer from 'multer';

import config from '../../config.js';

export const uploadDir = path.resolve(config.CV_UPLOAD_DIR);

export const toPublicCvPath = (filename: string) => `/uploads/cvs/${filename}`;

export const getAbsoluteCvPath = (cvPath: string) => {
  const filename = path.basename(cvPath);
  return path.join(uploadDir, filename);
};

export const deleteCvFileIfExists = async (cvPath?: string | null) => {
  if (!cvPath) return;

  try {
    await fs.unlink(getAbsoluteCvPath(cvPath));
  } catch {
    // ignore
  }
};

export const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req: Request, _file, cb) => {
    cb(null, `volunteer-${req.userJWT!.id}-${Date.now()}.pdf`);
  },
});

export const uploadCv = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';

    if (!isPdfMime || !isPdfExt) {
      cb(new Error('Only PDF CV files are allowed.'));
      return;
    }

    cb(null, true);
  },
});
