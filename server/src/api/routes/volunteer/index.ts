import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import bcrypt from 'bcrypt';
import { Router, Response, type Request } from 'express';
import * as jose from 'jose';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import zod from 'zod';

import volunteerCvRouter from './cv.js';
import { VolunteerCreateResponse, VolunteerMeResponse, VolunteerProfileResponse } from './index.types.js';
import volunteerPostingRouter from './posting.js';
import resetPassword from '../../../auth/resetPassword.js';
import config from '../../../config.js';
import database from '../../../db/index.js';
import { type VolunteerAccountWithoutPassword, newVolunteerAccountSchema, volunteerAccountSchema } from '../../../db/tables.js';
import {
  recomputeVolunteerExperienceVector,
  recomputeVolunteerProfileVector,
} from '../../../services/embeddingUpdateService.js';
import { authorizeOnly } from '../../authorization.js';

const volunteerRouter = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../../../uploads/cvs');

const storage = multer.diskStorage({
  destination: async (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    cb(null, `volunteer-${req.userJWT!.id}-${Date.now()}.pdf`);
  },
});

const uploadCv = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';

    if (!isPdfMime || !isPdfExt) {
      cb(new Error('Only PDF CV files are allowed.'));
      return;
    }

    cb(null, true);
  },
});

const toPublicCvPath = (filename: string) => `/uploads/cvs/${filename}`;

const getAbsoluteCvPath = (cvPath: string) => {
  const filename = path.basename(cvPath);
  return path.join(uploadDir, filename);
};

const deleteCvFileIfExists = async (cvPath?: string | null) => {
  if (!cvPath) return;

  try {
    await fs.unlink(getAbsoluteCvPath(cvPath));
  } catch {
    // ignore missing file
  }
};

const validateCvPdf = async (filePath: string) => {
  const fileBytes = await fs.readFile(filePath);

  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(fileBytes);
  } catch {
    throw new Error('Uploaded file is not a valid PDF.');
  }

  const pageCount = pdfDoc.getPageCount();

  if (pageCount !== 3) {
    throw new Error('CV must be a PDF with exactly 3 pages.');
  }
};

const volunteerProfileUserUpdateSchema = volunteerAccountSchema.omit({
  id: true,
  password: true,
  email: true,
  profile_vector: true,
  experience_vector: true,
  created_at: true,
  updated_at: true,
}).partial();

const volunteerProfileUpdateSchema = volunteerProfileUserUpdateSchema.extend({
  skills: zod.array(zod.string().trim().min(1, 'Skill cannot be empty')).optional(),
});

const normalizeSkillList = (skills: string[]) =>
  Array.from(new Set(skills.map(skill => skill.trim()).filter(Boolean))).sort();

const areSkillListsEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  return left.every((skill, index) => skill === right[index]);
};

const getVolunteerProfile = async (volunteerId: number): Promise<VolunteerProfileResponse> => {
  const volunteer = await database
    .selectFrom('volunteer_account')
    .select([
      'id',
      'first_name',
      'last_name',
      'email',
      'date_of_birth',
      'gender',
      'cv_path',
      'description',
      'privacy',
    ])
    .where('id', '=', volunteerId)
    .executeTakeFirstOrThrow();

  const volunteerSkills = await database
    .selectFrom('volunteer_skill')
    .select('name')
    .where('volunteer_id', '=', volunteerId)
    .orderBy('id', 'asc')
    .execute();

  return {
    volunteer: {
      id: volunteer.id,
      first_name: volunteer.first_name,
      last_name: volunteer.last_name,
      email: volunteer.email,
      date_of_birth: volunteer.date_of_birth,
      gender: volunteer.gender,
      privacy: volunteer.privacy,
      cv_file: null,
      cv_path: volunteer.cv_path,
      description: volunteer.description ?? '',
    },
    skills: volunteerSkills.map(skill => skill.name),
  };
};

volunteerRouter.post('/create', async (req, res: Response<VolunteerCreateResponse>) => {
  const body = newVolunteerAccountSchema.parse(req.body);

  const existingVolunteer = await database
    .selectFrom('volunteer_account')
    .select('id')
    .where('email', '=', body.email)
    .executeTakeFirst();

  if (existingVolunteer) {
    res.status(409);
    throw new Error('Account already exists, log in or use another email');
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const newVolunteer = await database
    .insertInto('volunteer_account')
    .values({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      password: hashedPassword,
      date_of_birth: body.date_of_birth,
      gender: body.gender,
      privacy: 'public',
    })
    .returningAll()
    .executeTakeFirst();

  if (!newVolunteer) {
    res.status(500);
    throw new Error('Failed to create volunteer');
  }

  await recomputeVolunteerProfileVector(newVolunteer.id);
  await recomputeVolunteerExperienceVector(newVolunteer.id);

  const token = await new jose.SignJWT({ id: newVolunteer.id, role: 'volunteer' })
    .setIssuedAt()
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(config.JWT_SECRET));

  // @ts-expect-error: do not return the password
  delete newVolunteer.password;

  res.json({ volunteer: newVolunteer, token });
});

volunteerRouter.use(authorizeOnly('volunteer'));

volunteerRouter.get('/me', async (req, res: Response<VolunteerMeResponse>) => {
  const volunteer = await database
    .selectFrom('volunteer_account')
    .selectAll()
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirstOrThrow();

  // @ts-expect-error: do not return the password
  delete volunteer.password;

  res.json({ volunteer });
});

