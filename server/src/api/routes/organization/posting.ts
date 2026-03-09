import { Router, Response } from 'express';
import zod from 'zod';

import {
  OrganizationPostingApplicationAcceptanceResponse,
  OrganizationPostingApplicationRejectionResponse,
  OrganizationPostingEnrollmentAttendanceUpdateResponse,
  OrganizationPostingApplicationsReponse,
  OrganizationPostingCreateResponse,
  OrganizationPostingDeleteResponse,
  OrganizationPostingEnrollmentsResponse,
  OrganizationPostingListResponse,
  OrganizationPostingResponse,
  OrganizationPostingUpdateResponse,
} from './posting.types.js';
import database from '../../../db/index.js';
import {
  newOrganizationPostingSchema,
  type NewOrganizationPosting,
  type PostingSkill,
} from '../../../db/tables.js';
import {
  recomputePostingVectors,
  recomputeVolunteerExperienceVector,
} from '../../../services/embeddingUpdateService.js';
import {
  sendVolunteerApplicationAcceptedEmail,
  sendVolunteerApplicationRejectedEmail,
} from '../../../SMTP/emails.js';

const postingRouter = Router();
const organizationPostingUpdateSchema = newOrganizationPostingSchema.partial();

const normalizeSkillList = (skills: string[]) => Array.from(new Set(skills.map(skill => skill.trim()).filter(Boolean))).sort();
const areSkillListsEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};
const areDatesEqual = (left: Date | undefined, right: Date | undefined) => (left?.getTime() ?? null) === (right?.getTime() ?? null);

const postingIdParamsSchema = zod.object({
  id: zod.coerce.number().int().positive('ID must be a positive number'),
});
const attendanceUpdateBodySchema = zod.object({
  attended: zod.boolean(),
});

postingRouter.post('/', async (req, res: Response<OrganizationPostingCreateResponse>) => {
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

    if (body.skills && body.skills.length > 0) {
      const skillRows = body.skills.map(skill => ({
        posting_id: newPosting.id,
        name: skill,
      }));

      await trx.insertInto('posting_skill').values(skillRows).execute();
    }

    return { postingId: newPosting.id };
  });

  await recomputePostingVectors(result.postingId);

  const posting = await database
    .selectFrom('organization_posting')
    .selectAll()
    .where('id', '=', result.postingId)
    .executeTakeFirstOrThrow();

  const skills: PostingSkill[] = await database
    .selectFrom('posting_skill')
    .selectAll()
    .where('posting_id', '=', result.postingId)
    .execute();

  res.json({ posting, skills });
});

postingRouter.get('/', async (req, res: Response<OrganizationPostingListResponse>) => {
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

  res.json({ postings: postingsWithSkills });
});

postingRouter.get('/:id', async (req, res: Response<OrganizationPostingResponse>) => {
  const orgId = req.userJWT!.id;
  const { id: postingId } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .selectAll()
    .where('organization_posting.id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404);
    throw new Error('Posting not found');
  }

  const skills = await database
    .selectFrom('posting_skill')
    .selectAll()
    .where('posting_id', '=', postingId)
    .execute();

  res.json({ posting, skills });
});

