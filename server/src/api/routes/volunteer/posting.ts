import { Router } from 'express';
import zod from 'zod';

import database from '../../../db/index.js';
import { authorizeOnly } from '../../authorization.js';

const volunteerPostingRouter = Router();

const postingIdParamsSchema = zod.object({
  id: zod.coerce.number().int().positive('ID must be a positive number'),
});

const applyBodySchema = zod.object({
  message: zod.string().trim().min(1, 'Message cannot be empty').optional(),
});

volunteerPostingRouter.use(authorizeOnly('volunteer'));

volunteerPostingRouter.get('/', async (req, res) => {
  const { location_name, start_timestamp, end_timestamp, skill } = req.query;

  let query = database
    .selectFrom('organization_posting')
    .innerJoin(
      'organization_account',
      'organization_account.id',
      'organization_posting.organization_id',
    )
    .selectAll('organization_posting')
    .select(['organization_account.name as organization_name']);

  if (location_name) {
    query = query.where(
      'organization_posting.location_name',
      'ilike',
      `%${location_name}%`,
    );
  }

  if (start_timestamp) {
    query = query.where(
      'organization_posting.start_timestamp',
      '>=',
      new Date(start_timestamp as string),
    );
  }

  if (end_timestamp) {
    query = query.where(
      'organization_posting.end_timestamp',
      '<=',
      new Date(end_timestamp as string),
    );
  }

  const postings = await query
    .orderBy('organization_posting.start_timestamp', 'asc')
    .execute();

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

  let postingWithSkills = postings.map(posting => ({
    ...posting,
    skills: skillsByPostingId.get(posting.id) || [],
  }));

  if (skill) {
    postingWithSkills = postingWithSkills.filter(posting =>
      posting.skills.some(s =>
        s.name.toLowerCase().includes((skill as string).toLowerCase()),
      ),
    );
  }

  res.json({ postings: postingWithSkills });
});

volunteerPostingRouter.get('/:id', async (req, res) => {
  const volunteerId = req.userJWT!.id;
  const { id } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .selectAll()
    .where('organization_posting.id', '=', id)
    .executeTakeFirst();

  if (!posting) {
    res.status(404).json({ error: 'Posting not found' });
    return;
  }

  const skills = await database
    .selectFrom('posting_skill')
    .selectAll()
    .where('posting_id', '=', id)
    .execute();

  const existingEnrollment = await database
    .selectFrom('enrollment_application')
    .select('id')
    .where('posting_id', '=', id)
    .where('volunteer_id', '=', volunteerId)
    .executeTakeFirst();

  res.json({ posting, skills, isEnrolled: Boolean(existingEnrollment) });
});

volunteerPostingRouter.post('/:id/enroll', async (req, res) => {
  const volunteerId = req.userJWT!.id;
  const { id } = postingIdParamsSchema.parse(req.params);
  const { message } = applyBodySchema.parse(req.body ?? {});

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id', 'is_open'])
    .where('id', '=', id)
    .executeTakeFirst();

  if (!posting) {
    res.status(404).json({ error: 'Posting not found' });
    return;
  }

  const existingApplication = await database
    .selectFrom('enrollment_application')
    .select('id')
    .where('posting_id', '=', id)
    .where('volunteer_id', '=', volunteerId)
    .executeTakeFirst();

  if (existingApplication) {
    res.status(409).json({ error: 'You have already applied to this posting' });
    return;
  }

  const application = await database
    .insertInto('enrollment_application')
    .values({
      volunteer_id: volunteerId,
      posting_id: id,
      message: message ?? undefined,
    })
    .returningAll()
    .executeTakeFirst();

  if (!application) {
    res.status(500).json({ error: 'Failed to create application' });
    return;
  }

  res.json({ application, isOpen: posting.is_open });
});

volunteerPostingRouter.delete('/:id/enroll', async (req, res) => {
  const volunteerId = req.userJWT!.id;
  const { id } = postingIdParamsSchema.parse(req.params);

  const application = await database
    .selectFrom('enrollment_application')
    .selectAll()
    .where('posting_id', '=', id)
    .where('volunteer_id', '=', volunteerId)
    .executeTakeFirst();

  if (!application) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  await database
    .deleteFrom('enrollment_application')
    .where('id', '=', application.id)
    .execute();

  res.json({});
});

export default volunteerPostingRouter;
