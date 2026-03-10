import { Router, Response } from 'express';
import { sql } from 'kysely';
import zod from 'zod';

import { VolunteerPostingEnrollResponse, VolunteerPostingResponse, VolunteerPostingSearchResponse, VolunteerPostingWithdrawResponse } from './posting.types.js';
import database from '../../../db/index.js';
import { Enrollment, EnrollmentApplication } from '../../../db/tables.js';
import { parseVectorLiteral } from '../../../services/embeddings/embeddingService.js';
import { recomputeVolunteerExperienceVector } from '../../../services/embeddings/embeddingUpdateService.js';
import { authorizeOnly } from '../../authorization.js';

const volunteerPostingRouter = Router();

const postingIdParamsSchema = zod.object({
  id: zod.coerce.number().int().positive('ID must be a positive number'),
});

const applyBodySchema = zod.object({
  message: zod.string().trim().min(1, 'Message cannot be empty').optional(),
});

volunteerPostingRouter.use(authorizeOnly('volunteer'));

volunteerPostingRouter.get('/', async (req, res: Response<VolunteerPostingSearchResponse>) => {
  const volunteerId = req.userJWT!.id;
  const { location_name, start_timestamp, end_timestamp, skill } = req.query;
  const skillFilter = typeof skill === 'string' ? skill.trim() : '';

  const volunteerVectors = await database
    .selectFrom('volunteer_account')
    .select(['profile_vector', 'experience_vector'])
    .where('id', '=', volunteerId)
    .executeTakeFirstOrThrow();

  const profileVectorLiteral = volunteerVectors.profile_vector;
  const experienceVectorLiteral = volunteerVectors.experience_vector;
  const hasProfileVector = parseVectorLiteral(profileVectorLiteral) !== null;
  const hasExperienceVector = parseVectorLiteral(experienceVectorLiteral) !== null;

  let query = database
    .selectFrom('organization_posting')
    .innerJoin(
      'organization_account',
      'organization_account.id',
      'organization_posting.organization_id',
    )
    .selectAll('organization_posting')
    .select(['organization_account.name as organization_name']);

  if (skillFilter) {
    query = query.where(({ exists, selectFrom }) => exists(
      selectFrom('posting_skill')
        .select('posting_skill.id')
        .whereRef('posting_skill.posting_id', '=', 'organization_posting.id')
        .where('posting_skill.name', 'ilike', `%${skillFilter}%`),
    ));
  }

  if (location_name) {
    query = query.where(
      'organization_posting.location_name',
      'ilike',
      `%${location_name}%`,
    );
  }

  let parsedStart: Date | undefined;
  let parsedEnd: Date | undefined;

  if (start_timestamp) {
    const s = start_timestamp as string;
    parsedStart = /^\d{4}-\d{2}-\d{2}$/.test(s)
      ? new Date(`${s}T00:00:00`)
      : new Date(s);
  }

  if (end_timestamp) {
    const e = end_timestamp as string;
    parsedEnd = /^\d{4}-\d{2}-\d{2}$/.test(e)
      ? new Date(`${e}T23:59:59.999`)
      : new Date(e);
  }

  if (parsedStart && parsedEnd) {
    query = query.where(qu =>
      qu.and([
        qu('organization_posting.start_timestamp', '<=', parsedEnd),
        qu.or([
          qu('organization_posting.end_timestamp', '>=', parsedStart),
          qu('organization_posting.end_timestamp', 'is', null),
        ]),
      ]),
    );
  } else {
    if (parsedStart) {
      query = query.where(
        'organization_posting.start_timestamp',
        '>=',
        parsedStart,
      );
    }

    if (parsedEnd) {
      query = query.where('organization_posting.end_timestamp', '<=', parsedEnd);
    }
  }

  if (hasProfileVector && profileVectorLiteral) {
    const profileSimilarity = sql<number>`
      1 - (organization_posting.opportunity_vector <=> ${profileVectorLiteral}::vector)
    `;

    if (hasExperienceVector && experienceVectorLiteral) {
      const experienceSimilarity = sql<number>`
        1 - (organization_posting.opportunity_vector <=> ${experienceVectorLiteral}::vector)
      `;
      const finalScore = sql<number>`(0.6 * ${profileSimilarity}) + (0.4 * ${experienceSimilarity})`;

      query = query.orderBy(sql`${finalScore} desc nulls last`);
    } else {
      const profileOnlyScore = sql<number>`0.6 * ${profileSimilarity}`;
      query = query.orderBy(sql`${profileOnlyScore} desc nulls last`);
    }

    query = query.orderBy('organization_posting.start_timestamp', 'asc');
  } else {
    if (!hasProfileVector && hasExperienceVector) {
      console.info('[recommendation] Volunteer has experience_vector but no valid profile_vector. Using default opportunity ordering.');
    } else if (!hasProfileVector && !hasExperienceVector) {
      console.info('[recommendation] Volunteer vectors unavailable. Using default opportunity ordering.');
    }

    query = query.orderBy('organization_posting.start_timestamp', 'asc');
  }

  const postings = await query.execute();

  const postingIds = postings.map(p => p.id);

  const skills = postingIds.length > 0
    ? await database
        .selectFrom('posting_skill')
        .selectAll()
        .where('posting_id', 'in', postingIds)
        .execute()
    : [];

  const skillsByPostingId = new Map<number, typeof skills>();

  skills.forEach((skillRow) => {
    if (!skillsByPostingId.has(skillRow.posting_id)) {
      skillsByPostingId.set(skillRow.posting_id, []);
    }
    skillsByPostingId.get(skillRow.posting_id)!.push(skillRow);
  });

  const postingWithSkills = postings.map(posting => ({
    ...posting,
    skills: skillsByPostingId.get(posting.id) || [],
  }));

  res.json({ postings: postingWithSkills });
});

