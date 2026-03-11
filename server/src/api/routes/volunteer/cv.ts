import fs from 'fs';

import { NextFunction, Router, Request, Response } from 'express';
import { sql } from 'kysely';

import { DeleteVolunteerCvResponse, UploadVolunteerCvResponse } from './cv.types.js';
import config from '../../../config.js';
import database from '../../../db/index.js';
import { uploadCv, validateCvPdf, deleteCvFileIfExists } from '../../../services/cv/index.js';
import { recomputeVolunteerProfileVector } from '../../../services/embeddings/embeddingUpdateService.js';
import { getVolunteerProfile } from '../../../services/volunteer/index.js';

const volunteerCvRouter = Router();

volunteerCvRouter.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    uploadCv.single('cv')(req, res, (err: unknown) => {
      if (err instanceof Error) {
        res.status(400);
        next(err);
        return;
      }

      if (err) {
        res.status(400);
        next(new Error('Upload failed'));
        return;
      }

      next();
    });
  },
  async (req: Request, res: Response<UploadVolunteerCvResponse>) => {
    if (!req.file) {
      res.status(400);
      throw new Error('Missing file field "cv".');
    }

    try {
      await validateCvPdf(req.file.path);
    } catch (error) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      res.status(400);
      throw error instanceof Error ? error : new Error('Upload failed');
    }

    const volunteerId = req.userJWT!.id;

    const existing = await database
      .selectFrom('volunteer_account')
      .select(['cv_path'])
      .where('id', '=', volunteerId)
      .executeTakeFirst();

    if (existing?.cv_path) {
      await deleteCvFileIfExists(existing.cv_path);
    }

    await database
      .updateTable('volunteer_account')
      .set({ cv_path: req.file.filename })
      .where('id', '=', volunteerId)
      .execute();

    await recomputeVolunteerProfileVector(volunteerId);

    const profile = await getVolunteerProfile(volunteerId);
    res.status(201).json(profile);
  },
);

// GET /api/volunteer/cv/preview
volunteerCvRouter.get('/preview', async (req: Request, res: Response, next: NextFunction) => {
  const row = await database
    .selectFrom('volunteer_account')
    .select(['cv_path'])
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirst();

  if (!row?.cv_path) {
    res.status(404);
    throw new Error('No CV uploaded.');
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="cv.pdf"');

  res.sendFile(row.cv_path, { root: config.CV_UPLOAD_DIR }, (error) => {
    if (!error) return;
    next(error);
  });
});

// GET /api/volunteer/cv/download
volunteerCvRouter.get('/download', async (req: Request, res: Response, next: NextFunction) => {
  const row = await database
    .selectFrom('volunteer_account')
    .select(['cv_path'])
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirst();

  if (!row?.cv_path) {
    res.status(404);
    throw new Error('No CV uploaded.');
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="cv.pdf"');

  res.sendFile(row.cv_path, { root: config.CV_UPLOAD_DIR }, (error) => {
    if (!error) return;
    next(error);
  });
});

// DELETE /api/volunteer/cv
volunteerCvRouter.delete('/', async (req, res: Response<DeleteVolunteerCvResponse>) => {
  const row = await database
    .selectFrom('volunteer_account')
    .select(['cv_path'])
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirst();

  if (row?.cv_path) {
    await deleteCvFileIfExists(row.cv_path);
  }

  await database
    .updateTable('volunteer_account')
    .set({ cv_path: sql`NULL` })
    .where('id', '=', req.userJWT!.id)
    .execute();

  await recomputeVolunteerProfileVector(req.userJWT!.id);

  const profile = await getVolunteerProfile(req.userJWT!.id);
  res.json(profile);
});

export default volunteerCvRouter;
