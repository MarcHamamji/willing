import { Router } from 'express';
import zod from 'zod';

import database from '../../../db/index.js';
import {
  newOrganizationPostingSchema,
  type NewOrganizationPosting,
  type PostingSkill,
} from '../../../db/tables.js';

const postingRouter = Router();

const postingIdParamsSchema = zod.object({
  id: zod.coerce.number().int().positive('ID must be a positive number'),
});

postingRouter.post('/', async (req, res) => {
  const body: NewOrganizationPosting = newOrganizationPostingSchema.parse(req.body);
  const orgId = req.userJWT!.id;

  const result = await database.transaction().execute(async (trx) => {
    const newPosting = await trx
      .insertInto('organization_posting')
      .values({
        organization_id: orgId,
        title: body.title,
        description: body.description,
        latitude: body.latitude ?? undefined,
        longitude: body.longitude ?? undefined,
        max_volunteers: body.max_volunteers ?? undefined,
        start_timestamp: body.start_timestamp,
        end_timestamp: body.end_timestamp ?? undefined,
        minimum_age: body.minimum_age ?? undefined,
        is_open: body.is_open ?? true,
        location_name: body.location_name,
      })
      .returningAll()
      .executeTakeFirst();

    if (!newPosting) {
      throw new Error('Failed to create posting');
    }

    let skills: PostingSkill[] = [];
    if (body.skills && body.skills.length > 0) {
      const skillRows = body.skills.map(skill => ({
        posting_id: newPosting.id,
        name: skill,
      }));

      skills = await trx.insertInto('posting_skill').values(skillRows).returningAll().execute();
    }

    return { posting: newPosting, skills };
  });

  res.json({ posting: result.posting, skills: result.skills });
});

postingRouter.get('/', async (req, res) => {
  const orgId = req.userJWT!.id;

  const postings = await database
    .selectFrom('organization_posting')
    .selectAll()
    .where('organization_id', '=', orgId)
    .orderBy('start_timestamp', 'asc')
    .execute();

  const postingIds = postings.map(p => p.id);
  const skills = postingIds.length > 0
    ? await database
        .selectFrom('posting_skill')
        .selectAll()
        .where('posting_id', 'in', postingIds)
        .execute()
    : [];

  const skillsByPostingId = new Map<number, PostingSkill[]>();
  skills.forEach((skill) => {
    if (!skillsByPostingId.has(skill.posting_id)) {
      skillsByPostingId.set(skill.posting_id, []);
    }
    skillsByPostingId.get(skill.posting_id)!.push(skill);
  });

  const postingsWithSkills = postings.map(posting => ({
    ...posting,
    skills: skillsByPostingId.get(posting.id) || [],
  }));

  res.json({ posting: postingsWithSkills });
});

postingRouter.get('/:id', async (req, res) => {
  const orgId = req.userJWT!.id;
  const { id: postingId } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .selectAll()
    .where('organization_posting.id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404).json({ error: 'Posting not found' });
    return;
  }

  const skills = await database
    .selectFrom('posting_skill')
    .selectAll()
    .where('posting_id', '=', postingId)
    .execute();

  res.json({ posting, skills });
});

postingRouter.get('/:id/enrollments', async (req, res) => {
  const orgId = req.userJWT!.id;
  const { id: postingId } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id'])
    .where('organization_posting.id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404).json({ error: 'Posting not found' });
    return;
  }

  const enrollments = await database
    .selectFrom('enrollment')
    .innerJoin('volunteer_account', 'volunteer_account.id', 'enrollment.volunteer_id')
    .select([
      'enrollment.id as enrollment_id',
      'enrollment.volunteer_id',
      'enrollment.message',
      'volunteer_account.first_name',
      'volunteer_account.last_name',
      'volunteer_account.email',
      'volunteer_account.date_of_birth',
      'volunteer_account.gender',
    ])
    .where('enrollment.posting_id', '=', postingId)
    .execute();

  const volunteerIds = enrollments.map(e => e.volunteer_id);
  const skills = volunteerIds.length > 0
    ? await database
        .selectFrom('volunteer_skill')
        .selectAll()
        .where('volunteer_id', 'in', volunteerIds)
        .execute()
    : [];

  const skillsByVolunteerId = new Map<number, typeof skills>();
  skills.forEach((skill) => {
    if (!skillsByVolunteerId.has(skill.volunteer_id)) {
      skillsByVolunteerId.set(skill.volunteer_id, []);
    }
    skillsByVolunteerId.get(skill.volunteer_id)!.push(skill);
  });

  const enrollmentsWithSkills = enrollments.map(enrollment => ({
    ...enrollment,
    skills: skillsByVolunteerId.get(enrollment.volunteer_id) || [],
  }));

  res.json({ enrollments: enrollmentsWithSkills });
});