volunteerPostingRouter.get('/:id', async (req, res: Response<VolunteerPostingResponse>) => {
  const volunteerId = req.userJWT!.id;
  const { id } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .selectAll()
    .where('organization_posting.id', '=', id)
    .executeTakeFirst();

  if (!posting) {
    res.status(404);
    throw new Error('Posting not found');
  }

  const [skills, pendingApplication, existingEnrollment] = await Promise.all([
    database
      .selectFrom('posting_skill')
      .selectAll()
      .where('posting_id', '=', id)
      .execute(),
    database
      .selectFrom('enrollment_application')
      .selectAll()
      .where(eb => eb('volunteer_id', '=', volunteerId))
      .where(eb => eb('posting_id', '=', id))
      .executeTakeFirst(),
    database
      .selectFrom('enrollment')
      .select('id')
      .where('posting_id', '=', id)
      .where('volunteer_id', '=', volunteerId)
      .executeTakeFirst(),
  ]);

  res.json({
    posting,
    skills,
    hasPendingApplication: Boolean(pendingApplication),
    isEnrolled: Boolean(existingEnrollment),
  });
});

volunteerPostingRouter.post('/:id/enroll', async (req, res: Response<VolunteerPostingEnrollResponse>) => {
  const volunteerId = req.userJWT!.id;
  const { id } = postingIdParamsSchema.parse(req.params);
  const { message } = applyBodySchema.parse(req.body ?? {});

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id', 'is_open'])
    .where('id', '=', id)
    .executeTakeFirst();

  if (!posting) {
    res.status(404);
    throw new Error('Posting not found');
  }

  const [existingApplication, existingEnrollment] = await Promise.all([
    database
      .selectFrom('enrollment_application')
      .select('id')
      .where('posting_id', '=', id)
      .where('volunteer_id', '=', volunteerId)
      .executeTakeFirst(),
    database
      .selectFrom('enrollment')
      .select('id')
      .where('posting_id', '=', id)
      .where('volunteer_id', '=', volunteerId)
      .executeTakeFirst(),
  ]);

  if (existingApplication || existingEnrollment) {
    res.status(409);
    throw new Error('You are already enrolled or have already applied to this posting');
  }

  let enrollment: Enrollment | EnrollmentApplication | undefined;

  if (posting.is_open) {
    enrollment = await database
      .insertInto('enrollment')
      .values({
        volunteer_id: volunteerId,
        posting_id: id,
        message: message ?? undefined,
        attended: false,
      })
      .returningAll()
      .executeTakeFirst();
  } else {
    enrollment = await database
      .insertInto('enrollment_application')
      .values({
        volunteer_id: volunteerId,
        posting_id: id,
        message: message ?? undefined,
      })
      .returningAll()
      .executeTakeFirst();
  }

  if (!enrollment) {
    res.status(500);
    throw new Error('Failed to create enrollment');
  }

  res.json({ enrollment, isOpen: posting.is_open });
});

volunteerPostingRouter.delete('/:id/enroll', async (req, res: Response<VolunteerPostingWithdrawResponse>) => {
  const volunteerId = req.userJWT!.id;
  const { id } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id', 'is_open'])
    .where('id', '=', id)
    .executeTakeFirst();

  if (!posting) {
    res.status(404);
    throw new Error('Posting not found');
  }

  const existingEnrollment = await database
    .selectFrom('enrollment')
    .select(['id', 'attended'])
    .where('volunteer_id', '=', volunteerId)
    .where('posting_id', '=', id)
    .executeTakeFirst();

  await Promise.all([
    database
      .deleteFrom('enrollment')
      .where('volunteer_id', '=', volunteerId)
      .where('posting_id', '=', id)
      .execute(),
    !posting.is_open && database
      .deleteFrom('enrollment_application')
      .where('volunteer_id', '=', volunteerId)
      .where('posting_id', '=', id)
      .execute(),
  ]);

  if (existingEnrollment?.attended) {
    await recomputeVolunteerExperienceVector(volunteerId);
  }

  res.json({});
});

export default volunteerPostingRouter;
