import { Kysely, Transaction, sql } from 'kysely';

import { extractCvText } from './cvTextService.js';
import { runOrDeferEmbeddingJob } from './embeddingRateLimiter.js';
import {
  combineVectors,
  embedText,
  parseVectorLiteral,
  vectorToSqlLiteral,
  weightedAverage,
} from './embeddingService.js';
import database from '../db/index.js';
import { Database } from '../db/tables.js';

type DBExecutor = Kysely<Database> | Transaction<Database>;

const EXPERIENCE_VECTOR_MAX_ENROLLMENTS = 10;
const EXPERIENCE_VECTOR_DECAY_LAMBDA = 0.35;

const getRecencyRankWeight = (rank: number) => Math.exp(-EXPERIENCE_VECTOR_DECAY_LAMBDA * rank);

const updateOrganizationVector = async (organizationId: number, vector: number[], executor: DBExecutor) => {
  await sql`
    UPDATE organization_account
    SET org_vector = ${vectorToSqlLiteral(vector)}::vector
    WHERE id = ${organizationId}
  `.execute(executor);
};

const updatePostingVectors = async (
  postingId: number,
  opportunityVector: number[],
  postingContextVector: number[],
  executor: DBExecutor,
) => {
  await sql`
    UPDATE organization_posting
    SET
      opportunity_vector = ${vectorToSqlLiteral(opportunityVector)}::vector,
      posting_context_vector = ${vectorToSqlLiteral(postingContextVector)}::vector
    WHERE id = ${postingId}
  `.execute(executor);
};

const updateVolunteerProfileVector = async (volunteerId: number, profileVector: number[], executor: DBExecutor) => {
  await sql`
    UPDATE volunteer_account
    SET profile_vector = ${vectorToSqlLiteral(profileVector)}::vector
    WHERE id = ${volunteerId}
  `.execute(executor);
};

const updateVolunteerExperienceVector = async (volunteerId: number, experienceVector: number[] | null, executor: DBExecutor) => {
  if (!experienceVector) {
    await sql`
      UPDATE volunteer_account
      SET experience_vector = NULL
      WHERE id = ${volunteerId}
    `.execute(executor);
    return;
  }

  await sql`
    UPDATE volunteer_account
    SET experience_vector = ${vectorToSqlLiteral(experienceVector)}::vector
    WHERE id = ${volunteerId}
  `.execute(executor);
};

const buildOrganizationText = (organization: {
  name: string;
  url: string;
  location_name: string;
  latitude: number | undefined;
  longitude: number | undefined;
}) => {
  return [
    `Organization: ${organization.name}`,
    `Website: ${organization.url}`,
    `Location: ${organization.location_name}`,
    `Coordinates: ${organization.latitude ?? ''}, ${organization.longitude ?? ''}`,
  ].join('\n');
};

const buildPostingText = (posting: {
  title: string;
  description: string;
  location_name: string;
  start_timestamp: Date;
  end_timestamp: Date | undefined;
  minimum_age: number | undefined;
  max_volunteers: number | undefined;
}, skills: string[]) => {
  return [
    `Title: ${posting.title}`,
    `Description: ${posting.description}`,
    `Location: ${posting.location_name}`,
    `Start: ${posting.start_timestamp.toISOString()}`,
    `End: ${posting.end_timestamp?.toISOString() ?? ''}`,
    `Minimum age: ${posting.minimum_age ?? ''}`,
    `Max volunteers: ${posting.max_volunteers ?? ''}`,
    `Skills: ${skills.join(', ')}`,
  ].join('\n');
};

const buildVolunteerProfileText = (volunteer: {
  first_name: string;
  last_name: string;
  description: string | undefined;
  gender: 'male' | 'female' | 'other';
}, skills: string[], cvText: string | null) => {
  return [
    `Volunteer: ${volunteer.first_name} ${volunteer.last_name}`,
    `Gender: ${volunteer.gender}`,
    `Description: ${volunteer.description ?? ''}`,
    `Skills: ${skills.join(', ')}`,
    `CV Text: ${cvText ?? ''}`,
  ].join('\n');
};

