// services/cv/index.ts
import { promises as fs } from 'fs';
import path from 'path';

import { type Request } from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';

import config from '../../config.js';

export const uploadDir = path.resolve(config.CV_UPLOAD_DIR);

/** public URL path for a stored filename */
export const toPublicCvPath = (filename: string) => `/uploads/cvs/${filename}`;

/** filesystem path given the stored `cv_path` value */
export const getAbsoluteCvPath = (cvPath: string) => {
  const filename = path.basename(cvPath);
  return path.join(uploadDir, filename);
};

/** delete the file if it exists, ignore errors */
export const deleteCvFileIfExists = async (cvPath?: string | null) => {
  if (!cvPath) return;

  try {
    await fs.unlink(getAbsoluteCvPath(cvPath));
  } catch {
    // ignore
  }
};

/** multer storage configuration – ensures directory exists and
    names files predictably */
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

/** validate that a file is a PDF and has exactly three pages */
export const validateCvPdf = async (filePath: string) => {
  const fileBytes = await fs.readFile(filePath);

  let parser: PDFParse | undefined;

  try {
    parser = new PDFParse({ data: fileBytes });
    const info = await parser.getInfo();

    const pageCount = info.total ?? 0;
    if (pageCount !== 3) {
      throw new Error('CV must be a PDF with exactly 3 pages.');
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('CV must')) {
      throw err;
    }
    throw new Error('Uploaded file is not a valid PDF.');
  } finally {
    await parser?.destroy();
  }
};
