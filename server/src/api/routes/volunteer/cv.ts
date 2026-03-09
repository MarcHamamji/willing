import crypto from 'crypto';
import fs from 'fs';

import { Router, Request, Response } from 'express';
import multer from 'multer';

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

// POST /api/volunteer/cv (upload/replace)
volunteerCvRouter.post(
  '/',
  (req, res, next) => {
    uploadCv.single('cv')(req, res, (err: any) => {
      if (err) return res.status(400).json({ error: err.message ?? 'Upload failed' });
      next();
    });
  },
  async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'Missing file field "cv".' });

    const volunteerId = req.userJWT!.id;

    // get old filename from DB (NOT a path)
    const existing = await database
      .selectFrom('volunteer_account')
      .select(['cv_file'])
      .where('id', '=', volunteerId)
      .executeTakeFirst();

    // delete old file from disk if it existed
    if (existing?.cv_file) {
      try {
        await fs.promises.unlink(`${CV_DIR}/${existing.cv_file}`);
      } catch {
        // ignore
      }
    }

    // store ONLY the filename in DB
    await database
      .updateTable('volunteer_account')
      .set({ cv_file: req.file.filename })
      .where('id', '=', volunteerId)
      .execute();

    res.status(201).json({ ok: true });
  },
);

// GET /api/volunteer/cv/preview
volunteerCvRouter.get('/preview', async (req, res) => {
  const row = await database
    .selectFrom('volunteer_account')
    .select(['cv_file'])
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirst();

  if (!row?.cv_file) return res.status(404).json({ error: 'No CV uploaded.' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="cv.pdf"');

  // sendFile uses filename + root folder, so DB never stores a path
  res.sendFile(row.cv_file, { root: CV_DIR });
});

// GET /api/volunteer/cv/download
volunteerCvRouter.get('/download', async (req, res) => {
  const row = await database
    .selectFrom('volunteer_account')
    .select(['cv_file'])
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirst();

  if (!row?.cv_file) return res.status(404).json({ error: 'No CV uploaded.' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="cv.pdf"');

  res.sendFile(row.cv_file, { root: CV_DIR });
});

// DELETE /api/volunteer/cv
volunteerCvRouter.delete('/', async (req, res) => {
  const row = await database
    .selectFrom('volunteer_account')
    .select(['cv_file'])
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirst();

  if (row?.cv_file) {
    try {
      await fs.promises.unlink(`${CV_DIR}/${row.cv_file}`);
    } catch {
      // ignore
    }
  }

  await database
    .updateTable('volunteer_account')
    .set({ cv_file: null })
    .where('id', '=', req.userJWT!.id)
    .execute();

  res.json({ ok: true });
});

export default volunteerCvRouter;
