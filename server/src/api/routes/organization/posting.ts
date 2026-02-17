import { Router } from 'express';

import database from '../../../db/index.js';
import { newOrganizationPostingSchema, type NewOrganizationPosting, type PostingSkill } from '../../../db/tables.js';

const postingRouter = Router();

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

export default postingRouter;