postingRouter.get('/:id/enrollments', async (req, res: Response<OrganizationPostingEnrollmentsResponse>) => {
  const orgId = req.userJWT!.id;
  const { id: postingId } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id'])
    .where('organization_posting.id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404);
    throw new Error('Posting not found');
  }

  const enrollments = await database
    .selectFrom('enrollment')
    .innerJoin('volunteer_account', 'volunteer_account.id', 'enrollment.volunteer_id')
    .select([
      'enrollment.id as enrollment_id',
      'enrollment.volunteer_id',
      'enrollment.message',
      'enrollment.attended',
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

postingRouter.patch('/:id/enrollments/:enrollmentId/attendance', async (req, res: Response<OrganizationPostingEnrollmentAttendanceUpdateResponse>) => {
  const orgId = req.userJWT!.id;
  const { id: postingId, enrollmentId } = zod.object({
    id: zod.coerce.number().int().positive(),
    enrollmentId: zod.coerce.number().int().positive(),
  }).parse(req.params);
  const body = attendanceUpdateBodySchema.parse(req.body);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id'])
    .where('organization_posting.id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404);
    throw new Error('Posting not found');
  }

  const enrollment = await database
    .selectFrom('enrollment')
    .select(['id', 'volunteer_id', 'posting_id'])
    .where('id', '=', enrollmentId)
    .executeTakeFirst();

  if (!enrollment || enrollment.posting_id !== postingId) {
    res.status(404);
    throw new Error('Enrollment not found');
  }

  await database
    .updateTable('enrollment')
    .set({ attended: body.attended })
    .where('id', '=', enrollmentId)
    .execute();

  await recomputeVolunteerExperienceVector(enrollment.volunteer_id);

  res.json({});
});

postingRouter.put('/:id', async (req, res: Response<OrganizationPostingUpdateResponse>) => {
  const orgId = req.userJWT!.id;
  const { id: postingId } = postingIdParamsSchema.parse(req.params);
  const body = organizationPostingUpdateSchema.parse(req.body);

  const posting = await database
    .selectFrom('organization_posting')
    .select([
      'id',
      'title',
      'description',
      'location_name',
      'start_timestamp',
      'end_timestamp',
      'minimum_age',
      'max_volunteers',
    ])
    .where('id', '=', postingId)
    .where('organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404);
    throw new Error('Posting not found');
  }

  const existingSkills = await database
    .selectFrom('posting_skill')
    .select('name')
    .where('posting_id', '=', postingId)
    .execute();

  const normalizedExistingSkills = normalizeSkillList(existingSkills.map(skill => skill.name));
  const normalizedIncomingSkills = body.skills !== undefined ? normalizeSkillList(body.skills) : undefined;
  const didSkillsChange = normalizedIncomingSkills !== undefined
    ? !areSkillListsEqual(normalizedIncomingSkills, normalizedExistingSkills)
    : false;

  const shouldRecomputePostingVectors = (
    (body.title !== undefined && body.title !== posting.title)
    || (body.description !== undefined && body.description !== posting.description)
    || (body.location_name !== undefined && body.location_name !== posting.location_name)
    || (body.start_timestamp !== undefined && !areDatesEqual(body.start_timestamp, posting.start_timestamp))
    || (body.end_timestamp !== undefined && !areDatesEqual(body.end_timestamp, posting.end_timestamp))
    || (body.minimum_age !== undefined && (body.minimum_age ?? null) !== (posting.minimum_age ?? null))
    || (body.max_volunteers !== undefined && (body.max_volunteers ?? null) !== (posting.max_volunteers ?? null))
    || didSkillsChange
  );

  await database.transaction().execute(async (trx) => {
    const postingFields: Record<string, unknown> = {};

    if (body.title !== undefined) postingFields.title = body.title;
    if (body.description !== undefined) postingFields.description = body.description;
    if (body.latitude !== undefined) postingFields.latitude = body.latitude;
    if (body.longitude !== undefined) postingFields.longitude = body.longitude;
    if (body.max_volunteers !== undefined) postingFields.max_volunteers = body.max_volunteers;
    if (body.start_timestamp !== undefined) postingFields.start_timestamp = body.start_timestamp;
    if (body.end_timestamp !== undefined) postingFields.end_timestamp = body.end_timestamp;
    if (body.minimum_age !== undefined) postingFields.minimum_age = body.minimum_age;
    if (body.is_open !== undefined) postingFields.is_open = body.is_open;
    if (body.location_name !== undefined) postingFields.location_name = body.location_name;

    if (Object.keys(postingFields).length > 0) {
      await trx
        .updateTable('organization_posting')
        .set(postingFields)
        .where('id', '=', postingId)
        .where('organization_id', '=', orgId)
        .execute();
    }

    if (didSkillsChange) {
      await trx
        .deleteFrom('posting_skill')
        .where('posting_id', '=', postingId)
        .execute();

      if (normalizedIncomingSkills && normalizedIncomingSkills.length > 0) {
        await trx
          .insertInto('posting_skill')
          .values(normalizedIncomingSkills.map(name => ({
            posting_id: postingId,
            name,
          })))
          .execute();
      }
    }
  });

  if (shouldRecomputePostingVectors) {
    await recomputePostingVectors(postingId);
  }

  const updatedPosting = await database
    .selectFrom('organization_posting')
    .selectAll()
    .where('id', '=', postingId)
    .where('organization_id', '=', orgId)
    .executeTakeFirstOrThrow();

  const skills = await database
    .selectFrom('posting_skill')
    .selectAll()
    .where('posting_id', '=', postingId)
    .execute();

  res.json({ posting: updatedPosting, skills });
});

postingRouter.delete('/:id', async (req, res: Response<OrganizationPostingDeleteResponse>) => {
  const orgId = req.userJWT!.id;
  const { id: postingId } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id'])
    .where('id', '=', postingId)
    .where('organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404);
    throw new Error('Posting not found');
  }

  const impactedVolunteerRows = await database
    .selectFrom('enrollment')
    .select('volunteer_id')
    .where('posting_id', '=', postingId)
    .where('attended', '=', true)
    .execute();

  await database.transaction().execute(async (trx) => {
    await trx.deleteFrom('posting_skill').where('posting_id', '=', postingId).execute();
    await trx.deleteFrom('enrollment_application').where('posting_id', '=', postingId).execute();
    await trx.deleteFrom('enrollment').where('posting_id', '=', postingId).execute();
    await trx.deleteFrom('organization_posting').where('id', '=', postingId).execute();
  });

  const impactedVolunteerIds = Array.from(new Set(impactedVolunteerRows.map(row => row.volunteer_id)));
  for (const volunteerId of impactedVolunteerIds) {
    await recomputeVolunteerExperienceVector(volunteerId);
  }

  res.json({});
});

postingRouter.get('/:id/applications', async (req, res: Response<OrganizationPostingApplicationsReponse>) => {
  const orgId = req.userJWT!.id;
  const { id: postingId } = postingIdParamsSchema.parse(req.params);

  const posting = await database
    .selectFrom('organization_posting')
    .select(['id', 'is_open'])
    .where('organization_posting.id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  if (!posting) {
    res.status(404);
    throw new Error('Posting not found');
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
      'volunteer_account.cv_file',
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

postingRouter.post('/:id/applications/:applicationId/accept', async (req, res: Response<OrganizationPostingApplicationAcceptanceResponse>) => {
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
    res.status(404);
    throw new Error('Posting not found');
  }

  if (posting.is_open) {
    res.status(400);
    throw new Error('Cannot accept applications for open postings');
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
    res.status(404);
    throw new Error('Application not found');
  }

  if (application.posting_id !== postingId) {
    res.status(403);
    throw new Error('Application does not belong to this posting');
  }
  const emailContext = await database
    .selectFrom('enrollment_application')
    .innerJoin('volunteer_account', 'volunteer_account.id', 'enrollment_application.volunteer_id')
    .innerJoin('organization_posting', 'organization_posting.id', 'enrollment_application.posting_id')
    .innerJoin('organization_account', 'organization_account.id', 'organization_posting.organization_id')
    .select([
      'volunteer_account.email as volunteer_email',
      'volunteer_account.first_name',
      'volunteer_account.last_name',
      'organization_account.name as organization_name',
      'organization_posting.title as posting_title',
    ])
    .where('enrollment_application.id', '=', applicationId)
    .where('enrollment_application.posting_id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  if (!emailContext) {
    res.status(404);
    throw new Error('Application not found');
  }
  await database.transaction().execute(async (trx) => {
    const enrollment = await trx
      .insertInto('enrollment')
      .values({
        volunteer_id: application.volunteer_id,
        posting_id: application.posting_id,
        message: application.message ?? undefined,
        attended: false,
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
  if (emailContext) {
    try {
      await sendVolunteerApplicationAcceptedEmail({
        volunteerEmail: emailContext.volunteer_email,
        volunteerName: `${emailContext.first_name} ${emailContext.last_name}`,
        organizationName: emailContext.organization_name,
        postingTitle: emailContext.posting_title,
      });
    } catch (err) {
      console.error('Failed to send acceptance email:', err);
    }
  }
  res.json({});
});

postingRouter.delete('/:id/applications/:applicationId', async (req, res: Response<OrganizationPostingApplicationRejectionResponse>) => {
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
    res.status(404);
    throw new Error('Posting not found');
  }

  const application = await database
    .selectFrom('enrollment_application')
    .selectAll()
    .where('id', '=', applicationId)
    .executeTakeFirst();

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  if (application.posting_id !== postingId) {
    res.status(403);
    throw new Error('Application does not belong to this posting');
  }
  const emailContext = await database
    .selectFrom('enrollment_application')
    .innerJoin('volunteer_account', 'volunteer_account.id', 'enrollment_application.volunteer_id')
    .innerJoin('organization_posting', 'organization_posting.id', 'enrollment_application.posting_id')
    .innerJoin('organization_account', 'organization_account.id', 'organization_posting.organization_id')
    .select([
      'volunteer_account.email as volunteer_email',
      'volunteer_account.first_name',
      'volunteer_account.last_name',
      'organization_account.name as organization_name',
      'organization_posting.title as posting_title',
    ])
    .where('enrollment_application.id', '=', applicationId)
    .where('enrollment_application.posting_id', '=', postingId)
    .where('organization_posting.organization_id', '=', orgId)
    .executeTakeFirst();

  await database
    .deleteFrom('enrollment_application')
    .where('id', '=', applicationId)
    .execute();
  if (emailContext) {
    try {
      await sendVolunteerApplicationRejectedEmail({
        volunteerEmail: emailContext.volunteer_email,
        volunteerName: `${emailContext.first_name} ${emailContext.last_name}`,
        organizationName: emailContext.organization_name,
        postingTitle: emailContext.posting_title,
      });
    } catch (err) {
      console.error('Failed to send rejection email:', err);
    }
  }

  res.json({});
});

export default postingRouter;
