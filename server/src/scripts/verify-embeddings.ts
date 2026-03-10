import bcrypt from 'bcrypt';
import { sql } from 'kysely';

import config from '../config.js';
import database from '../db/index.js';
import { EMBEDDING_DIMENSIONS } from '../services/embeddings/embeddingService.js';
import {
  recomputeOrganizationVector,
  recomputePostingVectors,
  recomputeVolunteerExperienceVector,
  recomputeVolunteerProfileVector,
} from '../services/embeddings/embeddingUpdateService.js';

const TEST_PASSWORD_HASH = await bcrypt.hash('Willing123', 10);

const ensureOrganization = async () => {
  const existing = await database
    .selectFrom('organization_account')
    .select(['id'])
    .orderBy('id', 'asc')
    .executeTakeFirst();

  if (existing) return existing.id;

  const inserted = await database
    .insertInto('organization_account')
    .values({
      name: 'Embedding Verify Org',
      email: `embedding-org-${Date.now()}@willing.test`,
      phone_number: `+96181${String(Date.now()).slice(-6)}`,
      url: `https://embedding-org-${Date.now()}.test`,
      latitude: 33.8938,
      longitude: 35.5018,
      location_name: 'Beirut',
      password: TEST_PASSWORD_HASH,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return inserted.id;
};

const ensurePosting = async (organizationId: number) => {
  const existing = await database
    .selectFrom('organization_posting')
    .select(['id'])
    .where('organization_id', '=', organizationId)
    .orderBy('id', 'asc')
    .executeTakeFirst();

  if (existing) return existing.id;

  const inserted = await database
    .insertInto('organization_posting')
    .values({
      organization_id: organizationId,
      title: 'Embedding Verification Posting',
      description: 'Posting used to verify vector generation and context composition.',
      latitude: 33.8938,
      longitude: 35.5018,
      location_name: 'Beirut',
      max_volunteers: 10,
      start_timestamp: new Date('2026-03-01T09:00:00Z'),
      end_timestamp: new Date('2026-03-01T12:00:00Z'),
      minimum_age: 18,
      is_open: true,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  await database
    .insertInto('posting_skill')
    .values([
      { posting_id: inserted.id, name: 'Coordination' },
      { posting_id: inserted.id, name: 'Communication' },
    ])
    .execute();

  return inserted.id;
};

const ensureVolunteer = async () => {
  const existing = await database
    .selectFrom('volunteer_account')
    .select(['id'])
    .orderBy('id', 'asc')
    .executeTakeFirst();

  if (existing) return existing.id;

  const inserted = await database
    .insertInto('volunteer_account')
    .values({
      first_name: 'Embedding',
      last_name: 'Verifier',
      email: `embedding-vol-${Date.now()}@willing.test`,
      password: TEST_PASSWORD_HASH,
      date_of_birth: '2000-01-01',
      gender: 'other',
      description: 'Volunteer used for embedding verification.',
      privacy: 'public',
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  await database
    .insertInto('volunteer_skill')
    .values([
      { volunteer_id: inserted.id, name: 'Teaching' },
      { volunteer_id: inserted.id, name: 'First Aid' },
    ])
    .execute();

  return inserted.id;
};

const ensureAttendedEnrollment = async (volunteerId: number, postingId: number) => {
  const existing = await database
    .selectFrom('enrollment')
    .select('id')
    .where('volunteer_id', '=', volunteerId)
    .where('posting_id', '=', postingId)
    .where('attended', '=', true)
    .executeTakeFirst();

  if (existing) return existing.id;

  const inserted = await database
    .insertInto('enrollment')
    .values({
      volunteer_id: volunteerId,
      posting_id: postingId,
      message: 'Embedding verification enrollment',
      attended: true,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return inserted.id;
};

const getVectorDims = async (query: ReturnType<typeof sql>) => {
  const result = await query.execute(database);
  return result.rows[0] as Record<string, number | null> | undefined;
};

const assertDim = (label: string, value: number | null | undefined) => {
  if (value !== EMBEDDING_DIMENSIONS) {
    throw new Error(`${label} dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, got ${String(value)}`);
  }
};

async function verifyEmbeddings() {
  if (config.NODE_ENV === 'production') {
    throw new Error('Refusing to run embedding verification in production.');
  }

  console.log('OpenAI path:', config.OPENAI_API_KEY ? 'OPENAI_API_KEY configured (OpenAI expected)' : 'OPENAI_API_KEY missing (deterministic fallback expected)');

  const organizationId = await ensureOrganization();
  const postingId = await ensurePosting(organizationId);
  const volunteerId = await ensureVolunteer();

  await recomputeOrganizationVector(organizationId);
  const orgDims = await getVectorDims(sql`
    SELECT vector_dims(org_vector) as org_vector_dims
    FROM organization_account
    WHERE id = ${organizationId}
  `);
  assertDim('organization.org_vector', orgDims?.org_vector_dims);
  console.log('organization.org_vector dims:', orgDims?.org_vector_dims);

  await recomputePostingVectors(postingId);
  const postingDims = await getVectorDims(sql`
    SELECT
      vector_dims(opportunity_vector) as opportunity_vector_dims,
      vector_dims(posting_context_vector) as posting_context_vector_dims
    FROM organization_posting
    WHERE id = ${postingId}
  `);
  assertDim('organization_posting.opportunity_vector', postingDims?.opportunity_vector_dims);
  assertDim('organization_posting.posting_context_vector', postingDims?.posting_context_vector_dims);
  console.log('organization_posting.opportunity_vector dims:', postingDims?.opportunity_vector_dims);
  console.log('organization_posting.posting_context_vector dims:', postingDims?.posting_context_vector_dims);
  console.log('posting context combine rule: 0.7 * opportunity + 0.3 * organization');

  await recomputeVolunteerProfileVector(volunteerId);
  const volunteerProfileDims = await getVectorDims(sql`
    SELECT vector_dims(profile_vector) as profile_vector_dims
    FROM volunteer_account
    WHERE id = ${volunteerId}
  `);
  assertDim('volunteer_account.profile_vector', volunteerProfileDims?.profile_vector_dims);
  console.log('volunteer_account.profile_vector dims:', volunteerProfileDims?.profile_vector_dims);

  await ensureAttendedEnrollment(volunteerId, postingId);
  await recomputeVolunteerExperienceVector(volunteerId);
  const volunteerExperienceDims = await getVectorDims(sql`
    SELECT vector_dims(experience_vector) as experience_vector_dims
    FROM volunteer_account
    WHERE id = ${volunteerId}
  `);
  assertDim('volunteer_account.experience_vector', volunteerExperienceDims?.experience_vector_dims);
  console.log('volunteer_account.experience_vector dims:', volunteerExperienceDims?.experience_vector_dims);

  console.log('Embedding verification completed successfully.');
}

verifyEmbeddings()
  .catch((error) => {
    console.error('Embedding verification failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.destroy();
  });