volunteerRouter.get('/profile', async (req, res: Response<VolunteerProfileResponse>) => {
  const profile = await getVolunteerProfile(req.userJWT!.id);
  res.json(profile);
});

volunteerRouter.post(
  '/profile/cv',
  uploadCv.single('cv'),
  async (req, res: Response<VolunteerProfileResponse>) => {
    const volunteerId = req.userJWT!.id;

    if (!req.file) {
      res.status(400);
      throw new Error('CV file is required.');
    }

    try {
      await validateCvPdf(req.file.path);
    } catch (error) {
      await fs.unlink(req.file.path).catch(() => { });
      res.status(400);
      throw error;
    }

    const existingVolunteer = await database
      .selectFrom('volunteer_account')
      .select(['cv_path'])
      .where('id', '=', volunteerId)
      .executeTakeFirstOrThrow();

    const nextCvPath = toPublicCvPath(req.file.filename);

    await database
      .updateTable('volunteer_account')
      .set({ cv_path: nextCvPath })
      .where('id', '=', volunteerId)
      .execute();

    await deleteCvFileIfExists(existingVolunteer.cv_path);
    await recomputeVolunteerProfileVector(volunteerId);

    const profile = await getVolunteerProfile(volunteerId);
    res.json(profile);
  },
);

volunteerRouter.delete('/profile/cv', async (req, res: Response<VolunteerProfileResponse>) => {
  const volunteerId = req.userJWT!.id;

  const existingVolunteer = await database
    .selectFrom('volunteer_account')
    .select(['cv_path'])
    .where('id', '=', volunteerId)
    .executeTakeFirstOrThrow();

  await database
    .updateTable('volunteer_account')
    .set({ cv_path: undefined })
    .where('id', '=', volunteerId)
    .execute();

  await deleteCvFileIfExists(existingVolunteer.cv_path);
  await recomputeVolunteerProfileVector(volunteerId);

  const profile = await getVolunteerProfile(volunteerId);
  res.json(profile);
});

volunteerRouter.put('/profile', async (req, res: Response<VolunteerProfileResponse>) => {
  const body = volunteerProfileUpdateSchema.parse(req.body);
  const volunteerId = req.userJWT!.id;

  const existingVolunteer = await database
    .selectFrom('volunteer_account')
    .select([
      'first_name',
      'last_name',
      'email',
      'date_of_birth',
      'gender',
      'cv_path',
      'description',
      'privacy',
    ])
    .where('id', '=', volunteerId)
    .executeTakeFirstOrThrow();

  const existingSkills = await database
    .selectFrom('volunteer_skill')
    .select('name')
    .where('volunteer_id', '=', volunteerId)
    .execute();

  const normalizedExistingSkills = normalizeSkillList(existingSkills.map(skill => skill.name));
  const normalizedIncomingSkills = body.skills !== undefined ? normalizeSkillList(body.skills) : undefined;

  const didSkillsChange = normalizedIncomingSkills !== undefined
    ? !areSkillListsEqual(normalizedIncomingSkills, normalizedExistingSkills)
    : false;

  const shouldRecomputeProfileVector = (
    (body.first_name !== undefined && body.first_name !== existingVolunteer.first_name)
    || (body.last_name !== undefined && body.last_name !== existingVolunteer.last_name)
    || (body.gender !== undefined && body.gender !== existingVolunteer.gender)
    || (body.cv_path !== undefined && body.cv_path !== existingVolunteer.cv_path)
    || (body.description !== undefined && body.description !== existingVolunteer.description)
    || didSkillsChange
  );

  await database.transaction().execute(async (trx) => {
    const volunteerUpdate: Partial<Omit<VolunteerAccountWithoutPassword, 'id'>> = {};

    if (body.first_name !== undefined) volunteerUpdate.first_name = body.first_name;
    if (body.last_name !== undefined) volunteerUpdate.last_name = body.last_name;
    if (body.date_of_birth !== undefined) volunteerUpdate.date_of_birth = body.date_of_birth;
    if (body.gender !== undefined) volunteerUpdate.gender = body.gender;
    if (body.cv_path !== undefined) volunteerUpdate.cv_path = body.cv_path;
    if (body.description !== undefined) volunteerUpdate.description = body.description;
    if (body.privacy !== undefined) volunteerUpdate.privacy = body.privacy;

    if (Object.keys(volunteerUpdate).length > 0) {
      await trx
        .updateTable('volunteer_account')
        .set(volunteerUpdate)
        .where('id', '=', volunteerId)
        .execute();
    }

    if (didSkillsChange) {
      await trx
        .deleteFrom('volunteer_skill')
        .where('volunteer_id', '=', volunteerId)
        .execute();

      if (normalizedIncomingSkills && normalizedIncomingSkills.length > 0) {
        await trx
          .insertInto('volunteer_skill')
          .values(
            normalizedIncomingSkills.map(name => ({
              volunteer_id: volunteerId,
              name,
            })),
          )
          .execute();
      }
    }
  });

  if (shouldRecomputeProfileVector) {
    await recomputeVolunteerProfileVector(volunteerId);
  }

  const profile = await getVolunteerProfile(volunteerId);
  res.json(profile);
});

volunteerRouter.post('/reset-password', resetPassword);

volunteerRouter.use('/posting', volunteerPostingRouter);
volunteerRouter.use('/cv', volunteerCvRouter);

export default volunteerRouter;