postingRouter.put('/:id', async (req, res) => {
  const orgId = req.userJWT!.id;
  const { id: postingId } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id'])
    .where('id', '=', postingId)
    .where('organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404).json({ error: 'Posting not found' });
    return;
  }

  const body: Partial<NewOrganizationPosting> = req.body;

  const result = await database.transaction().execute(async (trx) => {
    const updatedPosting = await trx
      .updateTable('organization_posting')
      .set({
        title: body.title,
        description: body.description,
        latitude: body.latitude ?? undefined,
        longitude: body.longitude ?? undefined,
        max_volunteers: body.max_volunteers ?? undefined,
        start_timestamp: body.start_timestamp,
        end_timestamp: body.end_timestamp ?? undefined,
        minimum_age: body.minimum_age ?? undefined,
        is_open: body.is_open ?? true,
        location_name: body.location_name,
      })
      .where('id', '=', postingId)
      .returningAll()
      .executeTakeFirst();

    if (!updatedPosting) {
      throw new Error('Failed to update posting');
    }

    await trx.deleteFrom('posting_skill').where('posting_id', '=', postingId).execute();

    let skills: PostingSkill[] = [];
    if (body.skills && body.skills.length > 0) {
      const skillRows = body.skills.map(skill => ({
        posting_id: postingId,
        name: skill,
      }));

      skills = await trx.insertInto('posting_skill').values(skillRows).returningAll().execute();
    }

    return { posting: updatedPosting, skills };
  });

  res.json({ posting: result.posting, skills: result.skills });
});

postingRouter.delete('/:id', async (req, res) => {
  const orgId = req.userJWT!.id;
  const { id: postingId } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id'])
    .where('id', '=', postingId)
    .where('organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404).json({ error: 'Posting not found' });
    return;
  }

  await database.transaction().execute(async (trx) => {
    await trx.deleteFrom('posting_skill').where('posting_id', '=', postingId).execute();
    await trx.deleteFrom('enrollment_application').where('posting_id', '=', postingId).execute();
    await trx.deleteFrom('enrollment').where('posting_id', '=', postingId).execute();
    await trx.deleteFrom('organization_posting').where('id', '=', postingId).execute();
  });

  res.json({});
});

postingRouter.get('/:id/applications', async (req, res) => {
  const orgId = req.userJWT!.id;
  const { id: postingId } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id', 'is_open'])
    .where('organization_posting.id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404).json({ error: 'Posting not found' });
    return;
  }

  if (posting.is_open) {
    res.json({ applications: [] });
    return;
  }

  const applications = await database
    .selectFrom('enrollment_application')
    .innerJoin('volunteer_account', 'volunteer_account.id', 'enrollment_application.volunteer_id')
    .select([
      'enrollment_application.id as application_id',
      'enrollment_application.volunteer_id',
      'enrollment_application.message',
      'enrollment_application.created_at',
      'volunteer_account.first_name',
      'volunteer_account.last_name',
      'volunteer_account.email',
      'volunteer_account.date_of_birth',
      'volunteer_account.gender',
    ])
    .where('enrollment_application.posting_id', '=', postingId)
    .execute();

  const volunteerIds = applications.map(a => a.volunteer_id);
  const skills = volunteerIds.length > 0
    ? await database
        .selectFrom('volunteer_skill')
        .selectAll()
        .where('volunteer_id', 'in', volunteerIds)
        .execute()
    : [];

  const skillsByVolunteerId = new Map<number, typeof skills>();
  skills.forEach((skill) => {
    if (!skillsByVolunteerId.has(skill.volunteer_id)) {
      skillsByVolunteerId.set(skill.volunteer_id, []);
    }
    skillsByVolunteerId.get(skill.volunteer_id)!.push(skill);
  });

  const applicationsWithSkills = applications.map(app => ({
    ...app,
    skills: skillsByVolunteerId.get(app.volunteer_id) || [],
  }));

  res.json({ applications: applicationsWithSkills });
});

postingRouter.post('/:id/applications/:applicationId/accept', async (req, res) => {
  const orgId = req.userJWT!.id;
  const { id: postingId, applicationId } = zod.object({
    id: zod.coerce.number().int().positive(),
    applicationId: zod.coerce.number().int().positive(),
  }).parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id', 'is_open'])
    .where('organization_posting.id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404).json({ error: 'Posting not found' });
    return;
  }

  if (posting.is_open) {
    res.status(400).json({ error: 'Cannot accept applications for open postings' });
    return;
  }

  const application = await database
    .selectFrom('enrollment_application')
    .select([
      'enrollment_application.id',
      'enrollment_application.volunteer_id',
      'enrollment_application.posting_id',
      'enrollment_application.message',
    ])
    .where('enrollment_application.id', '=', applicationId)
    .executeTakeFirst();

  if (!application) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  if (application.posting_id !== postingId) {
    res.status(403).json({ error: 'Application does not belong to this posting' });
    return;
  }

  await database.transaction().execute(async (trx) => {
    const enrollment = await trx
      .insertInto('enrollment')
      .values({
        volunteer_id: application.volunteer_id,
        posting_id: application.posting_id,
        message: application.message ?? undefined,
      })
      .returningAll()
      .executeTakeFirst();

    if (!enrollment) {
      throw new Error('Failed to create enrollment');
    }

    await trx
      .deleteFrom('enrollment_application')
      .where('id', '=', applicationId)
      .execute();
  });

  res.json({ });
});

postingRouter.delete('/:id/applications/:applicationId', async (req, res) => {
  const orgId = req.userJWT!.id;
  const { id: postingId, applicationId } = zod.object({
    id: zod.coerce.number().int().positive(),
    applicationId: zod.coerce.number().int().positive(),
  }).parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id', 'is_open'])
    .where('organization_posting.id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404).json({ error: 'Posting not found' });
    return;
  }

  const application = await database
    .selectFrom('enrollment_application')
    .selectAll()
    .where('id', '=', applicationId)
    .executeTakeFirst();

  if (!application) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  if (application.posting_id !== postingId) {
    res.status(403).json({ error: 'Application does not belong to this posting' });
    return;
  }

  await database
    .deleteFrom('enrollment_application')
    .where('id', '=', applicationId)
    .execute();

  res.json({ });
});

export default postingRouter;
