import crypto from 'crypto';
import fs from 'fs';

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';

import config from '../../../config.js';
import database from '../../../db/index.js';

const volunteerCvRouter = Router();

// ONLY source of truth for where files are stored:
const CV_DIR = config.CV_UPLOAD_DIR;

// Ensure folder exists
fs.mkdirSync(CV_DIR, { recursive: true });

// Always store as random.pdf
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CV_DIR),
  filename: (_req, _file, cb) => cb(null, `${crypto.randomBytes(16).toString('hex')}.pdf`),
});

// PDF-only filter
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfName = file.originalname.toLowerCase().endsWith('.pdf');
  if (!isPdfMime || !isPdfName) return cb(new Error('PDF only'));
  cb(null, true);
};

const uploadCv = multer({ storage, fileFilter });

const validateCvPdf = async (filePath: string) => {
  const fileBytes = await fs.promises.readFile(filePath);

  let parser: PDFParse | undefined;

  try {
    parser = new PDFParse({ data: fileBytes });
    const info = await parser.getInfo();

    const pageCount = info.total ?? 0;

    if (pageCount > 3) {
      throw new Error('CV must be a PDF with no more than 3 pages.');
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'CV must be a PDF with no more than 3 pages.') {
      throw error;
    }

    throw new Error('Uploaded file is not a valid PDF.');
  } finally {
    await parser?.destroy();
  }
};

// POST /api/volunteer/cv (upload/replace)
volunteerCvRouter.post(
  '/',
  (req, res, next) => {
    uploadCv.single('cv')(req, res, (err: unknown) => {
      if (err instanceof Error) {
        return res.status(400).json({ error: err.message });
      }

      if (err) {
        return res.status(400).json({ error: 'Upload failed' });
      }

      next();
    });
  },
  async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'Missing file field "cv".' });

    try {
      await validateCvPdf(req.file.path);
    } catch (error) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }

    const volunteerId = req.userJWT!.id;

    const existing = await database
      .selectFrom('volunteer_account')
      .select(['cv_path'])
      .where('id', '=', volunteerId)
      .executeTakeFirst();

    if (existing?.cv_path) {
      try {
        await fs.promises.unlink(`${CV_DIR}/${existing.cv_path}`);
      } catch {
        // ignore
      }
    }

    await database
      .updateTable('volunteer_account')
      .set({ cv_path: req.file.filename })
      .where('id', '=', volunteerId)
      .execute();

    res.status(201).json({ ok: true });
  },
);

// GET /api/volunteer/cv/preview
volunteerCvRouter.get('/preview', async (req, res) => {
  const row = await database
    .selectFrom('volunteer_account')
    .select(['cv_path'])
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirst();

  if (!row?.cv_path) return res.status(404).json({ error: 'No CV uploaded.' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="cv.pdf"');

  res.sendFile(row.cv_path, { root: CV_DIR });
});

// GET /api/volunteer/cv/download
volunteerCvRouter.get('/download', async (req, res) => {
  const row = await database
    .selectFrom('volunteer_account')
    .select(['cv_path'])
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirst();

  if (!row?.cv_path) return res.status(404).json({ error: 'No CV uploaded.' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="cv.pdf"');

  res.sendFile(row.cv_path, { root: CV_DIR });
});

// DELETE /api/volunteer/cv
volunteerCvRouter.delete('/', async (req, res) => {
  const row = await database
    .selectFrom('volunteer_account')
    .select(['cv_path'])
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirst();

  if (row?.cv_path) {
    try {
      await fs.promises.unlink(`${CV_DIR}/${row.cv_path}`);
    } catch {
      // ignore
    }
  }

  await database
    .updateTable('volunteer_account')
    .set({ cv_path: undefined })
    .where('id', '=', req.userJWT!.id)
    .execute();

  res.json({ ok: true });
});

export default volunteerCvRouter;