const recomputeVolunteerExperienceVectorsForPosting = async (postingId: number, executor: DBExecutor) => {
  const volunteers = await executor
    .selectFrom('enrollment')
    .select('volunteer_id')
    .where('posting_id', '=', postingId)
    .where('attended', '=', true)
    .execute();

  const volunteerIds = Array.from(new Set(volunteers.map(volunteer => volunteer.volunteer_id)));
  for (const volunteerId of volunteerIds) {
    await recomputeVolunteerExperienceVector(volunteerId, executor);
  }
};

export const recomputeOrganizationVector = async (organizationId: number, executor: DBExecutor = database) => {
  let computedVector: number[] | null = null;
  const run = async () => {
    const organization = await executor
      .selectFrom('organization_account')
      .select(['id', 'name', 'url', 'location_name', 'latitude', 'longitude'])
      .where('id', '=', organizationId)
      .executeTakeFirstOrThrow();

    const vector = await embedText(buildOrganizationText(organization));
    await updateOrganizationVector(organization.id, vector, executor);
    computedVector = vector;

    await recomputePostingContextVectorsForOrganization(organization.id, executor);
  };

  if (executor === database) {
    const result = await runOrDeferEmbeddingJob(`organization:${organizationId}:org_vector`, run);
    if (!result.executed) return null;
  } else {
    await run();
  }

  return computedVector;
};

const getOrganizationVectorOrCompute = async (organizationId: number, executor: DBExecutor) => {
  const organization = await executor
    .selectFrom('organization_account')
    .select(['org_vector'])
    .where('id', '=', organizationId)
    .executeTakeFirstOrThrow();

  const parsed = parseVectorLiteral(organization.org_vector);
  if (parsed) return parsed;

  return recomputeOrganizationVector(organizationId, executor);
};

export const recomputePostingVectors = async (postingId: number, executor: DBExecutor = database) => {
  let resultVectors: { opportunityVector: number[]; postingContextVector: number[] } | null = null;
  const run = async () => {
    const posting = await executor
      .selectFrom('organization_posting')
      .select([
        'id',
        'organization_id',
        'title',
        'description',
        'location_name',
        'start_timestamp',
        'end_timestamp',
        'minimum_age',
        'max_volunteers',
      ])
      .where('id', '=', postingId)
      .executeTakeFirstOrThrow();

    const skills = await executor
      .selectFrom('posting_skill')
      .select(['name'])
      .where('posting_id', '=', posting.id)
      .execute();

    const opportunityVector = await embedText(buildPostingText(posting, skills.map(skill => skill.name)));
    const organizationVector = await getOrganizationVectorOrCompute(posting.organization_id, executor);

    if (!organizationVector) {
      console.warn(`[embeddings] Missing organization vector for posting ${posting.id}; posting_context_vector not updated.`);
      return;
    }

    const postingContextVector = combineVectors(opportunityVector, organizationVector, 0.7, 0.3);
    await updatePostingVectors(posting.id, opportunityVector, postingContextVector, executor);
    await recomputeVolunteerExperienceVectorsForPosting(posting.id, executor);
    resultVectors = { opportunityVector, postingContextVector };
  };

  if (executor === database) {
    const result = await runOrDeferEmbeddingJob(`posting:${postingId}:opportunity_vector`, run);
    if (!result.executed) return null;
  } else {
    await run();
  }

  return resultVectors;
};

export const recomputeVolunteerProfileVector = async (volunteerId: number, executor: DBExecutor = database) => {
  let computedProfileVector: number[] | null = null;
  const run = async () => {
    const volunteer = await executor
      .selectFrom('volunteer_account')
      .select(['id', 'first_name', 'last_name', 'description', 'gender', 'cv_path'])
      .where('id', '=', volunteerId)
      .executeTakeFirstOrThrow();

    const skills = await executor
      .selectFrom('volunteer_skill')
      .select('name')
      .where('volunteer_id', '=', volunteer.id)
      .execute();

    const cvText = await extractCvText(volunteer.cv_path);
    const profileVector = await embedText(buildVolunteerProfileText(volunteer, skills.map(skill => skill.name), cvText));

    await updateVolunteerProfileVector(volunteer.id, profileVector, executor);
    computedProfileVector = profileVector;
  };

  if (executor === database) {
    const result = await runOrDeferEmbeddingJob(`volunteer:${volunteerId}:profile_vector`, run);
    if (!result.executed) return null;
  } else {
    await run();
  }

  return computedProfileVector;
};

export const recomputeVolunteerExperienceVector = async (volunteerId: number, executor: DBExecutor = database) => {
  const rows = await executor
    .selectFrom('enrollment')
    .innerJoin('organization_posting', 'organization_posting.id', 'enrollment.posting_id')
    .select(['organization_posting.posting_context_vector'])
    .where('enrollment.volunteer_id', '=', volunteerId)
    .where('enrollment.attended', '=', true)
    .orderBy('enrollment.created_at', 'desc')
    .limit(EXPERIENCE_VECTOR_MAX_ENROLLMENTS)
    .execute();

  const vectors: number[][] = [];
  const weights: number[] = [];

  rows.forEach((row, index) => {
    const parsed = parseVectorLiteral(row.posting_context_vector);
    if (!parsed) return;
    vectors.push(parsed);
    weights.push(getRecencyRankWeight(index));
  });

  if (vectors.length === 0) {
    if (rows.length === 0) {
      console.info(`[embeddings] No attended experiences found for volunteer ${volunteerId}. Leaving experience_vector as NULL.`);
    } else {
      console.warn(`[embeddings] Attended enrollments exist for volunteer ${volunteerId}, but no valid posting_context_vector values were found.`);
    }
    await updateVolunteerExperienceVector(volunteerId, null, executor);
    return null;
  }

  // More recent experiences receive higher rank-based weights.
  const experienceVector = weightedAverage(vectors, weights);
  await updateVolunteerExperienceVector(volunteerId, experienceVector, executor);
  return experienceVector;
};

export const recomputePostingContextVectorsForOrganization = async (organizationId: number, executor: DBExecutor = database) => {
  const organization = await executor
    .selectFrom('organization_account')
    .select(['org_vector'])
    .where('id', '=', organizationId)
    .executeTakeFirstOrThrow();

  const orgVector = parseVectorLiteral(organization.org_vector);
  if (!orgVector) return;

  const postings = await executor
    .selectFrom('organization_posting')
    .select(['id', 'opportunity_vector'])
    .where('organization_id', '=', organizationId)
    .execute();

  for (const posting of postings) {
    const opportunityVector = parseVectorLiteral(posting.opportunity_vector);
    if (!opportunityVector) {
      await recomputePostingVectors(posting.id, executor);
      continue;
    }

    const postingContextVector = combineVectors(opportunityVector, orgVector, 0.7, 0.3);
    await sql`
      UPDATE organization_posting
      SET posting_context_vector = ${vectorToSqlLiteral(postingContextVector)}::vector
      WHERE id = ${posting.id}
    `.execute(executor);
    await recomputeVolunteerExperienceVectorsForPosting(posting.id, executor);
  }
};

export const recomputeVolunteerVectors = async (volunteerId: number, executor: DBExecutor = database) => {
  const [profileVector, experienceVector] = await Promise.all([
    recomputeVolunteerProfileVector(volunteerId, executor),
    recomputeVolunteerExperienceVector(volunteerId, executor),
  ]);

  return { profileVector, experienceVector };
};
